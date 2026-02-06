// ============================================================================
// RENTAL INVENTORY MANAGEMENT SYSTEM - BACKEND API
// ============================================================================
// Tech Stack: Node.js + Express.js + PostgreSQL
// Port: 3001
// ============================================================================

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors()); // Allow requests from frontend (port 5173)
app.use(express.json()); // Parse JSON request bodies

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rental_inventory',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

// ----------------------------------------------------------------------------
// 1. INVENTORY AVAILABILITY CHECK (CORE FEATURE)
// ----------------------------------------------------------------------------
app.get('/api/inventory/availability', async (req, res) => {
  const { sku, start_date, end_date } = req.query;
  
  try {
    const query = `
      SELECT 
        p.sku,
        p.name,
        p.quantity as total_quantity,
        COALESCE(SUM(
          CASE 
            WHEN li.start_date <= $2 AND li.end_date >= $1
            THEN 1 
            ELSE 0 
          END
        ), 0) as rented_quantity,
        p.quantity - COALESCE(SUM(
          CASE 
            WHEN li.start_date <= $2 AND li.end_date >= $1
            THEN 1 
            ELSE 0 
          END
        ), 0) as available_quantity
      FROM "Product" p
      LEFT JOIN "Line_item" li ON p.sku = li.sku
      WHERE p.sku = $3
      GROUP BY p.sku, p.name, p.quantity;
    `;
    
    const result = await pool.query(query, [start_date, end_date, sku]);
    res.json(result.rows[0] || { error: 'Product not found' });
    
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 2. SEARCH INVENTORY WITH REAL-TIME AVAILABILITY
// ----------------------------------------------------------------------------
app.get('/api/inventory/search', async (req, res) => {
  const { search_term, start_date, end_date, category_id } = req.query;
  
  try {
     const query = `
       SELECT 
         p.sku,
         p.name,
         p.desc,
         c.name AS category_name,
         p.quantity AS total_quantity,
         COALESCE(SUM(
           CASE 
             WHEN li.start_date <= $2::date AND li.end_date >= $1::date
             THEN 1 
             ELSE 0 
           END
         ), 0) AS currently_rented,
         p.quantity - COALESCE(SUM(
           CASE 
             WHEN li.start_date <= $2::date AND li.end_date >= $1::date
             THEN 1 
             ELSE 0 
           END
         ), 0) AS available_quantity
       FROM "Product" p
       LEFT JOIN "Category" c ON p.cat = c.id
       LEFT JOIN "Line_item" li ON p.sku = li.sku
         AND li.start_date <= $2::date
         AND li.end_date >= $1::date
       WHERE
         ($3::text IS NULL OR p.name ILIKE '%' || $3::text || '%')
         AND ($4::uuid IS NULL OR c.id = $4::uuid)
       GROUP BY p.sku, p.name, p.desc, c.name, p.quantity
       ORDER BY p.name;
     `;
   
    const result = await pool.query(query, [
      start_date || '1900-01-01',
      end_date || '2100-12-31',
      search_term,
      category_id
    ]);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error searching inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 3. GET CURRENT RENTALS (WHO HAS WHAT)
// ----------------------------------------------------------------------------
app.get('/api/rentals/current', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.sku,
        p.name as product_name,
        c.name as customer_name,
        COALESCE(comp.name, 'Individual') as company_name,
        c.contact as customer_contact,
        li.start_date,
        li.end_date,
        li.duration,
        i.status as invoice_status,
        li.start_date <= CURRENT_DATE AND li.end_date >= CURRENT_DATE as is_active
      FROM "Line_item" li
      JOIN "Product" p ON li.sku = p.sku
      JOIN "Invoice" i ON li.doc_id = i.id AND li.doc_type = 'invoice'
      JOIN "Customer" c ON i.customer_id = c.id
      LEFT JOIN "Company" comp ON c.company = comp.id
      WHERE li.end_date >= CURRENT_DATE
      ORDER BY li.end_date ASC, p.name;
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching current rentals:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 4. GET RENTALS BY DATE RANGE
// ----------------------------------------------------------------------------
app.get('/api/rentals/date-range', async (req, res) => {
  const { start_date, end_date } = req.query;
  
  try {
    const query = `
      SELECT 
        li.id,
        p.sku,
        p.name as product_name,
        c.name as customer_name,
        li.start_date,
        li.end_date,
        li.duration,
        li.price,
        i.invoice_date,
        i.status as invoice_status
      FROM "Line_item" li
      JOIN "Product" p ON li.sku = p.sku
      JOIN "Invoice" i ON li.doc_id = i.id AND li.doc_type = 'invoice'
      JOIN "Customer" c ON i.customer_id = c.id
      WHERE li.start_date <= $2 AND li.end_date >= $1
      ORDER BY li.start_date, p.name;
    `;
    
    const result = await pool.query(query, [start_date, end_date]);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching rentals by date range:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 5. GET PRODUCT RENTAL HISTORY
// ----------------------------------------------------------------------------
app.get('/api/products/:sku/rental-history', async (req, res) => {
  const { sku } = req.params;
  
  try {
    const query = `
      SELECT 
        li.id,
        c.name as customer_name,
        COALESCE(comp.name, 'Individual') as company_name,
        li.start_date,
        li.end_date,
        li.duration,
        li.price,
        i.invoice_date,
        i.status as invoice_status,
        i.total_amount,
        CASE 
          WHEN li.end_date < CURRENT_DATE THEN 'completed'
          WHEN li.start_date > CURRENT_DATE THEN 'upcoming'
          ELSE 'active'
        END as rental_status
      FROM "Line_item" li
      JOIN "Invoice" i ON li.doc_id = i.id AND li.doc_type = 'invoice'
      JOIN "Customer" c ON i.customer_id = c.id
      LEFT JOIN "Company" comp ON c.company = comp.id
      WHERE li.sku = $1::uuid
      ORDER BY li.start_date DESC;
    `;
    
    const result = await pool.query(query, [sku]);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching rental history:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 6. GET CUSTOMER RENTAL HISTORY
// ----------------------------------------------------------------------------
app.get('/api/customers/:customer_id/rentals', async (req, res) => {
  const { customer_id } = req.params;
  
  try {
    const query = `
      SELECT 
        i.id as invoice_id,
        i.invoice_date,
        i.total_amount,
        i.status as invoice_status,
        p.name as product_name,
        li.start_date,
        li.end_date,
        li.duration,
        li.price as line_price,
        CASE 
          WHEN li.end_date < CURRENT_DATE THEN 'completed'
          WHEN li.start_date > CURRENT_DATE THEN 'upcoming'
          ELSE 'active'
        END as rental_status
      FROM "Invoice" i
      JOIN "Line_item" li ON i.id = li.doc_id AND li.doc_type = 'invoice'
      JOIN "Product" p ON li.sku = p.sku
      WHERE i.customer_id = $1::uuid
      ORDER BY i.invoice_date DESC, li.start_date DESC;
    `;
    
    const result = await pool.query(query, [customer_id]);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching customer rentals:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 7. GET PRODUCTS WITH LOW AVAILABILITY
// ----------------------------------------------------------------------------
app.get('/api/inventory/low-availability', async (req, res) => {
  const { start_date, end_date, threshold } = req.query;
  const availabilityThreshold = threshold || 2;
  
  try {
    const query = `
      SELECT 
        p.sku,
        p.name,
        p.quantity as total_quantity,
        COALESCE(SUM(
          CASE 
            WHEN li.start_date <= $2 AND li.end_date >= $1
            THEN 1 
            ELSE 0 
          END
        ), 0) as rented_quantity,
        p.quantity - COALESCE(SUM(
          CASE 
            WHEN li.start_date <= $2 AND li.end_date >= $1
            THEN 1 
            ELSE 0 
          END
        ), 0) as available_quantity
      FROM "Product" p
      LEFT JOIN "Line_item" li ON p.sku = li.sku
      GROUP BY p.sku, p.name, p.quantity
      HAVING p.quantity - COALESCE(SUM(
        CASE 
          WHEN li.start_date <= $2 AND li.end_date >= $1
          THEN 1 
          ELSE 0 
        END
      ), 0) <= $3
      ORDER BY available_quantity ASC;
    `;
    
    const result = await pool.query(query, [start_date, end_date, availabilityThreshold]);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching low availability:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 8. DAILY DELIVERY SCHEDULE
// ----------------------------------------------------------------------------
app.get('/api/deliveries/schedule', async (req, res) => {
  const { date } = req.query;
  
  try {
    const query = `
      SELECT 
        d.id as delivery_id,
        d.status as delivery_status,
        d.delivery_address,
        v.vehicle_type,
        v.license_plate,
        i.id as invoice_id,
        c.name as customer_name,
        c.contact as customer_contact,
        array_agg(
          json_build_object(
            'product_name', p.name,
            'sku', p.sku,
            'start_date', li.start_date,
            'end_date', li.end_date
          )
        ) as items
      FROM "Delivery_order" d
      JOIN "Invoice" i ON d.invoice_id = i.id
      JOIN "Customer" c ON i.customer_id = c.id
      JOIN "Vehicle_list" v ON d.vehicle_id = v.id
      JOIN "Line_item" li ON li.doc_id = i.id AND li.doc_type = 'invoice'
      JOIN "Product" p ON li.sku = p.sku
      WHERE li.start_date = $1
      GROUP BY d.id, d.status, d.delivery_address, v.vehicle_type, 
               v.license_plate, i.id, c.name, c.contact
      ORDER BY d.status, c.name;
    `;
    
    const result = await pool.query(query, [date || new Date().toISOString().split('T')[0]]);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching delivery schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 9. UPCOMING RETURNS SCHEDULE
// ----------------------------------------------------------------------------
app.get('/api/returns/upcoming', async (req, res) => {
  const { days_ahead } = req.query;
  const daysAhead = days_ahead || 7;
  
  try {
    const query = `
      SELECT 
        p.sku,
        p.name as product_name,
        c.name as customer_name,
        c.contact as customer_contact,
        li.end_date as return_date,
        li.start_date,
        i.billing_address,
        li.end_date - CURRENT_DATE as days_until_return
      FROM "Line_item" li
      JOIN "Product" p ON li.sku = p.sku
      JOIN "Invoice" i ON li.doc_id = i.id AND li.doc_type = 'invoice'
      JOIN "Customer" c ON i.customer_id = c.id
      WHERE li.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::int
        AND i.status != 'void'
      ORDER BY li.end_date ASC, c.name;
    `;
    
    const result = await pool.query(query, [daysAhead]);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching upcoming returns:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 10. INVENTORY UTILIZATION REPORT
// ----------------------------------------------------------------------------
app.get('/api/reports/utilization', async (req, res) => {
  const { start_date, end_date } = req.query;
  
  try {
    const query = `
      WITH date_range AS (
        SELECT 
          $1::date as start_date,
          $2::date as end_date,
          ($2::date - $1::date + 1) as total_days
      ),
      rental_days AS (
        SELECT 
          p.sku,
          p.name,
          p.quantity,
          SUM(
            CASE 
              WHEN li.start_date <= dr.end_date AND li.end_date >= dr.start_date
              THEN 
                LEAST(li.end_date, dr.end_date) - GREATEST(li.start_date, dr.start_date) + 1
              ELSE 0
            END
          ) as total_rented_days
        FROM "Product" p
        CROSS JOIN date_range dr
        LEFT JOIN "Line_item" li ON p.sku = li.sku
        GROUP BY p.sku, p.name, p.quantity
      )
      SELECT 
        rd.sku,
        rd.name,
        rd.quantity,
        rd.total_rented_days,
        dr.total_days,
        ROUND(
          (rd.total_rented_days::numeric / NULLIF(rd.quantity * dr.total_days, 0) * 100), 
          2
        ) as utilization_percentage
      FROM rental_days rd
      CROSS JOIN date_range dr
      ORDER BY utilization_percentage DESC NULLS LAST;
    `;
    
    const result = await pool.query(query, [start_date, end_date]);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error calculating utilization:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 11. REVENUE BY PRODUCT
// ----------------------------------------------------------------------------
app.get('/api/reports/revenue-by-product', async (req, res) => {
  const { start_date, end_date } = req.query;
  
  try {
    const query = `
      SELECT 
        p.sku,
        p.name as product_name,
        COUNT(li.id) as times_rented,
        SUM(li.duration) as total_rental_days,
        SUM(CAST(li.price AS numeric)) as total_revenue,
        AVG(CAST(li.price AS numeric)) as avg_price_per_rental
      FROM "Product" p
      LEFT JOIN "Line_item" li ON p.sku = li.sku
      LEFT JOIN "Invoice" i ON li.doc_id = i.id AND li.doc_type = 'invoice'
      WHERE 
        ($1 IS NULL OR i.invoice_date >= $1::date)
        AND ($2 IS NULL OR i.invoice_date <= $2::date)
      GROUP BY p.sku, p.name
      ORDER BY total_revenue DESC NULLS LAST;
    `;
    
    const result = await pool.query(query, [start_date, end_date]);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error calculating revenue:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 12. GET ALL CATEGORIES
// ----------------------------------------------------------------------------
app.get('/api/categories', async (req, res) => {
  try {
    const query = `
      SELECT id, name, parent_id
      FROM "Category"
      ORDER BY name;
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Rental Inventory Management System - Backend API');
  console.log('='.repeat(60));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'rental_inventory'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60));
});

module.exports = app;
