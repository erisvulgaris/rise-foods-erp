# AGENTS.md — Guide for AI Agents Working on Rise Foods ERP

> **Purpose:** This file gives future AI agents (Claude, GPT, etc.) the context they need to understand, navigate, and extend this codebase effectively.

---

## Project Overview

**Rise Foods ERP** is a full-featured FMCG manufacturing & distribution operating system built for a spice repacking company in Gorakhpur, Uttar Pradesh. It manages the entire business: CRM, inventory, procurement, sales, finance, production, warehouse, analytics, and reporting.

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma + TanStack Query + Zustand + Socket.IO

---

## Quick Start

```bash
# Install dependencies
bun install

# Set up database
bun run db:push

# Seed with realistic BIR data (Gorakhpur, 3 spices, 25 retailers)
bun run scripts/seed.ts

# Start dev server (port 3000)
bun run dev

# Start WebSocket notifications service (port 3003)
cd mini-services/notifications-service && bun run dev

# Lint
bun run lint
```

**Login:** Use any of the 7 demo accounts (one-click buttons on login screen).

---

## Architecture

### Feature-First Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # 40+ REST API routes
│   │   ├── customers/[id]/       # CRUD + timeline + orders + statement
│   │   ├── sales/orders/[id]/    # CRUD + advance + return
│   │   ├── procurement/orders/[id]/  # CRUD + receive (GRN)
│   │   ├── invoices/[id]/pdf/    # Print-ready HTML invoice
│   │   ├── insights/generate/    # Dynamic AI insights engine
│   │   ├── reorder-suggestions/  # Velocity-based reorder
│   │   └── ...
│   ├── layout.tsx                # Root layout (ThemeProvider, QueryProvider, Toaster, SW)
│   └── page.tsx                  # Main router (switches modules by activeView)
├── modules/                      # Feature modules (one folder per module)
│   ├── dashboard/                # Executive dashboard with KPIs + charts + AI insights
│   ├── crm/                      # Customer management + detail view + forms
│   ├── sales/                    # Orders + invoices + payments + order detail drawer
│   ├── products/                 # Catalog + grid/table + product form
│   ├── inventory/                # Stock + batches + AI reorder + stock adjustment
│   ├── stock-movements/          # Audit trail of all stock changes
│   ├── procurement/              # Suppliers + POs + GRN + New PO drawer
│   ├── finance/                  # P&L + expenses + payments + bank accounts
│   ├── production/               # Batch tracking + yield/loss + warehouse ops
│   ├── analytics/                # 14+ chart sections + forecasts + rankings
│   ├── reports/                  # 9 report types + CSV/Excel/JSON export
│   ├── settings/                 # Users + RBAC matrix + audit log + company settings
│   ├── visits/                   # Field activity tracking
│   ├── tasks/                    # Task management
│   └── auth/                     # Login screen with 7 demo accounts
├── shared/
│   ├── components/               # Reusable UI: AppShell, KPICard, charts, DataTable, forms
│   ├── hooks/                    # usePermission (RBAC), useKeyboardShortcuts, useRealtime
│   ├── lib/                      # rbac.ts, format.ts, store.ts (Zustand)
│   ├── services/                 # api.ts (GET), mutations.ts (TanStack Query hooks)
│   └── types/                    # TypeScript interfaces for all entities
└── lib/
    └── db.ts                     # Prisma client singleton
```

### Data Flow

```
User Action → Zustand store (UI state) → TanStack Query mutation → POST/PUT/DELETE API route
                                         ↓ (optimistic update)
                                         Prisma transaction → Database (SQLite)
                                         ↓ (on success)
                                         Invalidate query keys → Refetch → UI updates
                                         ↓ (parallel)
                                         Toast notification + audit log
```

---

## Key Patterns

### 1. State Management

- **Client state** (auth, navigation, sidebar): Zustand (`src/shared/lib/store.ts`)
- **Server state** (all data): TanStack Query (`src/shared/services/mutations.ts`)
- **Form state**: React Hook Form + Zod (in drawer components)

### 2. RBAC Enforcement

```tsx
import { Can } from '@/shared/hooks/use-permission'

<Can module="sales" action="create">
  <Button>New Order</Button>
