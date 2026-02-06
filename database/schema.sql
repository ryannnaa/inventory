-- ============================================================================
-- RENTAL INVENTORY MANAGEMENT SYSTEM - PostgreSQL Schema
-- ============================================================================
-- This schema is compatible with PostgreSQL
-- Run this file to create all tables and relationships
-- ============================================================================

-- Drop existing types if they exist (for clean re-runs)
DROP TYPE IF EXISTS invoice_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS credit_term CASCADE;
DROP TYPE IF EXISTS doc_type CASCADE;
DROP TYPE IF EXISTS delivery_status CASCADE;

-- ============================================================================
-- CREATE ENUM TYPES
-- ============================================================================

CREATE TYPE invoice_status AS ENUM ('unpaid', 'paid', 'void', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'credit');
CREATE TYPE credit_term AS ENUM ('COD', '15days', '30days');
CREATE TYPE doc_type AS ENUM ('quotation', 'invoice');
CREATE TYPE delivery_status AS ENUM ('pending', 'out-for-delivery', 'delivered');

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Employee Table
CREATE TABLE IF NOT EXISTS "Employee" (
    "id" UUID NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "contact" VARCHAR(255) NOT NULL,  -- Changed from INTEGER to VARCHAR for phone numbers
    "position" VARCHAR(255) NOT NULL,
    PRIMARY KEY("id")
);

-- Company Table
CREATE TABLE IF NOT EXISTS "Company" (
    "id" UUID NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "address" JSONB NOT NULL,
    "credit_term" credit_term NOT NULL,
    PRIMARY KEY("id")
);

-- Customer Table
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" UUID NOT NULL UNIQUE,
    "company" UUID,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "contact" VARCHAR(255) NOT NULL,
    "payment_method" payment_method NOT NULL,
    PRIMARY KEY("id")
);

-- Category Table (hierarchical)
CREATE TABLE IF NOT EXISTS "Category" (
    "id" UUID NOT NULL UNIQUE,
    "name" VARCHAR(255),
    "parent_id" UUID,
    PRIMARY KEY("id")
);

-- Product Table
CREATE TABLE IF NOT EXISTS "Product" (
    "sku" UUID NOT NULL UNIQUE,
    "cat" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "desc" TEXT,
    PRIMARY KEY("sku")
);

-- Invoice Table
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" UUID NOT NULL UNIQUE,
    "customer_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "invoice_date" DATE NOT NULL,
    "billing_address" JSONB NOT NULL,
    "total_amount" MONEY NOT NULL,
    "status" invoice_status NOT NULL,
    PRIMARY KEY("id")
);

-- Quotation Table
CREATE TABLE IF NOT EXISTS "Quotation" (
    "id" UUID NOT NULL UNIQUE,
    "customer_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "invoice_id" UUID,
    "quote_date" DATE NOT NULL,  -- Changed from UUID to DATE (appears to be error in original)
    "billing_address" JSONB NOT NULL,
    "total_amount" MONEY NOT NULL,
    PRIMARY KEY("id")
);

-- Line_item Table (polymorphic - can reference Invoice or Quotation)
CREATE TABLE IF NOT EXISTS "Line_item" (
    "id" UUID NOT NULL UNIQUE,
    "sku" UUID NOT NULL,
    "doc_type" doc_type NOT NULL,
    "doc_id" UUID NOT NULL,
    "duration" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "price" MONEY NOT NULL,
    PRIMARY KEY("id")
);

-- Pricing_table
CREATE TABLE IF NOT EXISTS "Pricing_table" (
    "id" UUID NOT NULL UNIQUE,
    "sku" UUID NOT NULL,
    "price_1" MONEY NOT NULL,
    "price_2" MONEY NOT NULL,
    PRIMARY KEY("id")
);

-- Vehicle_list Table
CREATE TABLE IF NOT EXISTS "Vehicle_list" (
    "id" UUID NOT NULL UNIQUE,
    "vehicle_type" INTEGER NOT NULL,
    "license_plate" VARCHAR(255) NOT NULL,
    "last_service_date" DATE NOT NULL,
    PRIMARY KEY("id")
);

