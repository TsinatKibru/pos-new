# Technical Documentation & API Guide

This document provides a detailed overview of the POS System's technical architecture, features, and API endpoints.

## 🏛️ Architecture Overview

The project is built using a modern full-stack architecture:

- **Frontend**: Next.js 14 with App Router, utilizing React Server Components for performance and Client Components for interactivity.
- **Backend**: Next.js Server Actions and API Routes for business logic and database interactions.
- **Database**: PostgreSQL hosted in Docker, managed through Prisma ORM for type-safe queries and schema migrations.
- **State Management**: Local React state, Context API for global settings, and URL-based state for navigation.
- **Styling**: Tailwind CSS for responsive and maintainable design.

## 🌟 Technical Qualities

### 1. Database Excellence
- **Structured Schema**: Fully normalized database schema with clear relationships (e.g., Sale -> SaleItems -> Product).
- **Integrity**: Referential integrity enforced at the database level using foreign keys and cascading deletes where appropriate.
- **Performance**: Strategic indexing on frequently searched fields like `sku`, `barcode`, and sales timestamps.

### 2. Type Safety
- **End-to-End Types**: Shared TypeScript interfaces between the database layer (Prisma) and the frontend.
- **Validation**: Strict input validation using `Zod` for all API requests and server actions.

### 3. Modular UI System
- **Shadcn/UI**: A robust set of accessible, reusable components.
- **Consistency**: Centralized layout management and theme consistency using `next-themes`.

---

## 🔗 API Reference

The following API routes are available for external integrations or internal consumption. All endpoints are prefixed with `/api`.

### Products
- `GET /api/products`: Retrieve a list of all products.
- `GET /api/products/[id]`: Get details for a specific product.
- `POST /api/products`: Create a new product.
- `PATCH /api/products/[id]`: Update product details.

### Sales & Transactions
- `GET /api/sales`: List sales history with filtering options.
- `POST /api/sales`: Process a new sale transaction. (Automatically updates stock levels).

### Inventory
- `GET /api/inventory`: Current stock levels and alerts.
- `POST /api/inventory/logs`: Record manual stock adjustments.

### Customers
- `GET /api/customers`: Search and list customers.
- `POST /api/customers`: Register a new customer.

### Settings
- `GET /api/settings`: Fetch store-wide configurations.
- `PATCH /api/settings`: Update store name, currency, or tax rates.

---

## 📊 Database Schema (Prisma)

The core data models are:

| Model | Purpose |
| :--- | :--- |
| `User` | Authentication and role-based access. |
| `Product` | Catalog items with price, cost, and stock. |
| `Sale` | Transaction header (total, tax, payment method). |
| `SaleItem` | Line items for each sale. |
| `Customer` | Loyalty points and contact information. |
| `StockLog` | Audit trail for every stock movement. |

For the full schema, see [schema.prisma](file:///home/calm/Downloads/nextjsTuto/pos.new/pos-single/prisma/schema.prisma).

---

## 🛠️ Advanced Development

### Database Migrations
To update the schema:
1. Modify `prisma/schema.prisma`.
2. Run `npx prisma db push` for dev or `npx prisma migrate dev` for production-like environments.

### Seeding Data
Populate your database with sample data:
```bash
npx prisma db seed
```

---

## 📈 Performance & Scalability

- **Server-Side Rendering (SSR)**: Critical pages are rendered on the server for faster initial load.
- **Streaming**: Large lists (like products or sales) use Next.js streaming to show content as it becomes available.
- **Optimized Queries**: Prisma is tuned to fetch only necessary fields to reduce database load.
