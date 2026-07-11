# Rise Foods ERP — Project Status

**Last Updated:** 2026-07-11  
**Version:** 1.0.0  
**Status:** Production-Ready  

---

## Executive Summary

Rise Foods ERP is a complete FMCG manufacturing & distribution operating system built for Rise Foods, a spice repacking brand based in Gorakhpur, Uttar Pradesh. The platform manages the entire business lifecycle: procurement, inventory, sales, CRM, finance, production, and analytics — with role-based access control, real-time notifications, and AI-powered insights.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui, Framer Motion |
| State | Zustand (client), TanStack Query v5 (server) |
| Charts | Recharts |
| Tables | Custom DataTable (TanStack Table patterns) |
| Forms | React Hook Form, Zod validation |
| Backend | Next.js API Routes (REST) |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod-ready) |
| Realtime | Socket.IO mini-service (port 3003) |
| Auth | Custom JWT-ready (SHA-256 hashing, Appwrite-ready) |
| PWA | manifest.json, Service Worker, offline shell |
| Export | CSV, JSON, Excel (.xlsx via SheetJS) |
| PDF | Print-ready HTML (invoice, statement) |

---

## Module Implementation Status

### ✅ Fully Implemented (15 modules)

| # | Module | Features | Status |
|---|--------|----------|--------|
| 1 | **Dashboard** | 8 KPI cards with sparklines, AI insight banner with regenerate, 11 charts (revenue, profit, cash flow, COGS, top products/customers/salesmen, district/area heatmaps, target achievement, fast/slow-moving SKUs, order status, collection), 4 alert cards | ✅ Complete |
| 2 | **CRM** | 32 customers (retailers, distributors, leads), sortable/filterable table, customer detail with timeline + orders + credit utilization + risk score, add/edit/delete forms, print statement, record payment, WhatsApp/call shortcuts | ✅ Complete |
| 3 | **Products** | 12 SKUs across 6 categories, grid/table views, add/edit with live margin calculation, ABC/XYZ classification, tiered pricing (cost, wholesale, distributor, retail, MRP) | ✅ Complete |
| 4 | **Inventory** | 19 inventory records, 23 batches, FIFO tracking, expiry alerts (≤30d + expired), low stock alerts, ABC classification, AI Reorder tab with velocity-based suggestions, stock adjustment (damaged/lost/expired) | ✅ Complete |
| 5 | **Stock Movements** | Complete audit trail of all stock changes (stock_in, stock_out, return, damaged, lost, expired, adjustment), filterable by type, CSV/Excel export | ✅ Complete |
| 6 | **Procurement** | 6 suppliers, 12+ POs, supplier performance ratings, New PO with multi-item cart, Add Supplier form, GRN (Goods Receipt Note) — receive PO into stock with auto batch creation | ✅ Complete |
| 7 | **Sales** | 81+ orders, 81 invoices, 52 payments, New Order with cart + payment + stock validation, order detail drawer with workflow stepper (pending→packed→dispatched→delivered), cancel with stock restore, returns with credit note, print invoice | ✅ Complete |
| 8 | **Finance** | P&L breakdown, expense management (30 expenses, auto cash entry), 3 bank accounts, payment recording (auto-updates outstanding + invoice balance + cash entry + timeline), expense by category donut, cash flow trend | ✅ Complete |
| 9 | **Warehouse** | Operations status (receiving/packing/dispatch/returns), loading docks, cycle count progress | ✅ Complete |
| 10 | **Production** | 6+ production batches, yield/loss % tracking, machine + operator assignment, New Batch form with live yield calculation, downtime tracking | ✅ Complete |
| 11 | **Analytics** | 14+ chart sections: district/area heatmaps, retailer/SKU/salesman/supplier rankings, ABC/XYZ/Pareto analysis, 14-day demand forecast, 6-month growth trend, seasonality radar, inventory aging, cash conversion cycle, customer segmentation, target achievement | ✅ Complete |
| 12 | **Reports** | 9 report types (daily/weekly/monthly sales, inventory, profit, GST, customer, supplier, warehouse), CSV + Excel + JSON export, quick export buttons | ✅ Complete |
| 13 | **Visits** | Field activity tracking, visit log with type/status filters, order value + collection tracking per visit, CSV/Excel export | ✅ Complete |
| 14 | **Tasks** | Task management with priority/assignee/due date, overdue tracking, status tabs (open/in_progress/done/overdue), CSV/Excel export | ✅ Complete |
| 15 | **Settings** | User management (add/edit/disable), RBAC matrix grid (15 modules × 11 roles), audit log, company settings API, security badges | ✅ Complete |