-- Delivery_order Table
CREATE TABLE IF NOT EXISTS "Delivery_order" (
    "id" UUID NOT NULL UNIQUE,
    "invoice_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "delivery_address" JSONB NOT NULL,
    "status" delivery_status NOT NULL,
    PRIMARY KEY("id")
);

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Customer -> Company relationship
ALTER TABLE "Customer"
ADD CONSTRAINT fk_customer_company
FOREIGN KEY("company") REFERENCES "Company"("id")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Category -> Category (self-referencing for hierarchy)
ALTER TABLE "Category"
ADD CONSTRAINT fk_category_parent
FOREIGN KEY("parent_id") REFERENCES "Category"("id")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Product -> Category
ALTER TABLE "Product"
ADD CONSTRAINT fk_product_category
FOREIGN KEY("cat") REFERENCES "Category"("id")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Invoice -> Customer
ALTER TABLE "Invoice"
ADD CONSTRAINT fk_invoice_customer
FOREIGN KEY("customer_id") REFERENCES "Customer"("id")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Invoice -> Employee
ALTER TABLE "Invoice"
ADD CONSTRAINT fk_invoice_employee
FOREIGN KEY("employee_id") REFERENCES "Employee"("id")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Quotation -> Customer
ALTER TABLE "Quotation"
ADD CONSTRAINT fk_quotation_customer
FOREIGN KEY("customer_id") REFERENCES "Customer"("id")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Quotation -> Employee
ALTER TABLE "Quotation"
ADD CONSTRAINT fk_quotation_employee
FOREIGN KEY("employee_id") REFERENCES "Employee"("id")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Quotation -> Invoice (optional - when quotation is converted)
ALTER TABLE "Quotation"
ADD CONSTRAINT fk_quotation_invoice
FOREIGN KEY("invoice_id") REFERENCES "Invoice"("id")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Line_item -> Product
ALTER TABLE "Line_item"
ADD CONSTRAINT fk_lineitem_product
FOREIGN KEY("sku") REFERENCES "Product"("sku")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Note: Line_item has polymorphic relationships to both Invoice and Quotation
-- PostgreSQL doesn't support polymorphic foreign keys directly
-- The doc_type field indicates which table doc_id references
-- Application code must enforce referential integrity

-- Pricing_table -> Product
ALTER TABLE "Pricing_table"
ADD CONSTRAINT fk_pricing_product
FOREIGN KEY("sku") REFERENCES "Product"("sku")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Delivery_order -> Invoice
ALTER TABLE "Delivery_order"
ADD CONSTRAINT fk_delivery_invoice
FOREIGN KEY("invoice_id") REFERENCES "Invoice"("id")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Delivery_order -> Vehicle
ALTER TABLE "Delivery_order"
ADD CONSTRAINT fk_delivery_vehicle
FOREIGN KEY("vehicle_id") REFERENCES "Vehicle_list"("id")
ON UPDATE NO ACTION ON DELETE RESTRICT;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for frequently queried columns
CREATE INDEX idx_line_item_dates ON "Line_item"("start_date", "end_date");
CREATE INDEX idx_line_item_sku ON "Line_item"("sku");
CREATE INDEX idx_line_item_doc ON "Line_item"("doc_type", "doc_id");
CREATE INDEX idx_invoice_customer ON "Invoice"("customer_id");
CREATE INDEX idx_invoice_date ON "Invoice"("invoice_date");
CREATE INDEX idx_quotation_customer ON "Quotation"("customer_id");
CREATE INDEX idx_product_category ON "Product"("cat");
CREATE INDEX idx_customer_company ON "Customer"("company");

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify all tables were created
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'Invoice', 'Customer', 'Company', 'Product', 'Category',
        'Line_item', 'Pricing_table', 'Delivery_order', 'Vehicle_list',
        'Employee', 'Quotation'
    )
ORDER BY tablename;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Schema created successfully!' as message,
       'You can now run the sample_data.sql file to populate with test data' as next_step;
