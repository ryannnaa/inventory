# Rental Inventory Management System

A full-stack web application for managing event furniture rental inventory in real-time.

## Tech Stack

- **Frontend**: React + Vite (port 5173)
- **Backend**: Node.js + Express (port 3001)
- **Database**: PostgreSQL
- **Cache**: Redis

## Features

- Real-time inventory availability checking with date range overlap logic
- Current rentals tracking (who has what)
- Daily delivery schedule planning
- Upcoming returns coordination
- Low availability alerts with configurable thresholds
- Full product CRUD management

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL v14+
- Redis

### Setup

**1. Database**
```bash
createdb rental_inventory
psql rental_inventory < database/schema.sql
psql rental_inventory < database/data_sample.sql  # optional sample data
```

**2. Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in your DB credentials
npm start
```

**3. Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Project Structure
```
├── backend/        # Express API server
├── frontend/       # React app
└── database/       # PostgreSQL schema and sample data
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/search` | Search products with availability |
| GET | `/api/inventory/low-availability` | Low stock alerts |
| GET | `/api/rentals/current` | Active and upcoming rentals |
| GET | `/api/deliveries/schedule` | Daily delivery plan |
| GET | `/api/returns/upcoming` | Upcoming returns |
| GET/POST | `/api/products` | List / create products |
| PUT/DELETE | `/api/products/:sku` | Update / delete a product |
| GET | `/api/health` | Health check |