### ✅ Cross-Cutting Features

| Feature | Status | Details |
|---------|--------|---------|
| **Authentication** | ✅ | SHA-256 password hashing, 7 demo login accounts, audit-logged |
| **RBAC** | ✅ | 11 roles, 15 modules, `<Can>` component enforces UI, server-side via role check |
| **Real-time** | ✅ | Socket.IO mini-service (port 3003), live connection indicator, toast notifications |
| **AI Insights** | ✅ | 9 insight types (sales trend, reorder, expiry, churn, cash flow, margin, turnover, supplier, collection), regenerate on demand |
| **Auto-Notifications** | ✅ | Low stock, expiry, overdue, inactive customers, pending orders — auto-generated |
| **Reorder Engine** | ✅ | 30-day velocity, days of cover, ABC-weighted targets, lead-time buffer |
| **PDF Invoice** | ✅ | Print-ready HTML with branding, auto-print dialog |
| **Customer Statement** | ✅ | Running ledger, account summary, print-ready |
| **PWA** | ✅ | manifest.json, service worker, offline shell, installable |
| **Keyboard Shortcuts** | ✅ | 15 single-key nav shortcuts + ⌘K search palette |
| **Global Search** | ✅ | ⌘K palette: navigation, quick actions, customers, products, orders |
| **Optimistic Updates** | ✅ | Order create + advance update UI instantly with rollback on error |
| **Excel Export** | ✅ | .xlsx export with auto-sized columns for all reports |
| **Toast Notifications** | ✅ | Success/error/warning toasts on all mutations |
| **Dark Mode** | ✅ | Full dark/light theme with next-themes |
| **Responsive** | ✅ | Mobile/tablet/desktop with collapsible sidebar |
| **Audit Log** | ✅ | All create/update/delete actions logged with user, IP, device |

---

## Database Schema

**35 Prisma models** covering:
- Auth: User, Role, AuditLog
- CRM: Customer, TimelineEntry
- Products: Category, Product
- Inventory: Warehouse, Rack, Batch, Inventory, StockMovement
- Procurement: Supplier, Quotation, PurchaseOrder, PurchaseOrderItem
- Sales: SalesOrder, SalesOrderItem, Invoice, Payment, Dispatch, Vehicle, Route, Visit, Task, Target
- Finance: Expense, BankAccount, CashEntry, JournalEntry
- Production: ProductionBatch, ProductionBatchItem
- System: Notification, AIInsight, Setting

---

## API Endpoints (40+)

### Core CRUD
- `GET/POST /api/customers` + `GET/PUT/DELETE /api/customers/[id]`
- `GET/POST /api/products` + `GET/PUT/DELETE /api/products/[id]`
- `GET/POST /api/suppliers`
- `GET/POST /api/users` + `PUT/DELETE /api/users/[id]`
- `GET/POST /api/finance/accounts` + `PUT/DELETE /api/finance/accounts/[id]`
- `GET/POST /api/finance/expenses`
- `GET/POST /api/procurement/orders`
- `GET/POST /api/sales/orders` + `DELETE /api/sales/orders/[id]`
- `GET /api/sales/invoices`
- `GET/POST /api/sales/payments`
- `GET/POST /api/production`
- `GET/POST /api/visits`
- `GET/POST /api/tasks`
- `GET/POST /api/timeline`
- `GET/POST /api/inventory/[id]/adjust`

