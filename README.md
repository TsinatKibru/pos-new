# POS System - Next.js 13.5

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/yourusername/pos-system)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](https://nodejs.org)
[![Next.js Version](https://img.shields.io/badge/Next.js-13.5.1-black.svg)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A high-performance, modern Point of Sale (POS) system built with Next.js 13.5, TypeScript, Prisma, and PostgreSQL. Designed for speed, reliability, and ease of use in retail environments.

## 🚀 Key Features

- **Sales Management**: Intuitive interface for processing sales, handling discounts, and managing payment methods.
- **Inventory Tracking**: Real-time stock management with automated logs and categorizations.
- **Customer CRM**: Maintain customer profiles, track purchase history, and manage loyalty points.
- **Dynamic Analytics**: Comprehensive dashboard with visual insights into sales performance and top-selling products.
- **Store Configuration**: Flexible settings for currency, tax rates, and store information.
- **Role-Based Access**: Secure authentication System with Admin and Staff roles.

## 🛠️ Tech Stack

- **Framework**: Next.js 13.5 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS & Lucide Icons
- **UI Components**: shadcn/ui
- **Authentication**: NextAuth.js
- **State Management**: React Hooks & Server Actions

## 🚦 Getting Started

### Prerequisites

- Node.js 18.x or later
- Docker & Docker Compose (for database)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/pos-system.git
   cd pos-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Copy `.env.example` to `.env` and update the database URL.
   ```bash
   cp .env.example .env
   ```

4. **Start the database:**
   ```bash
   docker-compose up -d
   ```

5. **Initialize the database:**
   ```bash
   npm run db:push
   npm run db:setup
   ```

6. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📖 Documentation

For more detailed technical information, including API endpoints and architecture, please refer to:
- [Technical Documentation](file:///home/calm/Downloads/nextjsTuto/pos.new/pos-single/DOCS.md)
- [Prisma Schema](file:///home/calm/Downloads/nextjsTuto/pos.new/pos-single/prisma/schema.prisma)

## 🤝 Contributing

Contributions are welcome! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🆘 Support

If you encounter any issues or have questions:
- Open an [Issue](https://github.com/yourusername/pos-system/issues)
- Check the [Documentation](DOCS.md)
- Contact the maintainers at support@example.com

## 👤 Maintainers

- **Lead Developer**: [Tsinat Kibru](https://github.com/TsinatKibru)

---

Developed with ❤️ for retailers everywhere.