</Can>
```

The `<Can>` component hides UI elements based on the current user's role. RBAC matrix is defined in `src/shared/lib/rbac.ts` — 11 roles × 15 modules.

### 3. Mutations with Optimistic Updates

```tsx
const createOrder = useCreateOrder()  // from mutations.ts
await createOrder.mutateAsync({ customerId, items, ... })
// UI updates instantly (optimistic), rolls back on error
// Toast shows success/error
// Related queries auto-invalidate (orders, inventory, dashboard, etc.)
```

### 4. API Route Pattern

```typescript
// src/app/api/[entity]/route.ts
export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await db.entity.findMany({ include: { ... } })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const data = createSchema.parse(body)  // Zod validation
  const result = await db.$transaction(async (tx) => {
    // Create entity + side effects (stock, timeline, notifications, audit log)
  })
  return NextResponse.json(result, { status: 201 })
}
```

### 5. Form Drawer Pattern

All forms use the `FormDrawer` component (`src/shared/components/form-drawer.tsx`):
- Drawer (bottom sheet) with header, scrollable body, footer
- `Field` component for labeled inputs
- `FormGrid` for multi-column layouts
- Submit button disabled until required fields are filled
- Toast on success, error message on failure

### 6. DataTable Pattern

All tables use the `DataTable` component (`src/shared/components/data-table.tsx`):
- Sortable columns (click header)
- Client-side search
- Pagination (10/12 per page)
- Custom cell renderers
- Row click handler
- Loading skeleton
- Empty state

---

## Database

**Prisma schema:** `prisma/schema.prisma` (35 models)

**Seed script:** `scripts/seed.ts` — generates realistic data based on the Rise Foods Business Intelligence Report (Gorakhpur, 3 launch spices, 25 retailers, real prices).

**Key relationships:**
- Customer → SalesOrders → SalesOrderItems → Products
- Customer → Payments → Invoices
- Supplier → PurchaseOrders → PurchaseOrderItems → Products
- Product → Inventory → Batches → StockMovements
- User → AuditLogs, Visits, Tasks, Targets

---

## Adding a New Feature

### Example: Adding a "Discounts" module

1. **Schema:** Add `Discount` model to `prisma/schema.prisma`
2. **Push:** `bun run db:push`
3. **API:** Create `src/app/api/discounts/route.ts` (GET + POST)
4. **Types:** Add `Discount` interface to `src/shared/types/index.ts`
5. **Mutations:** Add `useDiscounts` + `useCreateDiscount` to `src/shared/services/mutations.ts`
6. **RBAC:** Add `'discounts'` to `MODULES` array + each role in `src/shared/lib/rbac.ts`
7. **Module:** Create `src/modules/discounts/discounts-module.tsx`
8. **Navigation:** Add to `NAV` array in `src/shared/components/app-shell.tsx`
9. **Search:** Add to `NAV_ITEMS` in `src/shared/components/search-palette.tsx`
10. **Router:** Add to `src/app/page.tsx`
11. **Shortcuts:** Add to `SHORTCUTS` in `src/shared/hooks/use-keyboard-shortcuts.ts`

---

## Important Rules

1. **Always use `'use client'`** at the top of any file that uses hooks, state, or browser APIs
2. **Never use `useEffect` for state sync** — use `key` prop to remount components instead
3. **Always validate with Zod** in API routes
4. **Always wrap mutations in try/catch** and show toast on error
5. **Always create audit log entries** for create/update/delete actions
6. **Always invalidate related queries** after mutations
7. **Use INR formatting** (`fmtINR`) for all currency display
8. **Use the `Can` component** to hide buttons users don't have permission for
9. **File paths:** All files under `/home/z/my-project/`
10. **Lint must pass:** `bun run lint` before considering work done

---

## File Quick Reference

| What | Where |
|------|-------|
| Database schema | `prisma/schema.prisma` |
| Seed data | `scripts/seed.ts` |
| API routes | `src/app/api/*/route.ts` |
| TypeScript types | `src/shared/types/index.ts` |
| RBAC matrix | `src/shared/lib/rbac.ts` |
| Zustand store | `src/shared/lib/store.ts` |
| Formatters (INR, dates, export) | `src/shared/lib/format.ts` |
| TanStack Query hooks | `src/shared/services/mutations.ts` |
| API client (GET) | `src/shared/services/api.ts` |
| AppShell (sidebar + topbar) | `src/shared/components/app-shell.tsx` |
| Search palette (⌘K) | `src/shared/components/search-palette.tsx` |
| Charts (Recharts wrappers) | `src/shared/components/charts.tsx` |
| DataTable | `src/shared/components/data-table.tsx` |
| KPI Card | `src/shared/components/kpi-card.tsx` |
| Form Drawer | `src/shared/components/form-drawer.tsx` |
| WebSocket service | `mini-services/notifications-service/index.ts` |
| PWA manifest | `public/manifest.json` |
| Service worker | `public/sw.js` |

---

## Current State (as of v1.0.0)

- **15 modules** all functional
- **40+ API endpoints** all returning 200
- **35 Prisma models** with full relations
- **12 form drawers** for CRUD operations
- **Lint:** Clean (0 errors)
- **RBAC:** 11 roles × 15 modules, enforced in UI
- **Real-time:** Socket.IO service running on port 3003
- **PWA:** Installable with offline support
- **Export:** CSV, JSON, Excel (.xlsx)

See `PROJECT_STATUS.md` for the full implementation report.
