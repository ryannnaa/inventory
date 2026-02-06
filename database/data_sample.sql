-- ============================================================================
-- SAMPLE DATA FOR RENTAL INVENTORY SYSTEM (VALID UUIDs - FIXED)
-- ============================================================================
-- Run after loading schema.sql
-- All UUIDs now use only valid hexadecimal characters (0-9, a-f)
-- ============================================================================

-- ============================================================================
-- 1. CATEGORIES
-- ============================================================================

INSERT INTO "Category" (id, name, parent_id) VALUES
  ('11111111-1111-4111-a111-111111111111', 'Furniture', NULL),
  ('22222222-2222-4222-a222-222222222222', 'Chairs', '11111111-1111-4111-a111-111111111111'),
  ('33333333-3333-4333-a333-333333333333', 'Tables', '11111111-1111-4111-a111-111111111111'),
  ('44444444-4444-4444-a444-444444444444', 'Decor', NULL),
  ('55555555-5555-4555-a555-555555555555', 'Linens', NULL);

-- ============================================================================
-- 2. PRODUCTS
-- ============================================================================

INSERT INTO "Product" (sku, cat, name, quantity, "desc") VALUES
  -- Chairs
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', '22222222-2222-4222-a222-222222222222', 
   'Chiavari Chair - Gold', 100, 'Elegant gold chiavari chairs for formal events'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb', '22222222-2222-4222-a222-222222222222', 
   'Chiavari Chair - Silver', 80, 'Silver chiavari chairs for weddings'),
  ('cccccccc-cccc-4ccc-accc-cccccccccccc', '22222222-2222-4222-a222-222222222222', 
   'Folding Chair - White', 200, 'White plastic folding chairs'),
  -- Tables
  ('dddddddd-dddd-4ddd-addd-dddddddddddd', '33333333-3333-4333-a333-333333333333', 
   'Round Table 5ft', 50, '5 feet round banquet tables'),
  ('eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee', '33333333-3333-4333-a333-333333333333', 
   'Rectangular Table 6ft', 40, '6 feet rectangular tables'),
  -- Decor
  ('ffffffff-ffff-4fff-afff-ffffffffffff', '44444444-4444-4444-a444-444444444444', 
   'LED Uplighting - RGB', 30, 'Color-changing LED uplights'),
  ('99999999-9999-4999-a999-999999999999', '44444444-4444-4444-a444-444444444444', 
   'Centerpiece - Crystal Vase', 60, 'Elegant crystal vases for centerpieces'),
  -- Linens
  ('88888888-8888-4888-a888-888888888888', '55555555-5555-4555-a555-555555555555', 
   'Tablecloth - White 90" Round', 100, 'White polyester tablecloths');

-- ============================================================================
-- 3. EMPLOYEES
-- ============================================================================

INSERT INTO "Employee" (id, name, email, contact, position) VALUES
  ('a1111111-1111-4111-a111-111111111111', 'Sarah Johnson', 'sarah@companyabc.com', '555-1001', 'Sales Manager'),
  ('a2222222-2222-4222-a222-222222222222', 'Mike Chen', 'mike@companyabc.com', '555-1002', 'Operations Manager'),
  ('a3333333-3333-4333-a333-333333333333', 'Lisa Martinez', 'lisa@companyabc.com', '555-1003', 'Customer Service Rep');

-- ============================================================================
-- 4. COMPANIES
-- ============================================================================

INSERT INTO "Company" (id, name, address, credit_term) VALUES
  ('c0111111-1111-4111-a111-111111111111', 
   'Elegant Events Inc',
   '{"street": "123 Main St", "city": "Singapore", "postal": "123456"}'::jsonb,
   '30days'),
  ('c0222222-2222-4222-a222-222222222222',
   'Wedding Planners Ltd',
   '{"street": "456 Orchard Rd", "city": "Singapore", "postal": "234567"}'::jsonb,
   '15days');

-- ============================================================================
-- 5. CUSTOMERS
-- ============================================================================

