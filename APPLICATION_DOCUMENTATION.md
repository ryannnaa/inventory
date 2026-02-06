# RENTAL INVENTORY MANAGEMENT SYSTEM - DOCUMENTATION

## Project Overview

This is a demo application for Company ABC's event furniture rental business. The system addresses the core problem of managing inventory availability in real-time and tracking which items are rented to which customers.

### Tech Stack
- **Frontend**: React.js (using Vite)
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL

---

## Core Features & SQL Query Focus

### 1. **Real-Time Availability Checking** (PRIMARY FEATURE)
**Problem Solved**: Prevents overbooking by calculating available quantity during a specific date range

**SQL Logic**:
```sql
-- For each product, calculate: Total Quantity - Currently Rented = Available
-- Date overlap occurs when: rental.start_date <= query.end_date AND rental.end_date >= query.start_date

SELECT 
  p.quantity as total,
  SUM(CASE WHEN li.start_date <= $end_date AND li.end_date >= $start_date THEN 1 ELSE 0 END) as rented,
  p.quantity - rented as available
FROM Product p
LEFT JOIN Line_item li ON p.sku = li.sku
WHERE p.sku = $product_sku
GROUP BY p.sku;
```

**Why This Matters**: 
- Office staff can immediately see if an item is available during quotation
- Ground staff can handle last-minute orders with confidence
- Eliminates manual Excel calculations

---

### 2. **Current Rentals Tracking** (WHO HAS WHAT)
**Problem Solved**: Clear visibility into which inventory items are with which customers

**SQL Query**:
```sql
-- Show all active rentals with customer details
SELECT 
  p.name as product,
  c.name as customer,
  li.start_date,
  li.end_date,
  li.start_date <= CURRENT_DATE AND li.end_date >= CURRENT_DATE as is_active
FROM Line_item li
JOIN Product p ON li.sku = p.sku
JOIN Invoice i ON li.doc_id = i.id
JOIN Customer c ON i.customer_id = c.id
WHERE li.end_date >= CURRENT_DATE;
```

**Use Cases**:
- Quickly find who has a specific item
- Contact customers about extensions
- Plan for returns

---

### 3. **Inventory Search with Date Filtering**
**Problem Solved**: Staff can search for available items for specific event dates

**Key SQL Feature**: Dynamic date range filtering combined with text search
```sql
WHERE 
  (product_name ILIKE '%search_term%')
  AND (start_date, end_date) overlaps with requested dates
```

---

### 4. **Delivery & Return Scheduling**
**Problem Solved**: Logistics planning - what to deliver today, what's coming back

**SQL Aggregation**:
```sql
-- Group all items for a delivery
SELECT 
  delivery_id,
  customer_name,
  array_agg(json_build_object('product', p.name, 'dates', li.start_date)) as items
FROM Delivery_order
GROUP BY delivery_id, customer_name;
```

---

### 5. **Low Availability Alerts**
**Problem Solved**: Proactive warning when products are running low

**SQL with Threshold**:
```sql
-- Alert when available quantity drops below threshold (e.g., 2 units)
HAVING (p.quantity - rented_count) <= $threshold
```

---

## Database Schema Key Points

### Critical Tables for Availability Calculation:
1. **Product** - Stores total quantity of each item
2. **Line_item** - Records each rental with start/end dates
3. **Invoice** - Links line items to customers

### Important Relationships:
- Line_item can reference either Invoice or Quotation (polymorphic via doc_type/doc_id)
- Customer can be individual or linked to Company (affects credit terms)
- Category has self-referencing parent_id for hierarchical organization

### Date Overlap Logic (CRITICAL):
Two date ranges overlap if:
```
rental.start_date <= query.end_date AND rental.end_date >= query.start_date
```

Example:
- Query: June 10-15
- Rental A (June 8-12): OVERLAPS ✓
- Rental B (June 14-20): OVERLAPS ✓  
- Rental C (June 20-25): NO OVERLAP ✗

---

## API Endpoints Summary

### Inventory Management
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/inventory/availability` | GET | Check available quantity for date range |
| `/api/inventory/search` | GET | Search products with real-time availability |
| `/api/inventory/low-availability` | GET | Alert for products below threshold |

### Rental Tracking
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/rentals/current` | GET | All active rentals |
| `/api/rentals/date-range` | GET | Rentals within specific period |
| `/api/products/:sku/rental-history` | GET | Complete history for one product |
| `/api/customers/:id/rentals` | GET | All rentals for one customer |

### Operations
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/deliveries/schedule` | GET | Daily delivery planning |
| `/api/returns/upcoming` | GET | Items being returned soon |

### Business Logic
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/quotations` | POST | Create quotation (with availability check) |
| `/api/quotations/:id/convert` | POST | Convert quotation to invoice |

