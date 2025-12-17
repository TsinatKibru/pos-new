# POS System - Next.js 14

A modern Point of Sale system built with Next.js 14, TypeScript, PostgreSQL, and Tailwind CSS.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL client (optional, for manual database access)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the `.env.local` file and update values as needed:

```bash
cp .env.local .env.local
```

Default database credentials:
- **User**: `pos_user`
- **Password**: `pos_password`
- **Database**: `pos_db`
- **Port**: `5432`

### 3. Start PostgreSQL with Docker Compose

```bash
docker-compose up -d
```

This will:
- Start a PostgreSQL 16 container
- Create the database and user
- Run the initialization script (`scripts/init.sql`) to create tables and indexes
- Expose PostgreSQL on port 5432

### 4. Verify Database Connection

```bash
npm run db:setup
```

This will test the database connection. You should see "Connected successfully!"

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Docker Commands

**Start database:**
```bash
docker-compose up -d
```

**Stop database:**
```bash
docker-compose down
```

**Stop and remove volumes (deletes all data):**
```bash
docker-compose down -v
```

**View logs:**
```bash
docker-compose logs -f postgres
```

**Access PostgreSQL CLI:**
```bash
docker exec -it pos-postgres psql -U pos_user -d pos_db
```

## Database Schema

The system includes the following tables:

- **users** - System users (admin, cashier, manager roles)
- **products** - Product catalog with pricing and inventory
- **categories** - Product categories (supports hierarchy)
- **customers** - Customer information and loyalty points
- **sales** - Sales transactions
- **sale_items** - Line items for each sale

All tables include:
- UUID primary keys
- Timestamps (created_at, updated_at)
- Proper indexes for performance
- Foreign key constraints

## Project Structure

```
/app
  /(auth)
    /login         - Login page
  /dashboard       - Dashboard overview
  /api             - API routes (to be implemented)
/lib
  db.ts            - PostgreSQL connection pool
  utils.ts         - Utility functions
  /types
    database.ts    - TypeScript type definitions
/components
  /ui              - shadcn/ui components
/scripts
  init.sql         - Database schema initialization
  setup-db.js      - Database connection test script
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:setup` - Test database connection

## Database Types

TypeScript types are defined in `/lib/types/database.ts` and match the PostgreSQL schema exactly. Use these types throughout your application for type safety.

## Next Steps

1. Implement authentication API routes
2. Create product management pages
3. Build the POS interface
4. Add reporting and analytics
5. Implement receipt printing

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Database Client**: node-postgres (pg)