INSERT INTO "Customer" (id, company, name, email, contact, payment_method) VALUES
  ('b0111111-1111-4111-a111-111111111111', 'c0111111-1111-4111-a111-111111111111', 'Jessica Tan', 'jessica@elegantevents.com', '91234567', 'credit'),
  ('b0222222-2222-4222-a222-222222222222', 'c0222222-2222-4222-a222-222222222222', 'David Wong', 'david@weddingplanners.com', '92345678', 'credit'),
  ('b0333333-3333-4333-a333-333333333333', NULL, 'Rachel Lee', 'rachel@email.com', '93456789', 'cash'),
  ('b0444444-4444-4444-a444-444444444444', NULL, 'Ahmad Ibrahim', 'ahmad@email.com', '94567890', 'cash');

-- ============================================================================
-- 6. VEHICLES
-- ============================================================================

INSERT INTO "Vehicle_list" (id, vehicle_type, license_plate, last_service_date) VALUES
  ('d0111111-1111-4111-a111-111111111111', 1, 'SBA1234A', '2024-01-15'),
  ('d0222222-2222-4222-a222-222222222222', 2, 'SBA5678B', '2024-01-20'),
  ('d0333333-3333-4333-a333-333333333333', 1, 'SBA9012C', '2024-02-01');

-- ============================================================================
-- 7. PRICING TABLE
-- ============================================================================

INSERT INTO "Pricing_table" (id, sku, price_1, price_2) VALUES
  ('f0111111-1111-4111-a111-111111111111', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 8.00, 6.00),
  ('f0222222-2222-4222-a222-222222222222', 'dddddddd-dddd-4ddd-addd-dddddddddddd', 25.00, 20.00),
  ('f0333333-3333-4333-a333-333333333333', 'ffffffff-ffff-4fff-afff-ffffffffffff', 35.00, 30.00);

-- ============================================================================
-- 8. INVOICES
-- ============================================================================

INSERT INTO "Invoice" (id, customer_id, employee_id, invoice_date, billing_address, total_amount, status) VALUES
  ('e0111111-1111-4111-a111-111111111111', 'b0111111-1111-4111-a111-111111111111', 'a1111111-1111-4111-a111-111111111111', CURRENT_DATE - 5, '{"street": "100 Beach Road", "city": "Singapore", "postal": "189702"}'::jsonb, 2500.00, 'paid'),
  ('e0222222-2222-4222-a222-222222222222', 'b0222222-2222-4222-a222-222222222222', 'a2222222-2222-4222-a222-222222222222', CURRENT_DATE, '{"street": "200 Marina Bay", "city": "Singapore", "postal": "018980"}'::jsonb, 3500.00, 'unpaid'),
  ('e0333333-3333-4333-a333-333333333333', 'b0333333-3333-4333-a333-333333333333', 'a3333333-3333-4333-a333-333333333333', CURRENT_DATE - 20, '{"street": "50 Jurong Gateway", "city": "Singapore", "postal": "608549"}'::jsonb, 800.00, 'paid');

-- ============================================================================
-- 9. LINE ITEMS
-- ============================================================================

INSERT INTO "Line_item" (id, sku, doc_type, doc_id, duration, start_date, end_date, price) VALUES
  -- Invoice 1 - Active rental (picked up 2 days ago, returning in 3 days)
  ('1a111111-1111-4111-a111-111111111111', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'invoice', 'e0111111-1111-4111-a111-111111111111', 5, CURRENT_DATE - 2, CURRENT_DATE + 3, 1200.00),
  ('1a222222-2222-4222-a222-222222222222', 'dddddddd-dddd-4ddd-addd-dddddddddddd', 'invoice', 'e0111111-1111-4111-a111-111111111111', 5, CURRENT_DATE - 2, CURRENT_DATE + 3, 500.00),
  
  -- Invoice 2 - Upcoming rental (starts in 5 days)
  ('1a333333-3333-4333-a333-333333333333', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'invoice', 'e0222222-2222-4222-a222-222222222222', 3, CURRENT_DATE + 5, CURRENT_DATE + 8, 960.00),
  ('1a444444-4444-4444-a444-444444444444', 'ffffffff-ffff-4fff-afff-ffffffffffff', 'invoice', 'e0222222-2222-4222-a222-222222222222', 3, CURRENT_DATE + 5, CURRENT_DATE + 8, 420.00),
  
  -- Invoice 3 - Completed rental (from 2 weeks ago)
  ('1a555555-5555-4555-a555-555555555555', 'cccccccc-cccc-4ccc-accc-cccccccccccc', 'invoice', 'e0333333-3333-4333-a333-333333333333', 2, CURRENT_DATE - 15, CURRENT_DATE - 13, 400.00);

