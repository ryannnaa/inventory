
const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rental_inventory',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err.stack);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    console.log('Running without Redis cache');
  }
})();

const CACHE_TTL = {
  INVENTORY: 300,      // 5 minutes - for inventory availability
  LOW_STOCK: 600,      // 10 minutes - for low stock alerts
  RENTALS: 180,        // 3 minutes - for current rentals
  RETURNS: 300,        // 5 minutes - for upcoming returns
  DELIVERIES: 300,     // 5 minutes - for delivery schedules
  PRODUCT_LIST: 3600,  // 1 hour - for product catalog
};

async function getCached(key, ttl, queryFn) {
  try {
    const cached = await redisClient.get(key);
    
    if (cached) {
      console.log(`Cache HIT: ${key}`);
      return JSON.parse(cached);
    }
    
    console.log(`Cache MISS: ${key}`);
    
    const result = await queryFn();
    
    await redisClient.setEx(key, ttl, JSON.stringify(result));
    
    return result;
  } catch (err) {
    console.error('Cache error:', err);
    return await queryFn();
  }
}

async function invalidateCache(pattern) {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Invalidated ${keys.length} cache keys: ${pattern}`);
    }
  } catch (err) {
    console.error('Cache invalidation error:', err);
  }
}

async function invalidateInventoryCaches() {
  await Promise.all([
    invalidateCache('inventory:*'),
    invalidateCache('low-stock:*'),
    invalidateCache('rentals:*'),
    invalidateCache('returns:*'),
    invalidateCache('deliveries:*'),
  ]);
}

app.get('/api/inventory/search', async (req, res) => {
  try {
    const { search_term = '', start_date, end_date } = req.query;
    
    const cacheKey = `inventory:search:${search_term}:${start_date}:${end_date}`;
    
    const result = await getCached(cacheKey, CACHE_TTL.INVENTORY, async () => {
      const query = `
        SELECT 
          p.sku,
          p.name,
          p.quantity as total_quantity,
          c.name as category_name,
          COALESCE(
            SUM(
              CASE 
                WHEN li.start_date <= $2::date 
                 AND li.end_date >= $1::date
                THEN 1 
                ELSE 0 
              END
            ), 0
          ) as currently_rented,
          p.quantity - COALESCE(
            SUM(
              CASE 
                WHEN li.start_date <= $2::date 
                 AND li.end_date >= $1::date
                THEN 1 
                ELSE 0 
              END
            ), 0
          ) as available_quantity
        FROM "Product" p
        LEFT JOIN "Category" c ON p.cat = c.id
        LEFT JOIN "Line_item" li ON p.sku = li.sku
        WHERE p.name ILIKE $3
        GROUP BY p.sku, p.name, p.quantity, c.name
        ORDER BY p.name
      `;
      
      const values = [
        start_date || '2024-01-01',
        end_date || '2024-12-31',
        `%${search_term}%`
      ];
      
      const dbResult = await pool.query(query, values);
      return dbResult.rows;
    });
    
    res.json(result);
    
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search inventory' });
  }
});

app.get('/api/inventory/low-availability', async (req, res) => {
  try {
    const { 
      start_date = new Date().toISOString().split('T')[0],
      end_date = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      threshold = 2 
    } = req.query;
    
    const cacheKey = `low-stock:${start_date}:${end_date}:${threshold}`;
    
    const result = await getCached(cacheKey, CACHE_TTL.LOW_STOCK, async () => {
      const query = `
        SELECT 
          p.sku,
          p.name,
          p.quantity as total_quantity,
          COALESCE(
            SUM(
              CASE 
                WHEN li.start_date <= $2::date 
                 AND li.end_date >= $1::date
                THEN 1 
                ELSE 0 
              END
            ), 0
          ) as rented_quantity,
          p.quantity - COALESCE(
            SUM(
              CASE 
                WHEN li.start_date <= $2::date 
                 AND li.end_date >= $1::date
                THEN 1 
                ELSE 0 
              END
            ), 0
          ) as available_quantity
        FROM "Product" p
        LEFT JOIN "Line_item" li ON p.sku = li.sku
        GROUP BY p.sku, p.name, p.quantity
        HAVING p.quantity - COALESCE(
          SUM(
            CASE 
              WHEN li.start_date <= $2::date 
               AND li.end_date >= $1::date
              THEN 1 
              ELSE 0 
            END
          ), 0
        ) <= $3
        ORDER BY available_quantity ASC, p.name
      `;
      
      const dbResult = await pool.query(query, [start_date, end_date, threshold]);
      return dbResult.rows;
    });
    
    res.json(result);
    
  } catch (err) {
    console.error('Low availability error:', err);
    res.status(500).json({ error: 'Failed to check low availability' });
  }
});

app.get('/api/rentals/current', async (req, res) => {
  try {
    const cacheKey = `rentals:current:${new Date().toISOString().split('T')[0]}`;
    
    const result = await getCached(cacheKey, CACHE_TTL.RENTALS, async () => {
      const query = `
        SELECT 
          p.name as product_name,
          c.name as customer_name,
          c.contact as customer_contact,
          comp.name as company_name,
          li.start_date,
          li.end_date,
          li.duration,
          CASE 
            WHEN li.start_date <= CURRENT_DATE AND li.end_date >= CURRENT_DATE 
            THEN true 
            ELSE false 
          END as is_active
        FROM "Line_item" li
        JOIN "Product" p ON li.sku = p.sku
        JOIN "Invoice" i ON li.doc_id = i.id AND li.doc_type = 'invoice'
        JOIN "Customer" c ON i.customer_id = c.id
        LEFT JOIN "Company" comp ON c.company = comp.id
        WHERE li.end_date >= CURRENT_DATE
        ORDER BY li.start_date, p.name
      `;
      
      const dbResult = await pool.query(query);
      return dbResult.rows;
    });
    
    res.json(result);
    
  } catch (err) {
    console.error('Current rentals error:', err);
    res.status(500).json({ error: 'Failed to load current rentals' });
  }
});

app.get('/api/deliveries/schedule', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const cacheKey = `deliveries:schedule:${date}`;
    
    const result = await getCached(cacheKey, CACHE_TTL.DELIVERIES, async () => {
      const query = `
        SELECT 
          d.id as delivery_id,
          d.status as delivery_status,
          d.delivery_address,
          c.name as customer_name,
          c.contact as customer_contact,
          v.license_plate,
          i.id as invoice_id,
          json_agg(
            json_build_object(
              'sku', p.sku,
              'product_name', p.name,
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
        WHERE li.start_date = $1::date
        GROUP BY d.id, d.status, d.delivery_address, c.name, c.contact, v.license_plate, i.id
        ORDER BY d.status, c.name
      `;
      
      const dbResult = await pool.query(query, [date]);
      return dbResult.rows;
    });
    
    res.json(result);
    
  } catch (err) {
    console.error('Delivery schedule error:', err);
    res.status(500).json({ error: 'Failed to load delivery schedule' });
  }
});

app.get('/api/returns/upcoming', async (req, res) => {
  try {
    const { days_ahead = 7 } = req.query;
    
    const cacheKey = `returns:upcoming:${days_ahead}`;
    
    const result = await getCached(cacheKey, CACHE_TTL.RETURNS, async () => {
      const query = `
        SELECT 
          p.name as product_name,
          c.name as customer_name,
          c.contact as customer_contact,
          li.end_date as return_date,
          li.end_date - CURRENT_DATE as days_until_return
        FROM "Line_item" li
        JOIN "Product" p ON li.sku = p.sku
        JOIN "Invoice" i ON li.doc_id = i.id AND li.doc_type = 'invoice'
        JOIN "Customer" c ON i.customer_id = c.id
        WHERE li.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::int
        ORDER BY li.end_date, p.name
      `;
      
      const dbResult = await pool.query(query, [days_ahead]);
      return dbResult.rows;
    });
    
    res.json(result);
    
  } catch (err) {
    console.error('Upcoming returns error:', err);
    res.status(500).json({ error: 'Failed to load upcoming returns' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const cacheKey = 'products:list:all';
    
    const result = await getCached(cacheKey, CACHE_TTL.PRODUCT_LIST, async () => {
      const query = `
        SELECT 
          p.sku,
          p.name,
          p.quantity,
          p.des as description,
          p.cat as category_id,
          c.name as category_name
        FROM "Product" p
        LEFT JOIN "Category" c ON p.cat = c.id
        ORDER BY p.name
      `;
      
      const dbResult = await pool.query(query);
      return dbResult.rows;
    });
    
    res.json(result);
    
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.get('/api/products/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    
    const query = `
      SELECT 
        p.sku,
        p.name,
        p.quantity,
        p.des as description,
        p.cat as category_id,
        c.name as category_name
      FROM "Product" p
      LEFT JOIN "Category" c ON p.cat = c.id
      WHERE p.sku = $1
    `;
    
    const result = await pool.query(query, [sku]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, quantity, description, category_id } = req.body;
    
    if (!name || !quantity || !category_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, quantity, category_id' 
      });
    }
    
    const query = `
      INSERT INTO "Product" (sku, name, quantity, "desc", cat)
      VALUES (gen_random_uuid(), $1, $2, $3, $4)
      RETURNING sku, name, quantity, "desc" as description, cat as category_id
    `;
    
    const result = await pool.query(query, [name, quantity, description, category_id]);
    
    await invalidateInventoryCaches();
    
    res.status(201).json(result.rows[0]);
    
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { name, quantity, description, category_id } = req.body;
    
    const query = `
      UPDATE "Product"
      SET 
        name = COALESCE($1, name),
        quantity = COALESCE($2, quantity),
        "desc" = COALESCE($3, "desc"),
        cat = COALESCE($4, cat)
      WHERE sku = $5
      RETURNING sku, name, quantity, "desc" as description, cat as category_id
    `;
    
    const result = await pool.query(query, [name, quantity, description, category_id, sku]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await invalidateInventoryCaches();
    
    res.json(result.rows[0]);
    
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.patch('/api/products/:sku/quantity', async (req, res) => {
  try {
    const { sku } = req.params;
    const { quantity, adjustment } = req.body;
    
    let query, values;
    
    if (quantity !== undefined) {
      query = `
        UPDATE "Product"
        SET quantity = $1
        WHERE sku = $2
        RETURNING sku, name, quantity
      `;
      values = [quantity, sku];
    } else if (adjustment !== undefined) {
      query = `
        UPDATE "Product"
        SET quantity = quantity + $1
        WHERE sku = $2
        RETURNING sku, name, quantity
      `;
      values = [adjustment, sku];
    } else {
      return res.status(400).json({ 
        error: 'Must provide either quantity or adjustment' 
      });
    }
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await invalidateInventoryCaches();
    
    res.json(result.rows[0]);
    
  } catch (err) {
    console.error('Update quantity error:', err);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
});

app.delete('/api/products/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM "Line_item"
      WHERE sku = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [sku]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete product with existing rentals/quotations' 
      });
    }
    
    const deleteQuery = `
      DELETE FROM "Product"
      WHERE sku = $1
      RETURNING sku, name
    `;
    
    const result = await pool.query(deleteQuery, [sku]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await invalidateInventoryCaches();
    
    res.json({ 
      message: 'Product deleted successfully',
      product: result.rows[0]
    });
    
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const cacheKey = 'categories:list:all';
    
    const result = await getCached(cacheKey, CACHE_TTL.PRODUCT_LIST, async () => {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.parent_id,
          pc.name as parent_name
        FROM "Category" c
        LEFT JOIN "Category" pc ON c.parent_id = pc.id
        ORDER BY c.name
      `;
      
      const dbResult = await pool.query(query);
      return dbResult.rows;
    });
    
    res.json(result);
    
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

app.post('/api/cache/invalidate', async (req, res) => {
  try {
    const { pattern = '*' } = req.body;
    
    await invalidateCache(pattern);
    
    res.json({ 
      message: 'Cache invalidated successfully',
      pattern 
    });
    
  } catch (err) {
    console.error('Cache invalidation error:', err);
    res.status(500).json({ error: 'Failed to invalidate cache' });
  }
});

app.get('/api/cache/stats', async (req, res) => {
  try {
    const info = await redisClient.info('stats');
    const dbSize = await redisClient.dbSize();
    
    res.json({
      connected: redisClient.isOpen,
      keys_count: dbSize,
      info: info
    });
    
  } catch (err) {
    console.error('Cache stats error:', err);
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
});


app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    
    const redisConnected = redisClient.isOpen;
    
    res.json({
      status: 'healthy',
      database: 'connected',
      redis: redisConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  
  try {
    await redisClient.quit();
    await pool.end();
    console.log('Connections closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});
