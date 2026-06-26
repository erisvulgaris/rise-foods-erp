// ─────────────────────────────────────────────────────────────────────────────
// Rise Foods ERP — Shared Types
// ─────────────────────────────────────────────────────────────────────────────

export type Role =
  | 'owner' | 'admin' | 'purchase_manager' | 'warehouse_manager'
  | 'sales_manager' | 'salesman' | 'accountant' | 'factory_staff'
  | 'delivery_staff' | 'retailer' | 'distributor'

export type CustomerStatus = 'lead' | 'active' | 'inactive' | 'blocked'
export type CustomerType = 'retailer' | 'distributor' | 'horeca' | 'lead'
export type OrderStatus = 'pending' | 'packed' | 'dispatched' | 'delivered' | 'cancelled' | 'returned'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'
export type POStatus = 'draft' | 'sent' | 'partial' | 'received' | 'closed' | 'cancelled'
export type BatchStatus = 'in_stock' | 'partial' | 'empty' | 'expired' | 'damaged'
export type ABCClass = 'A' | 'B' | 'C'

export interface User {
  id: string
  email: string
  name: string
  phone?: string | null
  role: Role
  employeeId?: string | null
  avatar?: string | null
  isActive: boolean
  lastLoginAt?: string | null
  createdAt: string
}

export interface Customer {
  id: string
  businessName: string
  ownerName?: string | null
  phone: string
  email?: string | null
  gst?: string | null
  fssai?: string | null
  address: string
  district: string
  area: string
  pin?: string | null
  geoLat?: number | null
  geoLng?: number | null
  type: CustomerType
  salesmanId?: string | null
  salesman?: Pick<User, 'id' | 'name'> | null
  creditLimit: number
  creditDays: number
  outstanding: number
  status: CustomerStatus
  riskScore: number
  retentionScore: number
  orderFrequency: number
  avgOrderValue: number
  lifetimeValue: number
  profitGenerated: number
  lastOrderAt?: string | null
  lastPaymentAt?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  sku: string
  barcode?: string | null
  name: string
  categoryId?: string | null
  category?: { id: string; name: string } | null
  brand: string
  description?: string | null
  hsn?: string | null
  gstRate: number
  mrp: number
  wholesalePrice: number
  distributorPrice: number
  retailPrice: number
  costPrice: number
  marginPercent: number
  packagingSize?: string | null
  shelfLifeDays: number
  moq: number
  reorderLevel: number
  abcClass: ABCClass
  xyzClass: string
  image?: string | null
  status: 'active' | 'discontinued' | 'draft'
}

export interface Inventory {
  id: string
  productId: string
  product: Product
  warehouseId: string
  warehouse: { id: string; name: string; code: string }
  currentStock: number
  reservedStock: number
  incomingStock: number
  reorderLevel: number
  reorderQty: number
  valuation: number
  lastStockAt?: string | null
}

export interface Batch {
  id: string
  batchNo: string
  productId: string
  product: Product
  warehouseId?: string | null
  warehouse?: { id: string; name: string } | null
  quantity: number
  reservedQty: number
  costPrice: number
  mfgDate: string
  expiryDate: string
  receivedAt: string
  status: BatchStatus
  supplier?: { id: string; name: string } | null
}

export interface Supplier {
  id: string
  name: string
  contactPerson?: string | null
  phone: string
  email?: string | null
  gst?: string | null
  address: string
  district: string
  rating: number
  leadTimeDays: number
  paymentTerms?: string | null
  outstanding: number
  totalPurchased: number
  onTimeRate: number
  qualityRate: number
  status: 'active' | 'blocked' | 'blacklist'
}

export interface SalesOrderItem {
  id: string
  productId: string
  product: { id: string; name: string; sku: string; packagingSize?: string | null }
  quantity: number
  unitPrice: number
  unitCost: number
  taxPercent: number
  discount: number
  total: number
  profit: number
}

