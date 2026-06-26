'use client'
// API client — typed wrappers around fetch for all ERP data operations
import type {
  Customer, Product, Inventory, Batch, Supplier, SalesOrder, PurchaseOrder,
  Invoice, Payment, Expense, AIInsight, NotificationItem, ProductionBatch,
  TimelineEntry, DashboardKPIs, ChartPoint, SeriesPoint, User,
} from '../types'

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

export const api = {
  // Dashboard
  dashboard: () => get<{ kpis: DashboardKPIs; revenueTrend: SeriesPoint[]; profitTrend: SeriesPoint[]; cashFlowTrend: SeriesPoint[]; purchaseTrend: SeriesPoint[]; inventoryTrend: SeriesPoint[]; topProducts: ChartPoint[]; topCustomers: ChartPoint[]; topSalesmen: ChartPoint[]; salesByDistrict: ChartPoint[]; salesByArea: ChartPoint[]; fastMoving: ChartPoint[]; slowMoving: ChartPoint[]; profitByProduct: ChartPoint[]; profitByArea: ChartPoint[]; orderStatus: ChartPoint[]; collectionByDay: ChartPoint[]; categoryTrend: ChartPoint[] }>('/api/dashboard'),

  // CRM
  customers: (q?: string) => get<Customer[]>(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  customer: (id: string) => get<Customer>(`/api/customers/${id}`),
  customerTimeline: (id: string) => get<TimelineEntry[]>(`/api/customers/${id}/timeline`),
  customerOrders: (id: string) => get<SalesOrder[]>(`/api/customers/${id}/orders`),

  // Products
  products: () => get<Product[]>('/api/products'),
  product: (id: string) => get<Product>(`/api/products/${id}`),

  // Inventory
  inventory: () => get<Inventory[]>('/api/inventory'),
  batches: () => get<Batch[]>('/api/batches'),
  stockMovements: () => get<any[]>('/api/inventory/movements'),

  // Procurement
  suppliers: () => get<Supplier[]>('/api/suppliers'),
  purchaseOrders: () => get<PurchaseOrder[]>('/api/procurement/orders'),

  // Sales
  salesOrders: () => get<SalesOrder[]>('/api/sales/orders'),
  invoices: () => get<Invoice[]>('/api/sales/invoices'),
  payments: () => get<Payment[]>('/api/sales/payments'),

  // Finance
  expenses: () => get<Expense[]>('/api/finance/expenses'),
  bankAccounts: () => get<any[]>('/api/finance/accounts'),
  pnl: () => get<{ revenue: number; cogs: number; grossProfit: number; expenses: number; netProfit: number; breakdown: ChartPoint[] }>('/api/finance/pnl'),

  // Production
  productionBatches: () => get<ProductionBatch[]>('/api/production'),

  // Insights & Notifications
  insights: () => get<AIInsight[]>('/api/insights'),
  notifications: () => get<NotificationItem[]>('/api/notifications'),
  markNotifRead: (id: string) => fetch(`/api/notifications/${id}/read`, { method: 'POST' }),

  // Users
  users: () => get<User[]>('/api/users'),

  // Analytics
  analytics: () => get<{
    districtHeatmap: ChartPoint[]
    areaHeatmap: ChartPoint[]
    retailerRanking: ChartPoint[]
    skuRanking: ChartPoint[]
    inventoryAging: ChartPoint[]
    abcAnalysis: ChartPoint[]
    xyzAnalysis: ChartPoint[]
    pareto: ChartPoint[]
    salesmanRanking: ChartPoint[]
    supplierRanking: ChartPoint[]
    customerSegments: ChartPoint[]
    cashConversionCycle: { days: number; inventoryDays: number; receivableDays: number; payableDays: number }
    seasonality: ChartPoint[]
    forecast: ChartPoint[]
    growthTrend: SeriesPoint[]
    targetAchievement: ChartPoint[]
  }>('/api/analytics'),

  // Audit log
  auditLog: () => get<any[]>('/api/audit'),
}