-- ============================================================================
-- 10. DELIVERY ORDERS
-- ============================================================================

INSERT INTO "Delivery_order" (id, invoice_id, vehicle_id, delivery_address, status) VALUES
  ('f1111111-1111-4111-a111-111111111111', 'e0222222-2222-4222-a222-222222222222', 'd0111111-1111-4111-a111-111111111111', '{"street": "200 Marina Bay", "city": "Singapore", "postal": "018980"}'::jsonb, 'pending');

-- ============================================================================
-- 11. QUOTATIONS
-- ============================================================================

INSERT INTO "Quotation" (id, customer_id, employee_id, invoice_id, quote_date, billing_address, total_amount) VALUES
  ('f2111111-1111-4111-a111-111111111111', 'b0444444-4444-4444-a444-444444444444', 'a1111111-1111-4111-a111-111111111111', NULL, CURRENT_DATE, '{"street": "75 Woodlands Drive", "city": "Singapore", "postal": "730075"}'::jsonb, 1500.00);

-- Line item for quotation
INSERT INTO "Line_item" (id, sku, doc_type, doc_id, duration, start_date, end_date, price) VALUES
  ('1a666666-6666-4666-a666-666666666666', 'dddddddd-dddd-4ddd-addd-dddddddddddd', 'quotation', 'f2111111-1111-4111-a111-111111111111', 4, CURRENT_DATE + 10, CURRENT_DATE + 14, 800.00);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check product inventory
SELECT 
  p.name,
  p.quantity as total,
  COUNT(li.id) as times_rented
FROM "Product" p
LEFT JOIN "Line_item" li ON p.sku = li.sku
GROUP BY p.name, p.quantity
ORDER BY p.name;

-- Check current availability for Gold Chiavari Chairs
SELECT 
  p.name,
  p.quantity as total,
  COALESCE(SUM(
    CASE 
      WHEN li.start_date <= CURRENT_DATE + 7 
       AND li.end_date >= CURRENT_DATE
      THEN 1 
      ELSE 0 
    END
  ), 0) as currently_rented,
  p.quantity - COALESCE(SUM(
    CASE 
      WHEN li.start_date <= CURRENT_DATE + 7 
       AND li.end_date >= CURRENT_DATE
      THEN 1 
      ELSE 0 
    END
  ), 0) as available
FROM "Product" p
LEFT JOIN "Line_item" li ON p.sku = li.sku
WHERE p.name = 'Chiavari Chair - Gold'
GROUP BY p.name, p.quantity;

-- Check active rentals
SELECT 
  c.name as customer,
  p.name as product,
  li.start_date,
  li.end_date,
  CASE 
    WHEN li.start_date <= CURRENT_DATE AND li.end_date >= CURRENT_DATE 
    THEN 'ACTIVE' 
    ELSE 'UPCOMING' 
  END as status
FROM "Line_item" li
JOIN "Product" p ON li.sku = p.sku
JOIN "Invoice" i ON li.doc_id = i.id AND li.doc_type = 'invoice'
JOIN "Customer" c ON i.customer_id = c.id
WHERE li.end_date >= CURRENT_DATE
ORDER BY li.start_date;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Sample data inserted successfully!' as message,
       'You now have realistic test data for your rental inventory system' as next_step;