### Reporting
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/reports/utilization` | GET | Calculate rental utilization rate |
| `/api/reports/revenue-by-product` | GET | Revenue analysis by product |

---

## Frontend Components

### 1. InventorySearch
- **Purpose**: Main interface for checking availability
- **Features**: 
  - Text search
  - Date range picker
  - Color-coded availability (green/yellow/red)
  - Real-time results

### 2. CurrentRentals
- **Purpose**: Dashboard showing all active rentals
- **Features**:
  - Customer contact info
  - Rental dates
  - Invoice status

### 3. DeliverySchedule
- **Purpose**: Daily operations planning
- **Features**:
  - Date selector
  - Vehicle assignments
  - Customer details
  - Grouped by delivery

### 4. UpcomingReturns
- **Purpose**: Return coordination
- **Features**:
  - Adjustable time window (next 7/14/30 days)
  - Customer contact for coordination

### 5. LowAvailabilityAlert
- **Purpose**: Dashboard widget for warnings
- **Features**:
  - Configurable threshold
  - Auto-refresh
  - Direct links to products

---

## Setup Instructions

### Prerequisites
```bash
# Install Node.js (v18+)
# Install PostgreSQL (v14+)
# Install npm packages globally
npm install -g docx  # for document generation if needed
```

### Database Setup
```bash
# 1. Create database
createdb rental_inventory

# 2. Run schema
psql rental_inventory < Schema.sql

# 3. (Optional) Add sample data for testing
# See sample_data.sql (you can create this)
```

### Backend Setup
```bash
# 1. Initialize project
mkdir rental-backend
cd rental-backend
npm init -y

# 2. Install dependencies
npm install express pg dotenv cors

# 3. Create .env file
cat > .env << EOF
DB_USER=your_username
DB_HOST=localhost
DB_NAME=rental_inventory
DB_PASSWORD=your_password
DB_PORT=5432
PORT=3001
EOF

# 4. Copy the skeleton code to server.js
cp rental_inventory_app_skeleton.js server.js

# 5. Start server
node server.js
```

### Frontend Setup
```bash
# 1. Create React app with Vite
npm create vite@latest rental-frontend -- --template react
cd rental-frontend

# 2. Install dependencies
npm install

# 3. Configure proxy to backend
# Add to vite.config.js:
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})

# 4. Create components (copy from skeleton)
# - InventorySearch.jsx
# - CurrentRentals.jsx
# - DeliverySchedule.jsx
# - UpcomingReturns.jsx
# - LowAvailabilityAlert.jsx

# 5. Start dev server
npm run dev
```

---

## Key SQL Concepts Demonstrated

### 1. **Date Range Overlap**
```sql
-- Check if two date ranges overlap
WHERE range1_start <= range2_end AND range1_end >= range2_start
```

### 2. **Conditional Aggregation**
```sql
-- Count only matching rows
SUM(CASE WHEN condition THEN 1 ELSE 0 END)
```

### 3. **LEFT JOIN for Availability**
```sql
-- Include products even if they have no rentals
FROM Product p
LEFT JOIN Line_item li ON p.sku = li.sku
```

### 4. **JSON Aggregation**
```sql
-- Combine multiple rows into JSON array
array_agg(json_build_object('key', value))
```

### 5. **Common Table Expressions (CTE)**
```sql
-- Break complex queries into readable parts
WITH date_range AS (
  SELECT start_date, end_date, total_days
),
rental_days AS (
  SELECT product, SUM(days) FROM ...
)
SELECT * FROM rental_days;
```

### 6. **HAVING vs WHERE**
```sql
-- WHERE filters before grouping
-- HAVING filters after aggregation
GROUP BY product
HAVING SUM(quantity) <= threshold
```

### 7. **Transaction Safety**
```sql
BEGIN;
  -- Check availability
  -- Create quotation
  -- Create line items
