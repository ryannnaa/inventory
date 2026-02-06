# RENTAL INVENTORY MANAGEMENT SYSTEM - COMPLETE SETUP GUIDE

## Project Overview

This is a three-tier web application for managing rental inventory with real-time availability tracking.

**Architecture:**
- **Frontend**: React + Vite (Port 5173)
- **Backend**: Node.js + Express (Port 3001)
- **Database**: PostgreSQL

## Project Structure

```
rental-inventory-system/
├── backend/              # Node.js API server
│   ├── server.js
│   ├── package.json
│   ├── .env (create this)
│   └── README.md
│
├── frontend/            # React web interface
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
└── database/           # PostgreSQL schema
    └── Schema.sql
```

---

## INSTALLATION STEPS

### Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   # Should show v18.x.x or higher
   ```

2. **PostgreSQL** (v14 or higher)
   ```bash
   psql --version
   # Should show 14.x or higher
   ```

3. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

---

### STEP 1: Database Setup

1. **Create the database:**
   ```bash
   createdb rental_inventory
   ```

2. **Load the schema:**
   ```bash
   psql rental_inventory < database/schema.sql
   ```

3. **Verify tables were created:**
   ```bash
   psql rental_inventory -c "\dt"
   ```
   
   You should see tables like: Invoice, Customer, Product, Line_item, etc.

4. **(Optional) Add sample data:**
   
   You can manually insert test data or use the sample data in database/data_sample.sql

---

### STEP 2: Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Edit .env with your database credentials:**
   ```bash
   # Open .env in your text editor
   nano .env
   # or
   code .env
   ```
   
   Update the values:
   ```
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=rental_inventory
   DB_PASSWORD=your_actual_password
   DB_PORT=5432
   PORT=3001
   ```

5. **Start the backend server:**
   ```bash
   npm start
   ```
   
   You should see:
   ```
   ============================================================
   🚀 Rental Inventory Management System - Backend API
   ============================================================
   ✅ Server running on http://localhost:3001
   📊 Database: rental_inventory
   🔗 Health check: http://localhost:3001/api/health
   ============================================================
   ✅ Connected to PostgreSQL database
   ```

6. **Test the backend:**
   
   Open your browser and go to: http://localhost:3001/api/health
   
   You should see:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "timestamp": "2024-02-06T..."
   }
   ```

**Keep this terminal window open!** The backend needs to keep running.

---

### STEP 3: Frontend Setup

1. **Open a NEW terminal window** (keep backend running in the first)

2. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```
   
   This will take a minute to download React, Vite, and other packages.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   You should see:
   ```
   VITE v5.0.8  ready in 500 ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ➜  press h to show help
   ```

5. **Open the application:**
   
   Go to: **http://localhost:5173**
   
   You should see the Rental Inventory Management System interface!

---

## VERIFICATION CHECKLIST

### ✅ Backend Running
- [ ] Terminal shows "Server running on http://localhost:3001"
- [ ] http://localhost:3001/api/health returns status "ok"
- [ ] No database connection errors in console

### ✅ Frontend Running
- [ ] Terminal shows "Local: http://localhost:5173/"
- [ ] Browser shows the application interface
- [ ] Navigation buttons work
- [ ] No console errors in browser DevTools

### ✅ Database Connected
- [ ] Can run: `psql rental_inventory -c "SELECT COUNT(*) FROM \"Product\";"`
- [ ] Backend shows "Connected to PostgreSQL database"

---

## QUICK START COMMANDS

Once everything is set up, use these commands to start the system:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Browser:**
```
http://localhost:5173
```

---

## TESTING THE APPLICATION

### 1. Search Inventory

1. Click "🔍 Search Inventory"
2. Enter a search term (or leave blank for all products)
3. Select date range (optional)
4. Click "Search"

**Expected Result:** Table showing products with availability counts

### 2. View Current Rentals

1. Click "📋 Current Rentals"

**Expected Result:** Table showing active and upcoming rentals

### 3. Delivery Schedule

1. Click "🚚 Deliveries"
2. Select a date

**Expected Result:** Cards showing deliveries scheduled for that date

### 4. Upcoming Returns

1. Click "↩️ Upcoming Returns"
2. Adjust the time window (7/14/30 days)

**Expected Result:** Table showing items being returned soon

### 5. Low Availability Alert

**Expected Result:** Widget at top of page showing products with low stock

---

## TROUBLESHOOTING

### Problem: "Error connecting to database"

**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify database exists: `psql -l | grep rental_inventory`
3. Check credentials in `backend/.env`
4. Ensure password is correct

### Problem: "Port 3001 already in use"

**Solution:**
1. Kill existing process: `lsof -ti:3001 | xargs kill -9`
2. Or change port in `backend/.env`: `PORT=3002`

### Problem: "Cannot GET /api/..."

**Solution:**
1. Ensure backend is running
2. Check http://localhost:3001/api/health
3. Look for errors in backend terminal

### Problem: Frontend shows blank page

**Solution:**
1. Check browser console for errors (F12)
2. Ensure frontend server is running
3. Clear browser cache and reload

### Problem: "Failed to fetch" in browser

**Solution:**
1. Backend must be running first
2. Check CORS is enabled in backend
3. Verify proxy in `frontend/vite.config.js`

---

## ADDING SAMPLE DATA

To test the application with data, you can add sample records:

```sql
-- Connect to database
psql rental_inventory

