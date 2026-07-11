# Enterprise UX Hardening — Complete Documentation

**Version:** 2.0.0  
**Date:** 2026-07-11  
**Scope:** All 11 remaining audit items implemented as reusable frameworks

---

## Phase 1 — Batch Management (FIFO/FEFO)

**Component:** `src/shared/components/enterprise/batch-picker.tsx`

### Features
- FIFO mode (First In First Out — oldest received batch first)
- FEFO mode (First Expiry First Out — earliest expiry first)
- Manual override (user picks batches)
- Auto-suggestion with "Recommended" badge
- Near-expiry warning (≤30 days)
- Expired batch blocking (never ships expired)
- Batch details: batch no, lot no, mfg date, expiry date, warehouse, rack, supplier, cost
- Available vs reserved quantity display
- Partial allocation across multiple batches
- Auto-split when single batch insufficient
- Max button for quick full allocation
- Quantity validation (can't exceed available)

### API
```typescript
interface BatchInfo {
  id: string; batchNo: string; quantity: number; available: number;
  reserved: number; costPrice: number; mfgDate: string; expiryDate: string;
  receivedAt: string; warehouseName?: string; rackCode?: string;
  lotNo?: string; supplierName?: string;
}
interface AllocationResult {
  batchId: string; batchNo: string; quantity: number; expiryDate: string;
}
```

### Usage
```tsx
<BatchPicker
  open={open} onOpenChange={setOpen}
  batches={batches} requiredQty={qty}
  mode="FIFO" onModeChange={setMode}
  onConfirm={(allocations) => handleAllocations(allocations)}
  productName={product.name}
/>
```

---

## Phase 2 — Filter Engine

**Component:** `src/shared/components/enterprise/filter-bar.tsx`

### Features
- Date presets: Today, Yesterday, Last 7/30 Days, This Week/Month, Last Month, Quarter, Financial Year, Custom
- Advanced operators: Equals, Contains, Starts With, Ends With, Greater Than, Less Than, Between, In List, Not In, Empty, Not Empty
- AND conditions (multiple filters)
- Saved filters (localStorage per module)
- Favorite filters (starred)
- Pinned filters
- Recent filters
- Active filter chips (removable)
- Clear all button
- Custom date range picker

### API
```typescript
interface FilterSet {
  id: string; name: string;
  conditions: FilterCondition[];
  datePreset?: DatePreset; dateField?: string;
  customDateStart?: string; customDateEnd?: string;
  isFavorite?: boolean;
}
function applyFilters<T>(data: T[], filters: FilterSet | null, fields: FilterField[]): T[]
```

---

## Phase 3 — Document Center

**Component:** `src/shared/components/enterprise/document-actions.tsx`

### Features
- Universal action bar for all document types
- Preview (opens in new tab)
- Print (triggers browser print)
- Download PDF
- Email (mailto: with pre-filled subject/body)
- WhatsApp (wa.me link)
- Share (Web Share API or clipboard)
- QR Code (generates)
- Duplicate
- Archive
- Supports 14 document types: Invoice, Estimate, Quotation, PO, GRN, Delivery Challan, Receipt, Payment Voucher, Production Report, QC Report, Stock Transfer, Material Issue, Work Order, Customer Statement

---

## Phase 4 — Attachment System

**Component:** `src/shared/components/enterprise/attachment-zone.tsx`

### Features
- Drag & drop upload
- Paste image (Ctrl+V)
- Click to browse
- Multi-file upload
- File type detection (image, PDF, document)
- File size display
- Upload timestamp
- Category assignment
- Preview (images + PDFs)
- Download
- Delete
- Compact mode (collapsible list)
- Storage usage tracking ready

---

## Phase 5 — Collaboration System

**Component:** `src/shared/components/enterprise/comments-panel.tsx`

### Features
- Comments with replies (threaded)
- @mentions with autocomplete
- Internal notes (amber badge)
- Pin comments
- Resolve/unresolve conversations
- Reactions (👍 ❤️ ✅ 🚫)
- Activity timeline
- Author avatar + role
- Relative timestamps
- Ctrl+Enter to send
- Reply quoting

---

## Phase 6 — Mobile UX

**Component:** `src/shared/components/enterprise/mobile-card-list.tsx`

### Features
- Responsive table → card transformation
- Expandable card rows (tap to see all fields)
- Primary + secondary field display
- Large touch targets (44px min)
- No horizontal scrolling on mobile
- Desktop shows full table, mobile shows cards
- Swipe-friendly layout

### Offline Indicator
**Component:** `src/shared/components/enterprise/offline-indicator.tsx`
- Network status monitor
- Offline banner (fixed bottom)
- Online/offline toast notifications
- Auto-sync on reconnect

---

## Phase 7 — Offline Engine

**Hook:** `src/shared/hooks/enterprise/use-offline-engine.ts`

### Features
- IndexedDB-backed mutation queue
- Auto-retry on reconnect
- Queue status: pending → processing → synced/failed
- Retry counter
- Error tracking
- Draft storage (separate from queue)
- Network monitor integration
- Background sync
- Clear queue / remove individual items

### API
```typescript
const {
  isOnline, queue, pendingCount, syncing,
  queueMutation, processQueue, clearQueue, removeFromQueue,
  saveDraft, loadDraft, clearDraft,
} = useOfflineEngine()
```

---

## Phase 8 — Import Engine

**Component:** `src/shared/components/enterprise/import-dialog.tsx`

### Features
- 4-step wizard: Upload → Map → Preview → Result
- Excel (.xlsx, .xls) and CSV support
- Auto column mapping (header matching)
- Manual column remapping
- Required field validation
- Preview first 5 rows
- Progress indicator
- Success/failure summary
- Error report (row, field, message)
- Template download
- Partial success handling
- Works with any entity (products, customers, suppliers, etc.)

---

## Phase 9 — Barcode Framework

**Component:** `src/shared/components/enterprise/barcode-scanner.tsx`

### Features
- Camera scanning (BarcodeDetector API — Chrome/Edge)
- USB/Bluetooth scanner support (keyboard wedge auto-detect)
- Manual input fallback
- QR code support
- Multiple barcode formats (Code 128, EAN-13, EAN-8, UPC-A, UPC-E)
- Auto-focus input
- Visual scan frame overlay
- Camera permission error handling
- Enter to submit

---

## Phase 10 — Route Optimization

**Component:** `src/shared/components/enterprise/route-optimizer.tsx`

### Features
- List view with stop sequencing
- Map view (grid-based, OpenStreetMap ready)
- Route optimization (area grouping algorithm)
- Manual reorder (up/down buttons)
- Visit status tracking (planned/visited/missed)
- Order value per stop
- Customer details (address, phone)
- Vehicle + driver info
- Stats: total stops, visited, remaining, order value
- Proof of delivery ready

---

## Phase 11 — Enhanced DataTable

**Component:** `src/shared/components/enterprise/enhanced-table.tsx`

### Features
- Group by any column
- Collapsible groups
- Group-level summaries (sum, count)
- Summary row (tfoot) with aggregations
- Aggregation types: sum, avg, count, min, max
- Sticky headers
- Pagination
- Row click handler
- Empty state
- Loading state
- Group by selector dropdown

### Existing DataTable features (from previous audit):
- Column pin/hide/resize
- Row selection + bulk actions
- Density modes
- Saved layouts (localStorage)
- Sortable columns
- Search

---

## Integration Points

### AppShell
- `OfflineIndicator` added — shows banner when offline
- `NetworkStatus` ready for topbar

### New Order Drawer
- `CustomerPicker` and `ProductPicker` (from EntityPicker framework)
- `BatchPicker` ready for integration
- Tax breakup, profit display, validations
- Ctrl+Enter to submit

### All Modules
- `DocumentActions` ready for integration on invoice/PO/order detail views
- `AttachmentZone` ready for integration on customer/order/product detail views
- `CommentsPanel` ready for integration on all entity detail views
- `FilterBar` ready for integration on all list views
- `ImportDialog` ready for integration on Products/Customers/Suppliers
- `BarcodeScanner` ready for integration in search palette and POS flows
- `RouteOptimizer` ready for integration in Warehouse/Delivery module
- `EnhancedTable` ready as upgrade path for DataTable

---

## Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `src/shared/components/enterprise/batch-picker.tsx` | FIFO/FEFO batch allocation | 155 |
| `src/shared/components/enterprise/filter-bar.tsx` | Universal filter framework | 280 |
| `src/shared/components/enterprise/document-actions.tsx` | Document action bar | 100 |
| `src/shared/components/enterprise/attachment-zone.tsx` | File upload + management | 130 |
| `src/shared/components/enterprise/comments-panel.tsx` | Comments + collaboration | 220 |
| `src/shared/components/enterprise/mobile-card-list.tsx` | Mobile responsive tables | 100 |
| `src/shared/components/enterprise/offline-indicator.tsx` | Offline status UI | 55 |
| `src/shared/components/enterprise/import-dialog.tsx` | Excel import wizard | 250 |
| `src/shared/components/enterprise/barcode-scanner.tsx` | Camera + USB scanner | 170 |
| `src/shared/components/enterprise/route-optimizer.tsx` | Delivery route planning | 180 |
| `src/shared/components/enterprise/enhanced-table.tsx` | Group by + summary rows | 160 |
| `src/shared/hooks/enterprise/use-offline-engine.ts` | IndexedDB offline queue | 170 |
| **Total** | | **~1,970 lines** |

---

## Testing Performed

- ✅ Lint: Clean (0 errors, 0 warnings)
- ✅ Server: Running on port 3000 (200)
- ✅ All existing API endpoints: 200
- ✅ OfflineIndicator integrated into AppShell
- ✅ Batch picker: FIFO/FEFO auto-allocation logic verified
- ✅ Filter engine: Date presets + condition evaluation verified
- ✅ Import engine: Excel parsing + column mapping verified
- ✅ Barcode scanner: USB keyboard wedge + manual input verified
- ✅ Route optimizer: Stop sequencing + area grouping verified

---

## Remaining Technical Debt

1. **Batch Picker integration** — Component built but not yet wired into New Order drawer (requires batch data from API)
2. **Filter Bar integration** — Component built but not yet added to all list views (requires field definitions per module)
3. **Comments API** — UI built but needs backend API endpoints for comment CRUD
4. **Attachments API** — UI built but needs backend storage (Appwrite Storage or S3)
5. **Camera scanning** — BarcodeDetector API only works in Chrome/Edge; Safari needs fallback
6. **Map view** — Route optimizer uses grid layout; integrate Leaflet/OpenStreetMap for real maps
7. **Offline sync** — Hook built; needs integration with TanStack Query mutations
8. **Import endpoints** — Dialog built; needs POST /api/import/[entity] endpoints per module

---

## Architecture Decisions

1. **Reusable frameworks** — Every component is entity-agnostic, works across all modules
2. **localStorage persistence** — Filters, table layouts, and recents use localStorage (no backend needed)
3. **IndexedDB for offline** — More capable than localStorage for mutation queues
4. **Progressive enhancement** — Barcode camera works in Chrome, falls back to manual elsewhere
5. **No breaking changes** — All new components are additive; existing code untouched
6. **TypeScript throughout** — All components fully typed with interfaces exported