COMMIT;  -- or ROLLBACK on error
```

---

## Testing Scenarios

### Scenario 1: Check Availability
1. Select date range: June 10-15
2. Search for "chairs"
3. Verify calculation: Total - Rented = Available
4. Try different date ranges

### Scenario 2: Create Quotation
1. Add items to cart
2. System checks availability for each item
3. If any unavailable, show error
4. If all available, create quotation
5. Verify line_items created correctly

### Scenario 3: View Active Rentals
1. Load current rentals page
2. Filter by product or customer
3. Check rental dates
4. Verify customer contact info

### Scenario 4: Delivery Planning
1. Select today's date
2. View all deliveries scheduled
3. Check items grouped by delivery
4. Verify vehicle assignment

### Scenario 5: Low Stock Alert
1. Set threshold to 2
2. View products below threshold
3. Adjust date range
4. Verify calculation updates

---

## Common Pitfalls & Solutions

### Pitfall 1: Date Comparison
❌ WRONG: `start_date BETWEEN $1 AND $2`
✅ CORRECT: `start_date <= $2 AND end_date >= $1`

**Why**: BETWEEN only checks one date, not the range overlap

### Pitfall 2: Missing NULL Handling
❌ WRONG: `SUM(quantity)`
✅ CORRECT: `COALESCE(SUM(quantity), 0)`

**Why**: SUM returns NULL if no rows, causing calculation errors

### Pitfall 3: Not Using Transactions
❌ WRONG: Multiple INSERT statements separately
✅ CORRECT: Wrap in BEGIN/COMMIT transaction

**Why**: Ensures data consistency if any query fails

### Pitfall 4: Forgetting to Join Properly
❌ WRONG: `FROM Product, Line_item WHERE ...`
✅ CORRECT: `FROM Product LEFT JOIN Line_item ON ...`

**Why**: LEFT JOIN ensures products with no rentals still appear

---

## Extensions & Future Enhancements

### Phase 1 Extensions
1. Add product images
2. Implement search filters (category, price range)
3. Add sorting options

### Phase 2 Extensions
1. Email notifications for deliveries/returns
2. Mobile-responsive design
3. Export reports to PDF/Excel

### Phase 3 Extensions
1. Calendar view for bookings
2. Automated reminders
3. Payment integration
4. Customer portal

---

## Database Optimization Tips

### Add Indexes for Performance
```sql
-- Speed up availability queries
CREATE INDEX idx_line_item_dates ON Line_item(start_date, end_date);
CREATE INDEX idx_line_item_sku ON Line_item(sku);

-- Speed up customer lookups
CREATE INDEX idx_invoice_customer ON Invoice(customer_id);

-- Speed up search
CREATE INDEX idx_product_name ON Product USING gin(to_tsvector('english', name));
```

### Query Optimization
- Use EXPLAIN ANALYZE to check query plans
- Ensure proper join order (smallest table first)
- Add WHERE clauses before JOINs when possible
- Limit result sets (add LIMIT for paginated views)

---

## Error Handling Best Practices

### Backend
```javascript
try {
  // Database query
} catch (error) {
  console.error('Error details:', error);
  res.status(500).json({ 
    error: 'User-friendly message',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

### Frontend
```javascript
const [error, setError] = useState(null);

try {
  const response = await fetch('/api/...');
  if (!response.ok) throw new Error('Request failed');
  const data = await response.json();
} catch (err) {
  setError('Could not load data. Please try again.');
}
```

---

## Demo Preparation Checklist

- [ ] Database schema loaded
- [ ] Sample data inserted (products, customers, some rentals)
- [ ] Backend server running
- [ ] Frontend dev server running
- [ ] Test availability query with known data
- [ ] Test search functionality
- [ ] Verify current rentals display
- [ ] Check delivery schedule
- [ ] Confirm low stock alerts work
- [ ] Prepare screenshots/screen recording

---

## Sample Data Queries

### Insert Sample Products
```sql
INSERT INTO Category (id, name) VALUES 
  (gen_random_uuid(), 'Chairs'),
  (gen_random_uuid(), 'Tables'),
  (gen_random_uuid(), 'Decor');

INSERT INTO Product (sku, cat, name, quantity, desc) VALUES 
  (gen_random_uuid(), (SELECT id FROM Category WHERE name = 'Chairs'), 'Chiavari Chair Gold', 100, 'Gold chiavari chairs'),
  (gen_random_uuid(), (SELECT id FROM Category WHERE name = 'Tables'), 'Round Table 5ft', 20, '5ft round tables');
```

### Insert Sample Customer
```sql
INSERT INTO Customer (id, name, email, contact, payment_method) VALUES 
  (gen_random_uuid(), 'John Doe', 'john@example.com', '555-0100', 'credit');
```

### Insert Sample Rental
```sql
-- This creates a rental that will affect availability
INSERT INTO Invoice (id, customer_id, employee_id, invoice_date, billing_address, total_amount, status)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM Customer LIMIT 1),
  gen_random_uuid(), -- you'd need employee
  CURRENT_DATE,
  '{"street": "123 Main St", "city": "Springfield"}'::jsonb,
  500.00,
  'paid'
);

INSERT INTO Line_item (id, sku, doc_type, doc_id, duration, start_date, end_date, price)
VALUES (
  gen_random_uuid(),
  (SELECT sku FROM Product WHERE name = 'Chiavari Chair Gold'),
  'invoice',
  (SELECT id FROM Invoice ORDER BY invoice_date DESC LIMIT 1),
  3,
  CURRENT_DATE + 5,
  CURRENT_DATE + 8,
  150.00
);
```

---

## Summary

This application demonstrates:

1. ✅ **Real-time availability calculation** using SQL date overlap logic
2. ✅ **Complex queries** with JOINs, aggregations, and CTEs
3. ✅ **Transaction management** for data consistency
4. ✅ **Business logic** in SQL (utilization calculations, revenue reports)
5. ✅ **Practical problem-solving** for a real business scenario

The core value is the **availability checking system** that prevents overbooking by calculating `Total - Currently Rented = Available` for any date range in real-time.