-- Add a category
INSERT INTO "Category" (id, name) 
VALUES (gen_random_uuid(), 'Chairs');

-- Add a product
INSERT INTO "Product" (sku, cat, name, quantity, desc) 
VALUES (
  gen_random_uuid(), 
  (SELECT id FROM "Category" WHERE name = 'Chairs'), 
  'Chiavari Chair Gold', 
  50, 
  'Gold chiavari chairs for events'
);

-- Add a customer
INSERT INTO "Customer" (id, name, email, contact, payment_method) 
VALUES (
  gen_random_uuid(),
  'John Doe',
  'john@example.com',
  '555-0100',
  'credit'
);

-- Add an employee
INSERT INTO "Employee" (id, name, email, contact, position) 
VALUES (
  gen_random_uuid(),
  'Jane Smith',
  'jane@companyabc.com',
  12345678,
  'Sales Manager'
);
```

---

## DEMO PRESENTATION TIPS

### 1. Start Clean
- Fresh browser window
- Both servers running
- Database has sample data

### 2. Demonstrate Core Feature First
Show the **availability calculation**:
1. Search for a product
2. Select date range
3. Show how "available" = "total" - "currently rented"
4. Explain the SQL date overlap logic

### 3. Show Real-Time Updates
1. View current availability
2. Explain how creating a rental would reduce availability
3. Show how the system prevents overbooking

### 4. Walk Through Each View
- Search: Finding available items
- Current Rentals: Tracking who has what
- Deliveries: Daily logistics
- Returns: Planning ahead

### 5. Highlight SQL Queries
Show the backend code and explain:
- Date overlap logic
- JOINs for relationships
- Aggregation for calculations
- Transaction safety

---

## FILE LOCATIONS

All project files are organized as:

```
backend/
  ├── server.js          ← All API endpoints
  ├── package.json       ← Dependencies
  └── .env              ← Database credentials (CREATE THIS)

frontend/
  ├── src/
  │   ├── components/    ← React components
  │   ├── App.jsx       ← Main app
  │   └── App.css       ← Styles
  └── package.json      ← Dependencies

database/
  └── Schema.sql        ← Database structure
```

---

## NEXT STEPS AFTER DEMO

### Phase 1 Enhancements
- [ ] Add pagination for large result sets
- [ ] Implement product image uploads
- [ ] Add export to CSV functionality

### Phase 2 Features
- [ ] Email notifications for deliveries
- [ ] Mobile responsive improvements
- [ ] Customer portal login

### Phase 3 Advanced
- [ ] Calendar view for bookings
- [ ] Automated invoice generation
- [ ] Payment integration
- [ ] Analytics dashboard

---

## SUPPORT & DOCUMENTATION

- **Backend API Docs**: See `backend/README.md`
- **Frontend Docs**: See `frontend/README.md`
- **SQL Queries**: See `SQL_QUERIES_REFERENCE.sql`
- **Full Documentation**: See `APPLICATION_DOCUMENTATION.md`

---

## STOPPING THE APPLICATION

When done:

1. **Stop Frontend:** Press `Ctrl+C` in frontend terminal
2. **Stop Backend:** Press `Ctrl+C` in backend terminal
3. **Database:** Runs as a service, no need to stop

---

## SUCCESS CRITERIA

You'll know everything is working when:

✅ Backend terminal shows "Connected to PostgreSQL database"  
✅ Frontend opens at http://localhost:5173  
✅ Inventory search returns results  
✅ No errors in browser console  
✅ API calls work (check Network tab in DevTools)

**You're all set! 🎉**
