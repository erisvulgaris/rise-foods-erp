# Rise Foods ERP — Operating System

> The complete operating system for FMCG manufacturing & distribution. Built for Rise Foods, a spice repacking brand based in Gorakhpur, Uttar Pradesh.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan) ![Prisma](https://img.shields.io/badge/Prisma-6-indigo) ![License](https://img.shields.io/badge/License-MIT-green)

---

## What Is This?

Rise Foods ERP is a production-grade enterprise resource planning platform that manages the entire business lifecycle of an FMCG food manufacturing and distribution company:

- **CRM** — Retailer & distributor management with credit tracking, risk scoring, and timeline
- **Sales** — Order creation with cart, invoice generation, payment recording, dispatch workflow
- **Inventory** — FIFO batch tracking, expiry management, AI-powered reorder suggestions
- **Procurement** — Supplier management, purchase orders, GRN (goods receipt), performance tracking
- **Finance** — P&L, cash flow, expenses, bank accounts, payment recording
- **Production** — Batch tracking with yield/loss analysis
- **Analytics** — 14+ chart sections with heatmaps, rankings, ABC/XYZ analysis, demand forecasting
- **Reports** — CSV, Excel, JSON export for 9 report types
- **AI Insights** — Dynamic engine that analyzes data and generates actionable recommendations

---

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- npm/bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/rise-foods-erp.git
cd rise-foods-erp

# Install dependencies
bun install

# Set up the database
bun run db:push

# Seed with realistic business data
bun run scripts/seed.ts

# Start the development server
bun run dev
```

The app will be available at `http://localhost:3000`.

### (Optional) Start WebSocket Notifications

```bash
cd mini-services/notifications-service
bun install
bun run dev
# Runs on port 3003
```

---

## Demo Accounts

The app comes with 7 pre-configured demo accounts (one-click login on the login screen):

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Owner | owner@risefoods.in | owner123 | Complete control |
| Admin | admin@risefoods.in | admin123 | Full operations |
| Sales Manager | sales@risefoods.in | sales123 | Sales + CRM + analytics |
| Salesman | ravi@risefoods.in | ravi123 | Field sales + visits |
| Purchase Manager | purchase@risefoods.in | purchase123 | Procurement + inventory |
| Warehouse Manager | warehouse@risefoods.in | warehouse123 | Stock + warehouse |
| Accountant | finance@risefoods.in | finance123 | Finance + reports |

---

## Features

### Dashboard
- 8 KPI cards with sparklines (today/weekly/monthly sales, gross/net profit, cash, outstanding, inventory value)
- AI insight banner with regenerate button (9 insight types)
- 11 charts: revenue trend, profit vs COGS, cash flow, order status, top products/customers/salesmen, district/area heatmaps, target achievement, fast/slow-moving SKUs
- 4 alert cards (low stock, expiry, pending orders, delivered)

### CRM
- 32 seeded customers (retailers, distributors, leads)
- Sortable/filterable data table with risk scores, credit utilization, LTV
- Customer detail view with timeline, recent orders, credit utilization
- Add/Edit/Delete with RBAC enforcement
- Print customer statement (running ledger)
- WhatsApp/Call shortcuts
- Record payment directly from customer list or detail

### Sales
- New Order drawer with product cart, live totals, payment method selection
- Order workflow: Pending → Packed → Dispatched → Delivered (with optimistic UI updates)
- Cancel order (restores stock)
- Process Return (creates credit note, restores stock)
- Print invoice (print-ready HTML with branding)
- 3 tabs: Orders, Invoices, Payments

### Inventory
- Stock levels with ABC classification
- Batch tracking with expiry management
- Low stock + expiry alerts
- AI Reorder tab: velocity-based suggestions with days-of-cover calculation
- Stock adjustment (damaged/lost/expired) with live new-stock preview
- Stock Movements log: complete audit trail of all stock changes

### Procurement
- Supplier management with performance ratings
- New PO with multi-item cart
- GRN (Goods Receipt Note): receive PO → auto-creates batches + increments stock
- Supplier performance tracking (on-time rate, quality rate, lead time)

### Finance
- P&L breakdown (revenue, COGS, gross profit, expenses, net profit)
- Expense management with auto cash entry creation
- Payment recording (auto-updates outstanding, invoice balance, creates cash entry + timeline)
- Bank account management
- Cash flow trend chart

### Analytics
- District & area revenue heatmaps
- Retailer, SKU, salesman, supplier rankings
- ABC/XYZ/Pareto analysis
- 14-day demand forecast
- 6-month growth trend
- Seasonality radar (day-of-week pattern)
- Inventory aging
- Cash conversion cycle
- Customer segmentation (Diamond/Gold/Silver/Bronze by LTV)
- Salesman target achievement with radial progress

### Production
- Batch tracking with yield/loss % calculation
- Machine + operator assignment
- Downtime tracking
- New batch form with live yield analysis

### Reports
- 9 report types: daily/weekly/monthly sales, inventory, profit, GST, customer, supplier, warehouse
- Export to CSV, Excel (.xlsx with auto-sized columns), or JSON
- Quick export buttons for all orders, customers, products

### Settings
- User management (add/edit/disable)
- RBAC matrix grid (15 modules × 11 roles)
- Audit log with user, IP, device, timestamp
- Company settings (name, GST, FSSAI, address)

---

## Cross-Cutting Features

- **RBAC:** 11 roles, 15 modules, enforced via `<Can>` component
- **Real-time:** Socket.IO WebSocket service for live notifications
- **AI Insights:** Dynamic engine analyzing sales trends, inventory, cash flow, churn, supplier performance
- **Keyboard Shortcuts:** 15 single-key navigation shortcuts + ⌘K search palette
- **Global Search:** ⌘K palette indexing navigation, quick actions, customers, products, orders
- **Optimistic Updates:** Instant UI feedback on order create/advance with rollback on error
- **PWA:** Installable, offline shell caching, manifest
- **Dark Mode:** Full dark/light theme
- **Responsive:** Mobile, tablet, desktop with collapsible sidebar
- **Export:** CSV, JSON, Excel (.xlsx)

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| Animation | Framer Motion |
| Charts | Recharts |
| State | Zustand (client), TanStack Query v5 (server) |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| Realtime | Socket.IO |
| Auth | Custom SHA-256 (Appwrite-ready) |
| PWA | manifest.json + Service Worker |
| Export | SheetJS (xlsx), CSV, JSON |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router + API routes
│   └── api/                # 40+ REST endpoints
├── modules/                # 15 feature modules
│   ├── dashboard/
│   ├── crm/
│   ├── sales/
│   ├── inventory/
│   ├── procurement/
│   ├── finance/
│   ├── production/
│   ├── analytics/
│   ├── reports/
│   ├── settings/
│   ├── visits/
│   ├── tasks/
│   ├── stock-movements/
│   ├── products/
│   └── auth/
├── shared/                 # Reusable code
│   ├── components/         # AppShell, charts, tables, forms
│   ├── hooks/              # RBAC, keyboard shortcuts, realtime
│   ├── lib/                # rbac, format, store
│   ├── services/           # API client + TanStack Query hooks
│   └── types/              # TypeScript interfaces
└── lib/
    └── db.ts               # Prisma client
```

---

## Documentation

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** — Full implementation report with module status, API list, and known limitations
- **[AGENTS.md](./AGENTS.md)** — Guide for AI agents working on this codebase (architecture, patterns, how to add features)

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables:
   - `DATABASE_URL` — PostgreSQL connection string
4. Deploy

### Self-Hosted

1. Build: `bun run build`
2. Start: `bun run start`
3. Set up PostgreSQL and update `DATABASE_URL`
4. Run migrations: `bun run db:push`
5. Seed: `bun run scripts/seed.ts`

---

## License

MIT — see LICENSE file for details.

---

## Business Context

This ERP was built for **Rise Foods**, an FMCG repacking brand based in Gorakhpur, Uttar Pradesh, India. The business model: buy bulk spices → clean → grind → repack → brand → sell to kirana stores.

**Launch products:** Turmeric, Red Chilli, Coriander powder (100g, 200g, 500g packs)  
**Target market:** 25 kirana stores in Gorakhpur (Civil Lines, City Centre, Rapti Nagar, Railway Road)  
**Starting capital:** ₹50,000  
**Expansion:** Deoria, Basti districts; Nepal border export (Year 2)

The seed data reflects real prices, real margins, and real market conditions from the Business Intelligence Report.
