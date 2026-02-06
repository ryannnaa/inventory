# Rental Inventory Management - Backend API

Node.js + Express + PostgreSQL backend server.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Edit `.env` with your database credentials

4. Start server:
```bash
npm start
```

Server runs on http://localhost:3001

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/inventory/search` - Search products with availability
- `GET /api/inventory/availability` - Check specific product availability
- `GET /api/rentals/current` - View current rentals
- `GET /api/deliveries/schedule` - Daily delivery schedule
- `GET /api/returns/upcoming` - Upcoming returns

See server.js for all 13 endpoints.