export interface SalesOrder {
  id: string
  orderNo: string
  customerId: string
  customer: { id: string; businessName: string; phone: string; area: string; district: string }
  salesmanId?: string | null
  salesman?: { id: string; name: string } | null
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotal: number
  tax: number
  discount: number
  total: number
  paid: number
  profit: number
  itemsCount: number
  channel: string
  notes?: string | null
  createdBy?: string | null
  packedAt?: string | null
  dispatchedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  createdAt: string
  updatedAt: string
  items?: SalesOrderItem[]
}

export interface PurchaseOrder {
  id: string
  poNo: string
  supplierId: string
  supplier: { id: string; name: string; phone: string }
  warehouseId: string
  warehouse: { id: string; name: string; code: string }
  status: POStatus
  subtotal: number
  tax: number
  total: number
  paid: number
  expectedAt?: string | null
  receivedAt?: string | null
  notes?: string | null
  createdBy?: string | null
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNo: string
  orderId: string
  customerId: string
  customer: { id: string; businessName: string }
  type: 'sales' | 'credit_note' | 'debit_note' | 'proforma'
  subtotal: number
  tax: number
  total: number
  paid: number
  balance: number
  status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'
  dueDate?: string | null
  createdAt: string
}

export interface Payment {
  id: string
  paymentNo: string
  orderId?: string | null
  invoiceId?: string | null
  customerId: string
  customer: { id: string; businessName: string }
  amount: number
  method: 'cash' | 'upi' | 'bank' | 'cheque' | 'credit'
  reference?: string | null
  status: 'pending' | 'completed' | 'failed' | 'reversed'
  collectedBy?: string | null
  createdAt: string
}

export interface Expense {
  id: string
  category: string
  subcategory?: string | null
  amount: number
  date: string
  vendor?: string | null
  paymentMode: string
  status: 'paid' | 'pending'
  note?: string | null
  createdAt: string
}

export interface AIInsight {
  id: string
  type: 'trend' | 'anomaly' | 'recommendation' | 'forecast' | 'risk'
  category: 'sales' | 'inventory' | 'finance' | 'customer' | 'procurement'
  title: string
  body: string
  severity: 'info' | 'warning' | 'critical' | 'success'
  metric?: string | null
  metricValue?: number | null
  deltaPercent?: number | null
  recommendation?: string | null
  isActioned: boolean
  createdAt: string
}

export interface NotificationItem {
  id: string
  userId?: string | null
  type: string
  title: string
  body?: string | null
  severity: 'info' | 'warning' | 'critical' | 'success'
  isRead: boolean
  createdAt: string
}

export interface ProductionBatch {
  id: string
  batchNo: string
  productId?: string | null
  product?: { id: string; name: string; sku: string } | null
  startDate: string
  endDate?: string | null
  stage: 'cleaning' | 'grinding' | 'packing' | 'finished' | 'qc'
  inputQty: number
  outputQty: number
  yieldPercent: number
  lossPercent: number
  machineName?: string | null
  operator?: { id: string; name: string } | null
  cost: number
  downtime: number
  notes?: string | null
}

export interface TimelineEntry {
  id: string
  customerId: string
  type: 'note' | 'call' | 'visit' | 'whatsapp' | 'invoice' | 'payment' | 'order' | 'email'
  title: string
  body?: string | null
  createdBy?: string | null
  createdAt: string
}

export interface DashboardKPIs {
  todaySales: number
  weeklySales: number
  monthlySales: number
  grossProfit: number
  netProfit: number
  cashAvailable: number
  outstandingPayments: number
  inventoryValue: number
  pendingOrders: number
  completedOrders: number
  lowStockCount: number
  expiryAlertCount: number
  totalCustomers: number
  activeCustomers: number
  topSalesman: { id: string; name: string; revenue: number } | null
  dailyCollection: number
  targetAchievement: number
}

export interface ChartPoint {
  label: string
  value: number
  value2?: number
  [key: string]: string | number | undefined
}

export interface SeriesPoint {
  date: string
  revenue?: number
  profit?: number
  cogs?: number
  cashIn?: number
  cashOut?: number
  stockValue?: number
  purchases?: number
}
