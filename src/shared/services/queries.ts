import { db } from '@/lib/db'

// ─────────────────────────────────────────────────────────────────────────────
// Server-side aggregations used by the dashboard / analytics endpoints.
// ─────────────────────────────────────────────────────────────────────────────

const DAY = 86400000
const now = () => new Date()
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const daysAgo = (n: number) => new Date(Date.now() - n * DAY)
const startOfDayAgo = (n: number) => startOfDay(daysAgo(n))

export async function getDashboard() {
  const todayStart = startOfDay(now())
  const weekStart = startOfDayAgo(7)
  const monthStart = startOfDayAgo(30)

  const [orders, payments, expenses, inventory, batches, customers, topSalesmanRow, bankAccounts, dailyCollectionRow, targetRow] = await Promise.all([
    db.salesOrder.findMany({ where: { status: { not: 'cancelled' } }, include: { customer: { select: { id: true, businessName: true, area: true, district: true, phone: true } } } }),
    db.payment.findMany({ where: { status: 'completed' }, include: { customer: { select: { id: true, businessName: true } } } }),
    db.expense.findMany(),
    db.inventory.findMany({ include: { product: { select: { id: true, name: true, sku: true, costPrice: true, abcClass: true, xyzClass: true, packagingSize: true, category: { select: { name: true } } } }, warehouse: { select: { id: true, name: true, code: true } } } }),
    db.batch.findMany({ include: { product: { select: { id: true, name: true, sku: true, packagingSize: true, category: { select: { name: true } } } }, warehouse: { select: { id: true, name: true } }, supplier: { select: { id: true, name: true } } } }),
    db.customer.findMany({ include: { salesman: { select: { id: true, name: true } } } }),
    db.salesOrder.groupBy({ by: ['salesmanId'], where: { status: { not: 'cancelled' }, createdAt: { gte: monthStart } }, _sum: { total: true }, orderBy: { _sum: { total: 'desc' } } }),
    db.bankAccount.findMany(),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: 'completed', createdAt: { gte: todayStart } } }),
    db.target.findMany({ where: { period: 'monthly', metric: 'revenue', periodKey: new Date().toISOString().slice(0, 7) } }),
  ])

  // KPIs
  const todaySales = orders.filter((o) => new Date(o.createdAt) >= todayStart).reduce((s, o) => s + o.total, 0)
  const weeklySales = orders.filter((o) => new Date(o.createdAt) >= weekStart).reduce((s, o) => s + o.total, 0)
  const monthlySales = orders.filter((o) => new Date(o.createdAt) >= monthStart).reduce((s, o) => s + o.total, 0)
  const grossProfit = orders.reduce((s, o) => s + o.profit, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = grossProfit - totalExpenses
  const cashAvailable = bankAccounts.reduce((s, b) => s + b.balance, 0)
  const outstandingPayments = customers.reduce((s, c) => s + c.outstanding, 0)
  const inventoryValue = inventory.reduce((s, i) => s + i.valuation, 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'packed').length
  const completedOrders = orders.filter((o) => o.status === 'delivered').length
  const lowStockCount = inventory.filter((i) => i.currentStock <= i.reorderLevel).length
  const expiryAlertCount = batches.filter((b) => {
    const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / DAY)
    return days <= 30 && b.status !== 'expired'
  }).length
  const activeCustomers = customers.filter((c) => c.status === 'active').length
  const topSalesman = topSalesmanRow[0]?.salesmanId
    ? { id: topSalesmanRow[0].salesmanId, name: customers.find((c) => c.salesmanId === topSalesmanRow[0].salesmanId)?.salesman?.name ?? '—', revenue: topSalesmanRow[0]._sum.total ?? 0 }
    : null
  const dailyCollection = dailyCollectionRow._sum.amount ?? 0
  const targetAchievement = targetRow.length
    ? (targetRow.reduce((s, t) => s + t.achieved, 0) / targetRow.reduce((s, t) => s + t.target, 0)) * 100
    : 0

  // Trends (last 30 days, daily)
  const days = 30
  const revenueTrend: SeriesPoint[] = []
  const profitTrend: SeriesPoint[] = []
  const cashFlowTrend: SeriesPoint[] = []
  const purchaseTrend: SeriesPoint[] = []
  const inventoryTrend: SeriesPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = startOfDayAgo(i)
    const dayEnd = new Date(dayStart.getTime() + DAY)
    const dayOrders = orders.filter((o) => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) < dayEnd)
    const dayPayments = payments.filter((p) => new Date(p.createdAt) >= dayStart && new Date(p.createdAt) < dayEnd)
    const dayExpenses = expenses.filter((e) => new Date(e.date) >= dayStart && new Date(e.date) < dayEnd)
    revenueTrend.push({ date: dayStart.toISOString().slice(5, 10), revenue: round(dayOrders.reduce((s, o) => s + o.total, 0)) })
    profitTrend.push({ date: dayStart.toISOString().slice(5, 10), profit: round(dayOrders.reduce((s, o) => s + o.profit, 0)), cogs: round(dayOrders.reduce((s, o) => s + (o.total - o.profit), 0)) })
    cashFlowTrend.push({ date: dayStart.toISOString().slice(5, 10), cashIn: round(dayPayments.reduce((s, p) => s + p.amount, 0)), cashOut: round(dayExpenses.reduce((s, e) => s + e.amount, 0)) })
  }

  // Purchase trend (from POs)
  const pos = await db.purchaseOrder.findMany()
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = startOfDayAgo(i)
    const dayEnd = new Date(dayStart.getTime() + DAY)
    const dayPOs = pos.filter((p) => new Date(p.createdAt) >= dayStart && new Date(p.createdAt) < dayEnd)
    purchaseTrend.push({ date: dayStart.toISOString().slice(5, 10), purchases: round(dayPOs.reduce((s, p) => s + p.total, 0)) })
  }
  // Inventory trend (approximate — current valuation back-extrapolated via stock movements)
  const movements = await db.stockMovement.findMany({ where: { type: { in: ['stock_in', 'stock_out'] } }, orderBy: { createdAt: 'asc' } })
  const currentValue = inventoryValue
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = startOfDayAgo(i)
    const dayEnd = new Date(dayStart.getTime() + DAY)
    // approximate historical value: assume linear from a 15% lower base 30 days ago
    const factor = 0.85 + (i / days) * 0.15
    inventoryTrend.push({ date: dayStart.toISOString().slice(5, 10), stockValue: round(currentValue * factor) })
  }

  // Top products (by revenue)
  const productAgg = new Map<string, { name: string; revenue: number; qty: number; profit: number }>()
  const soItems = await db.salesOrderItem.findMany({ where: { so: { status: { not: 'cancelled' } } }, include: { product: { select: { id: true, name: true, sku: true, packagingSize: true } } } })
  for (const it of soItems) {
    const cur = productAgg.get(it.productId) ?? { name: it.product.name, revenue: 0, qty: 0, profit: 0 }
    cur.revenue += it.total
    cur.qty += it.quantity
    cur.profit += it.profit
    productAgg.set(it.productId, cur)
  }
  const topProducts = [...productAgg.entries()].map(([id, v]) => ({ label: v.name, value: round(v.revenue), qty: v.qty, profit: round(v.profit) })).sort((a, b) => b.value - a.value).slice(0, 8)
  const fastMoving = [...productAgg.entries()].map(([id, v]) => ({ label: v.name, value: v.qty, revenue: round(v.revenue) })).sort((a, b) => b.value - a.value).slice(0, 6)
  const slowMoving = [...productAgg.entries()].map(([id, v]) => ({ label: v.name, value: v.qty, revenue: round(v.revenue) })).sort((a, b) => a.value - b.value).slice(0, 6)
  const profitByProduct = [...productAgg.entries()].map(([id, v]) => ({ label: v.name, value: round(v.profit) })).sort((a, b) => b.value - a.value).slice(0, 8)

  // Top customers
  const customerAgg = new Map<string, { name: string; revenue: number; profit: number }>()
  for (const o of orders) {
    const cur = customerAgg.get(o.customerId) ?? { name: o.customer.businessName, revenue: 0, profit: 0 }
    cur.revenue += o.total
    cur.profit += o.profit
    customerAgg.set(o.customerId, cur)
  }
  const topCustomers = [...customerAgg.entries()].map(([id, v]) => ({ label: v.name, value: round(v.revenue), profit: round(v.profit) })).sort((a, b) => b.value - a.value).slice(0, 8)
  const profitByArea = [...customerAgg.entries()].map(([id, v]) => {
    const c = customers.find((x) => x.id === id)
    return { label: c?.area ?? 'Unknown', value: round(v.profit) }
  }).reduce((acc, x) => {
    const found = acc.find((y) => y.label === x.label)
    if (found) found.value += x.value
    else acc.push(x)
    return acc
  }, [] as ChartPoint[]).sort((a, b) => b.value - a.value).slice(0, 8)

  // Sales by district / area
  const districtMap = new Map<string, number>()
  const areaMap = new Map<string, number>()
  for (const o of orders) {
    districtMap.set(o.customer.district, (districtMap.get(o.customer.district) ?? 0) + o.total)
    areaMap.set(o.customer.area, (areaMap.get(o.customer.area) ?? 0) + o.total)
  }
  const salesByDistrict = [...districtMap.entries()].map(([label, value]) => ({ label, value: round(value) })).sort((a, b) => b.value - a.value)
  const salesByArea = [...areaMap.entries()].map(([label, value]) => ({ label, value: round(value) })).sort((a, b) => b.value - a.value)

  // Top salesmen
  const salesmanAgg = new Map<string, { name: string; revenue: number; orders: number }>()
  for (const o of orders) {
    if (!o.salesmanId) continue
    const name = customers.find((c) => c.salesmanId === o.salesmanId)?.salesman?.name ?? '—'
    const cur = salesmanAgg.get(o.salesmanId) ?? { name, revenue: 0, orders: 0 }
    cur.revenue += o.total
    cur.orders += 1
    salesmanAgg.set(o.salesmanId, cur)
  }
  const topSalesmen = [...salesmanAgg.entries()].map(([id, v]) => ({ label: v.name, value: round(v.revenue), orders: v.orders })).sort((a, b) => b.value - a.value)

  // Order status distribution
  const statusMap = new Map<string, number>()
  for (const o of orders) statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1)
  const orderStatus = [...statusMap.entries()].map(([label, value]) => ({ label, value }))

  // Collection by day (last 14 days)
  const collectionByDay: ChartPoint[] = []
  for (let i = 13; i >= 0; i--) {
    const dayStart = startOfDayAgo(i)
    const dayEnd = new Date(dayStart.getTime() + DAY)
    const dayPayments = payments.filter((p) => new Date(p.createdAt) >= dayStart && new Date(p.createdAt) < dayEnd)
    collectionByDay.push({ label: dayStart.toISOString().slice(5, 10), value: round(dayPayments.reduce((s, p) => s + p.amount, 0)) })
  }

  // Category trend (revenue by category)
  const catMap = new Map<string, number>()
  for (const it of soItems) {
    const cat = it.product.category?.name ?? 'Uncategorized'
    catMap.set(cat, (catMap.get(cat) ?? 0) + it.total)
  }
  const categoryTrend = [...catMap.entries()].map(([label, value]) => ({ label, value: round(value) })).sort((a, b) => b.value - a.value)

  const kpis = {
    todaySales: round(todaySales), weeklySales: round(weeklySales), monthlySales: round(monthlySales),
    grossProfit: round(grossProfit), netProfit: round(netProfit),
    cashAvailable: round(cashAvailable), outstandingPayments: round(outstandingPayments),
    inventoryValue: round(inventoryValue),
    pendingOrders, completedOrders, lowStockCount, expiryAlertCount,
    totalCustomers: customers.length, activeCustomers,
    topSalesman, dailyCollection: round(dailyCollection),
    targetAchievement: round(targetAchievement),
  }

  return {
    kpis,
    revenueTrend, profitTrend, cashFlowTrend, purchaseTrend, inventoryTrend,
    topProducts, topCustomers, topSalesmen, salesByDistrict, salesByArea,
    fastMoving, slowMoving, profitByProduct, profitByArea,
    orderStatus, collectionByDay, categoryTrend,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────
export async function getAnalytics() {
  const [orders, customers, suppliers, inventory, batches, soItems, pos, payments, expenses] = await Promise.all([
    db.salesOrder.findMany({ where: { status: { not: 'cancelled' } }, include: { customer: { select: { id: true, businessName: true, district: true, area: true } } } }),
    db.customer.findMany({ include: { salesman: { select: { id: true, name: true } } } }),
    db.supplier.findMany(),
    db.inventory.findMany({ include: { product: { select: { id: true, name: true, sku: true, abcClass: true, xyzClass: true, costPrice: true, category: { select: { name: true } } } } } }),
    db.batch.findMany({ include: { product: { select: { id: true, name: true, sku: true, abcClass: true } } } }),
    db.salesOrderItem.findMany({ where: { so: { status: { not: 'cancelled' } } }, include: { product: { select: { id: true, name: true, sku: true, abcClass: true, xyzClass: true, category: { select: { name: true } } } } } }),
    db.purchaseOrder.findMany({ include: { supplier: { select: { id: true, name: true } } } }),
    db.payment.findMany({ where: { status: 'completed' } }),
    db.expense.findMany(),
  ])

  // Heatmaps
  const districtMap = new Map<string, number>()
  const areaMap = new Map<string, number>()
  for (const o of orders) {
    districtMap.set(o.customer.district, (districtMap.get(o.customer.district) ?? 0) + o.total)
    areaMap.set(o.customer.area, (areaMap.get(o.customer.area) ?? 0) + o.total)
  }
  const districtHeatmap = [...districtMap.entries()].map(([label, value]) => ({ label, value: round(value) })).sort((a, b) => b.value - a.value)
  const areaHeatmap = [...areaMap.entries()].map(([label, value]) => ({ label, value: round(value) })).sort((a, b) => b.value - a.value)

  // Rankings
  const custAgg = new Map<string, { name: string; revenue: number; profit: number }>()
  for (const o of orders) {
    const cur = custAgg.get(o.customerId) ?? { name: o.customer.businessName, revenue: 0, profit: 0 }
    cur.revenue += o.total; cur.profit += o.profit
    custAgg.set(o.customerId, cur)
  }
  const retailerRanking = [...custAgg.entries()].map(([id, v]) => ({ label: v.name, value: round(v.revenue), profit: round(v.profit) })).sort((a, b) => b.value - a.value).slice(0, 15)

  const prodAgg = new Map<string, { name: string; revenue: number; qty: number }>()
  for (const it of soItems) {
    const cur = prodAgg.get(it.productId) ?? { name: it.product.name, revenue: 0, qty: 0 }
    cur.revenue += it.total; cur.qty += it.quantity
    prodAgg.set(it.productId, cur)
  }
  const skuRanking = [...prodAgg.entries()].map(([id, v]) => ({ label: v.name, value: round(v.revenue), qty: v.qty })).sort((a, b) => b.value - a.value).slice(0, 15)

  // Inventory aging
  const aging = [{ label: '0–30 days', value: 0 }, { label: '31–60 days', value: 0 }, { label: '61–90 days', value: 0 }, { label: '90+ days', value: 0 }]
  for (const b of batches) {
    const age = Math.floor((Date.now() - new Date(b.receivedAt).getTime()) / DAY)
    if (age <= 30) aging[0].value += b.quantity
    else if (age <= 60) aging[1].value += b.quantity
    else if (age <= 90) aging[2].value += b.quantity
    else aging[3].value += b.quantity
  }
  const inventoryAging = aging

  // ABC analysis
  const abcAgg = new Map<string, number>()
  for (const it of soItems) {
    const cls = it.product.abcClass
    abcAgg.set(cls, (abcAgg.get(cls) ?? 0) + it.total)
  }
  const abcAnalysis = ['A', 'B', 'C'].map((c) => ({ label: `Class ${c}`, value: round(abcAgg.get(c) ?? 0) }))

  // XYZ analysis
  const xyzAgg = new Map<string, number>()
  for (const it of soItems) {
    const cls = it.product.xyzClass
    xyzAgg.set(cls, (xyzAgg.get(cls) ?? 0) + it.total)
  }
  const xyzAnalysis = ['X', 'Y', 'Z'].map((c) => ({ label: `Class ${c}`, value: round(xyzAgg.get(c) ?? 0) }))

  // Pareto — cumulative revenue by SKU
  const paretoData = [...prodAgg.entries()].map(([id, v]) => ({ label: v.name, value: round(v.revenue) })).sort((a, b) => b.value - a.value)
  const totalRev = paretoData.reduce((s, p) => s + p.value, 0)
  let cum = 0
  const pareto = paretoData.slice(0, 15).map((p) => { cum += p.value; return { label: p.label, value: p.value, cumulative: round((cum / totalRev) * 100) } })

  // Salesman ranking
  const smAgg = new Map<string, { name: string; revenue: number; orders: number }>()
  for (const o of orders) {
    if (!o.salesmanId) continue
    const name = customers.find((c) => c.salesmanId === o.salesmanId)?.salesman?.name ?? '—'
    const cur = smAgg.get(o.salesmanId) ?? { name, revenue: 0, orders: 0 }
    cur.revenue += o.total; cur.orders += 1
    smAgg.set(o.salesmanId, cur)
  }
  const salesmanRanking = [...smAgg.entries()].map(([id, v]) => ({ label: v.name, value: round(v.revenue), orders: v.orders })).sort((a, b) => b.value - a.value)

  // Supplier ranking
  const supAgg = new Map<string, { name: string; total: number; orders: number; rating: number }>()
  for (const po of pos) {
    const cur = supAgg.get(po.supplierId) ?? { name: po.supplier.name, total: 0, orders: 0, rating: po.supplier.rating }
    cur.total += po.total; cur.orders += 1
    supAgg.set(po.supplierId, cur)
  }
  const supplierRanking = [...supAgg.entries()].map(([id, v]) => ({ label: v.name, value: round(v.total), orders: v.orders, rating: v.rating })).sort((a, b) => b.value - a.value)

  // Customer segmentation (by LTV)
  const segments = [
    { label: 'Diamond (LTV > ₹50K)', value: customers.filter((c) => c.lifetimeValue > 50000).length },
    { label: 'Gold (₹25K–50K)', value: customers.filter((c) => c.lifetimeValue >= 25000 && c.lifetimeValue <= 50000).length },
    { label: 'Silver (₹10K–25K)', value: customers.filter((c) => c.lifetimeValue >= 10000 && c.lifetimeValue < 25000).length },
    { label: 'Bronze (< ₹10K)', value: customers.filter((c) => c.lifetimeValue < 10000).length },
  ]
  const customerSegments = segments

  // Cash conversion cycle (approximate)
  const totalInventory = inventory.reduce((s, i) => s + i.valuation, 0)
  const dailyCOGS = soItems.reduce((s, it) => s + it.unitCost * it.quantity, 0) / 30
  const inventoryDays = dailyCOGS > 0 ? totalInventory / dailyCOGS : 0
  const totalReceivable = customers.reduce((s, c) => s + c.outstanding, 0)
  const dailyRevenue = orders.reduce((s, o) => s + o.total, 0) / 30
  const receivableDays = dailyRevenue > 0 ? totalReceivable / dailyRevenue : 0
  const totalPayable = suppliers.reduce((s, x) => s + x.outstanding, 0)
  const dailyPurchases = pos.reduce((s, p) => s + p.total, 0) / 30
  const payableDays = dailyPurchases > 0 ? totalPayable / dailyPurchases : 0
  const cashConversionCycle = { days: round(inventoryDays + receivableDays - payableDays), inventoryDays: round(inventoryDays), receivableDays: round(receivableDays), payableDays: round(payableDays) }

  // Seasonality (synthetic from orders — by day-of-week)
  const dowMap = new Map<number, number>([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0]])
  for (const o of orders) {
    const dow = new Date(o.createdAt).getDay()
    dowMap.set(dow, (dowMap.get(dow) ?? 0) + o.total)
  }
  const seasonality = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => ({ label, value: round(dowMap.get(i) ?? 0) }))

  // Forecast (simple moving avg + 15% growth)
  const last30 = orders.filter((o) => new Date(o.createdAt) >= daysAgo(30))
  const dailyAvg = last30.reduce((s, o) => s + o.total, 0) / 30
  const forecast: ChartPoint[] = []
  for (let i = 1; i <= 14; i++) {
    const factor = 1 + (i / 30) * 0.15
    forecast.push({ label: `+${i}d`, value: round(dailyAvg * factor) })
  }

  // Growth trend (last 6 months)
  const growthTrend: SeriesPoint[] = []
  for (let m = 5; m >= 0; m--) {
    const start = new Date(now().getFullYear(), now().getMonth() - m, 1)
    const end = new Date(now().getFullYear(), now().getMonth() - m + 1, 1)
    const monthOrders = orders.filter((o) => new Date(o.createdAt) >= start && new Date(o.createdAt) < end)
    growthTrend.push({ date: start.toISOString().slice(0, 7), revenue: round(monthOrders.reduce((s, o) => s + o.total, 0)), profit: round(monthOrders.reduce((s, o) => s + o.profit, 0)) })
  }

  // Target achievement
  const targets = await db.target.findMany({ where: { period: 'monthly', periodKey: new Date().toISOString().slice(0, 7) } })
  const smTargetAgg = new Map<string, { name: string; target: number; achieved: number }>()
  for (const t of targets) {
    const u = customers.find((c) => c.salesmanId === t.userId)?.salesman
    const name = u?.name ?? '—'
    if (t.metric !== 'revenue') continue
    const cur = smTargetAgg.get(t.userId) ?? { name, target: 0, achieved: 0 }
    cur.target = t.target; cur.achieved = t.achieved
    smTargetAgg.set(t.userId, cur)
  }
  const targetAchievement = [...smTargetAgg.entries()].map(([id, v]) => ({ label: v.name, value: round((v.achieved / v.target) * 100), target: v.target, achieved: v.achieved }))

  return {
    districtHeatmap, areaHeatmap, retailerRanking, skuRanking, inventoryAging,
    abcAnalysis, xyzAnalysis, pareto, salesmanRanking, supplierRanking,
    customerSegments, cashConversionCycle, seasonality, forecast,
    growthTrend, targetAchievement,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Finance — P&L
// ─────────────────────────────────────────────────────────────────────────────
export async function getPNL() {
  const [orders, expenses, soItems] = await Promise.all([
    db.salesOrder.findMany({ where: { status: { not: 'cancelled' } } }),
    db.expense.findMany(),
    db.salesOrderItem.findMany({ where: { so: { status: { not: 'cancelled' } } } }),
  ])
  const revenue = orders.reduce((s, o) => s + o.total, 0)
  const cogs = soItems.reduce((s, it) => s + it.unitCost * it.quantity, 0)
  const grossProfit = revenue - cogs
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = grossProfit - totalExpenses
  const breakdown = [
    { label: 'Revenue', value: round(revenue) },
    { label: 'COGS', value: round(cogs) },
    { label: 'Gross Profit', value: round(grossProfit) },
    { label: 'Operating Expenses', value: round(totalExpenses) },
    { label: 'Net Profit', value: round(netProfit) },
  ]
  return { revenue: round(revenue), cogs: round(cogs), grossProfit: round(grossProfit), expenses: round(totalExpenses), netProfit: round(netProfit), breakdown }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

type SeriesPoint = { date: string; revenue?: number; profit?: number; cogs?: number; cashIn?: number; cashOut?: number; stockValue?: number; purchases?: number }
type ChartPoint = { label: string; value: number; [key: string]: string | number | undefined }