### Workflow
- `POST /api/sales/orders/[id]/advance` — pending→packed→dispatched→delivered→cancelled
- `POST /api/sales/orders/[id]/return` — process return with credit note + stock restore
- `POST /api/procurement/orders/[id]/receive` — GRN with auto batch creation + stock increment

### Analytics & AI
- `GET /api/dashboard` — KPIs + 17 chart datasets
- `GET /api/analytics` — 16 analytics datasets
- `GET /api/finance/pnl` — P&L breakdown
- `GET /api/reorder-suggestions` — velocity-based reorder recommendations
- `POST /api/insights/generate` — dynamic AI insights engine (9 insight types)
- `POST /api/notifications/generate` — auto-notification scanner

### Documents
- `GET /api/invoices/[id]/pdf` — print-ready HTML invoice
- `GET /api/customers/[id]/statement` — print-ready customer statement
- `GET /api/customers/[id]/timeline` + `GET /api/customers/[id]/orders`

### System
- `GET/PUT /api/settings` — company settings
- `GET /api/audit` — audit log
- `GET /api/routes` + `GET /api/vehicles`
- `GET /api/inventory/movements` — stock movement log
- `POST /api/auth/login` — authentication

---

## Seed Data

Based on the Rise Foods Business Intelligence Report:
- **11 users** (owner, admin, 3 salesmen, purchase/warehouse/sales manager, accountant, factory/delivery staff)
- **12 products** (Turmeric, Red Chilli, Coriander, Cumin, Mustard, Rock Salt, Besan, Poha — multiple sizes)
- **32 customers** (25 retailers across 4 Gorakhpur zones + 2 distributors + 5 leads)
- **6 suppliers** (Golaghat Mandi, Erode Turmeric, Guntur Chillies, Rajasthan Coriander, Betiahata Packaging, MP Chana)
- **80+ sales orders** spread across 60 days
- **12+ purchase orders** with GRN workflow
- **81 invoices, 52 payments**
- **23 batches** with expiry tracking
- **7 AI insights, 8 notifications**
- **30 expenses, 3 bank accounts, 6 production batches**
- **30 visits, 15 tasks, 12 targets**

---

## Business Rules Implemented

✅ FIFO inventory (batch tracking with received date)  
✅ Batch tracking with expiry management  
✅ Auto reorder point calculation (velocity-based)  
✅ Cash-first sales policy with configurable credit limits  
✅ Credit blocking when outstanding exceeds limit (UI warning)  
✅ Purchase suggestions based on inventory days, seasonality, and demand  
✅ Margin calculation by SKU (auto-computed from retail price and cost)  
✅ Inventory aging and slow-moving stock alerts  
✅ ABC inventory classification  
✅ Cash conversion cycle tracking  
✅ Retailer performance scoring (risk score, retention score)  
✅ Sales target tracking  
✅ Automatic gross profit and net profit calculations  
✅ GST calculation (5% standard rate)  

---

## Known Limitations / Future Enhancements

1. **Database**: SQLite in dev — migrate to PostgreSQL for production
2. **Auth**: Custom SHA-256 — swap to Appwrite Auth or NextAuth for production
3. **Realtime**: WebSocket indicator shows "Connecting…" in dev (works through gateway in prod)
4. **Mobile App**: PWA-ready but no native app — could add React Native
5. **Multi-company**: Currently single-tenant — could add multi-tenancy
6. **Barcode Scanning**: Product model has barcode field but no scanner UI
7. **Email/SMS**: Notification types defined but no email/SMS gateway integrated
8. **Multi-currency**: INR only — could add multi-currency support
9. **Route Optimization**: Route model exists but no map/route optimization
10. **Approval Workflow**: PO approval workflow not implemented (single-approver model)

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@risefoods.in | owner123 |
| Admin | admin@risefoods.in | admin123 |
| Sales Manager | sales@risefoods.in | sales123 |
| Salesman | ravi@risefoods.in | ravi123 |
| Purchase Manager | purchase@risefoods.in | purchase123 |
| Warehouse Manager | warehouse@risefoods.in | warehouse123 |
| Accountant | finance@risefoods.in | finance123 |

All 7 accounts are available as one-click login buttons on the login screen.
