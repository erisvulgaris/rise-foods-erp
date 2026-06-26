/**
 * Rise Foods ERP Seed Script
 * Generates realistic data based on the BIR (Gorakhpur, 3 launch spices, 25 retailers, real prices).
 *
 * Run with:  bun run scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const db = new PrismaClient()

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 40)
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length]
const rnd = (min: number, max: number) => Math.random() * (max - min) + min
const rndInt = (min: number, max: number) => Math.floor(rnd(min, max + 1))
const round2 = (n: number) => Math.round(n * 100) / 100
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000)
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000)

async function main() {
  console.log('🌱 Seeding Rise Foods ERP...')

  // Clean slate
  await db.$transaction([
    db.setting.deleteMany(),
    db.aIInsight.deleteMany(),
    db.notification.deleteMany(),
    db.productionBatchItem.deleteMany(),
    db.productionBatch.deleteMany(),
    db.journalEntry.deleteMany(),
    db.cashEntry.deleteMany(),
    db.bankAccount.deleteMany(),
    db.expense.deleteMany(),
    db.target.deleteMany(),
    db.task.deleteMany(),
    db.visit.deleteMany(),
    db.route.deleteMany(),
    db.vehicle.deleteMany(),
    db.dispatch.deleteMany(),
    db.payment.deleteMany(),
    db.invoice.deleteMany(),
    db.salesOrderItem.deleteMany(),
    db.salesOrder.deleteMany(),
    db.purchaseOrderItem.deleteMany(),
    db.purchaseOrder.deleteMany(),
    db.quotation.deleteMany(),
    db.stockMovement.deleteMany(),
    db.batch.deleteMany(),
    db.inventory.deleteMany(),
    db.rack.deleteMany(),
    db.warehouse.deleteMany(),
    db.product.deleteMany(),
    db.category.deleteMany(),
    db.timelineEntry.deleteMany(),
    db.customer.deleteMany(),
    db.supplier.deleteMany(),
    db.auditLog.deleteMany(),
    db.role.deleteMany(),
    db.user.deleteMany(),
  ])

  // ───────────────────────────────────────────────────────────────────────────
  // Roles & Permissions
  // ───────────────────────────────────────────────────────────────────────────
  const roles = [
    { name: 'owner', description: 'Complete control', permissions: JSON.stringify({ all: true }) },
    { name: 'admin', description: 'Operations', permissions: JSON.stringify({ all: true }) },
    { name: 'purchase_manager', description: 'Inventory purchasing', permissions: JSON.stringify({ procurement: true, inventory: 'r', products: 'rw', suppliers: 'rw' }) },
    { name: 'warehouse_manager', description: 'Stock', permissions: JSON.stringify({ inventory: true, warehouse: true, products: 'r' }) },
    { name: 'sales_manager', description: 'Sales analytics', permissions: JSON.stringify({ sales: true, crm: true, analytics: true }) },
    { name: 'salesman', description: 'Orders', permissions: JSON.stringify({ sales: 'rw', crm: 'rw', visits: true }) },
    { name: 'accountant', description: 'Finance', permissions: JSON.stringify({ finance: true, reports: true }) },
    { name: 'factory_staff', description: 'Production', permissions: JSON.stringify({ production: true, inventory: 'r' }) },
    { name: 'delivery_staff', description: 'Dispatch', permissions: JSON.stringify({ dispatch: true, sales: 'r' }) },
    { name: 'retailer', description: 'Place orders', permissions: JSON.stringify({ portal: true }) },
    { name: 'distributor', description: 'Bulk ordering', permissions: JSON.stringify({ portal: true, bulk: true }) },
  ]
  for (const r of roles) {
    await db.role.create({ data: { ...r, isSystem: true } })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Users
  // ───────────────────────────────────────────────────────────────────────────
  const owner = await db.user.create({ data: { email: 'owner@risefoods.in', passwordHash: hash('owner123'), name: 'Ankit Yadav', role: 'owner', phone: '+919876543210', employeeId: 'RF-001', isActive: true } })
  const admin = await db.user.create({ data: { email: 'admin@risefoods.in', passwordHash: hash('admin123'), name: 'Operations Admin', role: 'admin', phone: '+919876543211', employeeId: 'RF-002', isActive: true } })
  const purchaseMgr = await db.user.create({ data: { email: 'purchase@risefoods.in', passwordHash: hash('purchase123'), name: 'Vikas Singh', role: 'purchase_manager', phone: '+919876543212', employeeId: 'RF-003', isActive: true } })
  const warehouseMgr = await db.user.create({ data: { email: 'warehouse@risefoods.in', passwordHash: hash('warehouse123'), name: 'Suresh Kumar', role: 'warehouse_manager', phone: '+919876543213', employeeId: 'RF-004', isActive: true } })
  const salesMgr = await db.user.create({ data: { email: 'sales@risefoods.in', passwordHash: hash('sales123'), name: 'Deepak Mishra', role: 'sales_manager', phone: '+919876543214', employeeId: 'RF-005', isActive: true } })
  const salesman1 = await db.user.create({ data: { email: 'ravi@risefoods.in', passwordHash: hash('ravi123'), name: 'Ravi Patel', role: 'salesman', phone: '+919876543215', employeeId: 'RF-006', isActive: true } })
  const salesman2 = await db.user.create({ data: { email: 'amit@risefoods.in', passwordHash: hash('amit123'), name: 'Amit Verma', role: 'salesman', phone: '+919876543216', employeeId: 'RF-007', isActive: true } })
  const salesman3 = await db.user.create({ data: { email: 'sandeep@risefoods.in', passwordHash: hash('sandeep123'), name: 'Sandeep Gupta', role: 'salesman', phone: '+919876543217', employeeId: 'RF-008', isActive: true } })
  const accountant = await db.user.create({ data: { email: 'finance@risefoods.in', passwordHash: hash('finance123'), name: 'Pooja Agarwal', role: 'accountant', phone: '+919876543218', employeeId: 'RF-009', isActive: true } })
  const factoryStaff = await db.user.create({ data: { email: 'factory@risefoods.in', passwordHash: hash('factory123'), name: 'Mohan Lal', role: 'factory_staff', phone: '+919876543219', employeeId: 'RF-010', isActive: true } })
  const deliveryStaff = await db.user.create({ data: { email: 'delivery@risefoods.in', passwordHash: hash('delivery123'), name: 'Kamlesh Yadav', role: 'delivery_staff', phone: '+919876543220', employeeId: 'RF-011', isActive: true } })

  // ───────────────────────────────────────────────────────────────────────────
  // Categories & Products (BIR Tier A: turmeric, red chilli, coriander)
  // ───────────────────────────────────────────────────────────────────────────
  const spicesCat = await db.category.create({ data: { name: 'Spices', slug: 'spices', description: 'Ground and whole spices' } })
  const besanCat = await db.category.create({ data: { name: 'Besan', slug: 'besan', description: 'Gram flour' } })
  const pohaCat = await db.category.create({ data: { name: 'Poha', slug: 'poha', description: 'Flattened rice' } })
  const riceCat = await db.category.create({ data: { name: 'Rice', slug: 'rice', description: 'Rice varieties' } })
  const attaCat = await db.category.create({ data: { name: 'Atta', slug: 'atta', description: 'Wheat flour' } })
  const milletsCat = await db.category.create({ data: { name: 'Millets', slug: 'millets', description: 'Millets and grains' } })

  const products = [
    // Tier A — launch
    { sku: 'RF-TUR-100', name: 'Turmeric Powder 100g', categoryId: spicesCat.id, brand: 'Rise Foods', mrp: 25, wholesalePrice: 18, distributorPrice: 17, retailPrice: 20, costPrice: 12.5, packagingSize: '100g', shelfLifeDays: 365, hsn: '0910', gstRate: 5, reorderLevel: 50, moq: 24, abcClass: 'A', xyzClass: 'X', description: 'Erode turmeric, sun-dried & ground' },
    { sku: 'RF-TUR-200', name: 'Turmeric Powder 200g', categoryId: spicesCat.id, brand: 'Rise Foods', mrp: 45, wholesalePrice: 34, distributorPrice: 32, retailPrice: 38, costPrice: 23, packagingSize: '200g', shelfLifeDays: 365, hsn: '0910', gstRate: 5, reorderLevel: 30, moq: 24, abcClass: 'A', xyzClass: 'Y', description: 'Family pack turmeric powder' },
    { sku: 'RF-TUR-500', name: 'Turmeric Powder 500g', categoryId: spicesCat.id, brand: 'Rise Foods', mrp: 105, wholesalePrice: 82, distributorPrice: 78, retailPrice: 92, costPrice: 56, packagingSize: '500g', shelfLifeDays: 365, hsn: '0910', gstRate: 5, reorderLevel: 15, moq: 12, abcClass: 'B', xyzClass: 'Y', description: 'Bulk family pack turmeric' },
    { sku: 'RF-CHL-100', name: 'Red Chilli Powder 100g', categoryId: spicesCat.id, brand: 'Rise Foods', mrp: 28, wholesalePrice: 21, distributorPrice: 20, retailPrice: 24, costPrice: 15, packagingSize: '100g', shelfLifeDays: 270, hsn: '0904', gstRate: 5, reorderLevel: 50, moq: 24, abcClass: 'A', xyzClass: 'X', description: 'Guntur Sannam red chilli powder' },
    { sku: 'RF-CHL-200', name: 'Red Chilli Powder 200g', categoryId: spicesCat.id, brand: 'Rise Foods', mrp: 52, wholesalePrice: 40, distributorPrice: 38, retailPrice: 45, costPrice: 28, packagingSize: '200g', shelfLifeDays: 270, hsn: '0904', gstRate: 5, reorderLevel: 25, moq: 24, abcClass: 'B', xyzClass: 'Y', description: 'Family pack red chilli powder' },
    { sku: 'RF-COR-100', name: 'Coriander Powder 100g', categoryId: spicesCat.id, brand: 'Rise Foods', mrp: 20, wholesalePrice: 15, distributorPrice: 14, retailPrice: 17, costPrice: 9.5, packagingSize: '100g', shelfLifeDays: 365, hsn: '0910', gstRate: 5, reorderLevel: 50, moq: 24, abcClass: 'A', xyzClass: 'X', description: 'Rajasthan coriander powder' },
    { sku: 'RF-COR-200', name: 'Coriander Powder 200g', categoryId: spicesCat.id, brand: 'Rise Foods', mrp: 38, wholesalePrice: 28, distributorPrice: 26, retailPrice: 32, costPrice: 18, packagingSize: '200g', shelfLifeDays: 365, hsn: '0910', gstRate: 5, reorderLevel: 25, moq: 24, abcClass: 'B', xyzClass: 'Y', description: 'Family pack coriander powder' },
    { sku: 'RF-JEE-100', name: 'Cumin Seeds 100g', categoryId: spicesCat.id, brand: 'Rise Foods', mrp: 72, wholesalePrice: 55, distributorPrice: 52, retailPrice: 62, costPrice: 42, packagingSize: '100g', shelfLifeDays: 540, hsn: '0909', gstRate: 5, reorderLevel: 20, moq: 12, abcClass: 'B', xyzClass: 'Y', description: 'Gujarat cumin seeds' },
    { sku: 'RF-SAR-100', name: 'Mustard Seeds 100g', categoryId: spicesCat.id, brand: 'Rise Foods', mrp: 15, wholesalePrice: 11, distributorPrice: 10, retailPrice: 13, costPrice: 7.5, packagingSize: '100g', shelfLifeDays: 540, hsn: '1207', gstRate: 5, reorderLevel: 30, moq: 24, abcClass: 'C', xyzClass: 'Z', description: 'Rajasthan mustard seeds' },
    { sku: 'RF-SND-200', name: 'Rock Salt 200g', categoryId: spicesCat.id, brand: 'Rise Foods', mrp: 25, wholesalePrice: 14, distributorPrice: 12, retailPrice: 18, costPrice: 6, packagingSize: '200g', shelfLifeDays: 720, hsn: '2501', gstRate: 5, reorderLevel: 25, moq: 24, abcClass: 'C', xyzClass: 'Y', description: 'Himalayan rock salt' },
    // Tier B
    { sku: 'RF-BES-500', name: 'Besan 500g', categoryId: besanCat.id, brand: 'Rise Foods', mrp: 65, wholesalePrice: 48, distributorPrice: 45, retailPrice: 55, costPrice: 38, packagingSize: '500g', shelfLifeDays: 180, hsn: '1106', gstRate: 0, reorderLevel: 20, moq: 12, abcClass: 'B', xyzClass: 'Y', description: 'Premium chana dal besan' },
    { sku: 'RF-POH-500', name: 'Poha 500g', categoryId: pohaCat.id, brand: 'Rise Foods', mrp: 45, wholesalePrice: 32, distributorPrice: 30, retailPrice: 38, costPrice: 22, packagingSize: '500g', shelfLifeDays: 90, hsn: '1006', gstRate: 0, reorderLevel: 20, moq: 12, abcClass: 'C', xyzClass: 'Z', description: 'Thick poha, breakfast grade' },
  ]

  for (const p of products) {
    const marginPercent = round2(((p.retailPrice - p.costPrice) / p.retailPrice) * 100)
    await db.product.create({ data: { ...p, marginPercent, status: 'active' } })
  }
  const allProducts = await db.product.findMany()

  // ───────────────────────────────────────────────────────────────────────────
  // Warehouses & Racks
  // ───────────────────────────────────────────────────────────────────────────
  const mainWH = await db.warehouse.create({ data: { name: 'Gorakhpur Main Warehouse', code: 'WH-GKP-01', address: 'Betiahata Industrial Area, Gorakhpur', district: 'Gorakhpur', manager: 'Suresh Kumar', phone: '+915512345678' } })
  const secondaryWH = await db.warehouse.create({ data: { name: 'Basti Distribution Hub', code: 'WH-BST-01', address: 'Station Road, Basti', district: 'Basti', manager: 'Ramesh Tiwari', phone: '+915522345679' } })
  for (const wh of [mainWH, secondaryWH]) {
    for (const zone of ['A', 'B', 'C']) {
      for (let i = 1; i <= 4; i++) {
        await db.rack.create({ data: { warehouseId: wh.id, code: `${wh.code}-${zone}${i}`, zone, capacity: 500 } })
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Suppliers
  // ───────────────────────────────────────────────────────────────────────────
  const suppliers = [
    { name: 'Golaghat Mandi Traders', contactPerson: 'Imtiaz Khan', phone: '+919415000111', district: 'Gorakhpur', rating: 4.5, leadTimeDays: 2, paymentTerms: 'Cash on delivery', outstanding: 0 },
    { name: 'Erode Turmeric Cooperative', contactPerson: 'Murugan S', phone: '+919415000222', district: 'Erode (TN)', rating: 4.7, leadTimeDays: 6, paymentTerms: '50% advance, 50% on delivery', outstanding: 12500 },
    { name: 'Guntur Chillies Association', contactPerson: 'Reddy Naidu', phone: '+919415000333', district: 'Guntur (AP)', rating: 4.3, leadTimeDays: 7, paymentTerms: '30 days credit', outstanding: 28000 },
    { name: 'Rajasthan Coriander mandi', contactPerson: 'Bhanwar Lal', phone: '+919415000444', district: 'Ramganj Mandi (RJ)', rating: 4.4, leadTimeDays: 5, paymentTerms: '20 days credit', outstanding: 0 },
    { name: 'Betiahata Packaging Co.', contactPerson: 'Sajid Ali', phone: '+919415000555', district: 'Gorakhpur', rating: 4.0, leadTimeDays: 1, paymentTerms: 'Cash', outstanding: 0 },
    { name: 'MP Chana Suppliers', contactPerson: 'Manoj Jain', phone: '+919415000666', district: 'Indore (MP)', rating: 4.2, leadTimeDays: 4, paymentTerms: '15 days credit', outstanding: 8500 },
  ]
  const supplierRecs = []
  for (const s of suppliers) {
    supplierRecs.push(await db.supplier.create({ data: { ...s, address: s.district, gst: `09${rndInt(100000000000, 999999999999)}Z9`, email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@supplier.in`, totalPurchased: rnd(50000, 250000), onTimeRate: rnd(70, 95), qualityRate: rnd(75, 95), status: 'active', notes: '' } }))
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Customers (25 retailers across 4 zones + distributors + leads)
  // ───────────────────────────────────────────────────────────────────────────
  const zones = [
    { district: 'Gorakhpur', area: 'Civil Lines', count: 8 },
    { district: 'Gorakhpur', area: 'City Centre', count: 8 },
    { district: 'Gorakhpur', area: 'Rapti Nagar', count: 5 },
    { district: 'Gorakhpur', area: 'Railway Road', count: 4 },
  ]
  const salesmen = [salesman1, salesman2, salesman3]
  const retailerNames = [
    'Sharma Kirana Store', 'Gupta Provisional', 'Verma General Store', 'Singh Mini Mart',
    'Yadav Grocery', 'Patel Stores', 'Khan Provisional', 'Mishra Kirana',
    'Agarwal Bazaar', 'Tiwari Stores', 'Lal General Store', 'Devi Kirana',
    'Kumari Bhandar', 'Pandey Stores', 'Shukla Provisional', 'Jaiswal Mart',
    'Verma Enterprises', 'Rao General Store', 'Naidu Stores', 'Reddy Bazaar',
    'Sinha Mart', 'Chaubey Stores', 'Banerjee General', 'Das Provisional',
    'Rai Kirana', 'Maurya Stores', 'Pal Bazaar', 'Jha General Store',
  ]
  let nameIdx = 0
  const customers = []
  for (const z of zones) {
    for (let i = 0; i < z.count; i++) {
      const salesman = pick(salesmen, nameIdx)
      const name = retailerNames[nameIdx % retailerNames.length]
      nameIdx++
      const status = i < 2 ? 'lead' : (i % 7 === 0 ? 'inactive' : 'active')
      const creditLimit = rndInt(5000, 25000)
      const outstanding = status === 'active' ? round2(rnd(0, creditLimit * 0.7)) : 0
      const lifetimeValue = round2(rnd(8000, 65000))
      const profitGenerated = round2(lifetimeValue * rnd(0.08, 0.18))
      const c = await db.customer.create({
        data: {
          businessName: name,
          ownerName: name.split(' ')[0] + ' ' + ['Rajesh', 'Sunil', 'Anil', 'Vijay', 'Ramesh', 'Dinesh'][rndInt(0, 5)],
          phone: `+9198${rndInt(10000000, 99999999)}`,
          alternatePhone: Math.random() > 0.5 ? `+9197${rndInt(10000000, 99999999)}` : null,
          email: `${name.split(' ')[0].toLowerCase()}${i}@kirana.in`,
          gst: Math.random() > 0.7 ? `09${rndInt(100000000000, 999999999999)}Z${rndInt(0, 9)}` : null,
          fssai: Math.random() > 0.5 ? `${rndInt(10000000000000, 99999999999999)}` : null,
          address: `${rndInt(1, 99)}, ${z.area}, ${z.district}`,
          district: z.district,
          area: z.area,
          pin: '273001',
          geoLat: 26.7606 + rnd(-0.05, 0.05),
          geoLng: 83.3732 + rnd(-0.05, 0.05),
          type: 'retailer',
          salesmanId: salesman.id,
          creditLimit,
          creditDays: status === 'lead' ? 0 : pick([0, 7, 15, 30], i),
          outstanding,
          status,
          riskScore: round2(outstanding > creditLimit * 0.6 ? rnd(65, 90) : rnd(15, 45)),
          retentionScore: status === 'active' ? round2(rnd(60, 95)) : round2(rnd(20, 50)),
          orderFrequency: status === 'active' ? round2(rnd(2, 8), 1) : 0,
          avgOrderValue: round2(rnd(1200, 4500)),
          lifetimeValue,
          profitGenerated,
          lastOrderAt: status === 'lead' ? null : daysAgo(rndInt(1, 30)),
          lastPaymentAt: status === 'lead' ? null : daysAgo(rndInt(5, 45)),
          notes: 'Prompt payer. Prefers turmeric and chilli. Repeat buyer.',
        },
      })
      customers.push(c)
    }
  }
  // Distributors
  const dist1 = await db.customer.create({ data: { businessName: 'Deoria Distributors', ownerName: 'Harish Chandra', phone: '+919876544001', district: 'Deoria', area: 'Deoria City', address: 'Station Road, Deoria', type: 'distributor', salesmanId: salesman1.id, creditLimit: 80000, creditDays: 30, outstanding: 24500, status: 'active', riskScore: 35, retentionScore: 88, orderFrequency: 4, avgOrderValue: 18000, lifetimeValue: 215000, profitGenerated: 28500, lastOrderAt: daysAgo(4), lastPaymentAt: daysAgo(12) } })
  const dist2 = await db.customer.create({ data: { businessName: 'Basti Wholesale Co.', ownerName: 'Ganga Prasad', phone: '+919876544002', district: 'Basti', area: 'Basti City', address: 'Main Market, Basti', type: 'distributor', salesmanId: salesman2.id, creditLimit: 60000, creditDays: 21, outstanding: 8200, status: 'active', riskScore: 22, retentionScore: 91, orderFrequency: 5, avgOrderValue: 14500, lifetimeValue: 178000, profitGenerated: 22000, lastOrderAt: daysAgo(2), lastPaymentAt: daysAgo(8) } })

  // Leads
  for (let i = 0; i < 5; i++) {
    await db.customer.create({
      data: {
        businessName: `New Lead Store ${i + 1}`,
        ownerName: 'TBD',
        phone: `+9199${rndInt(10000000, 99999999)}`,
        district: pick(['Gorakhpur', 'Deoria', 'Kushinagar'], i),
        area: pick(['Taramandal', 'Mohaddipur', 'Jatepur', 'Rustampur'], i),
        address: `${rndInt(1, 99)}, Market Road`,
        type: 'lead',
        salesmanId: pick(salesmen, i).id,
        creditLimit: 0,
        creditDays: 0,
        outstanding: 0,
        status: 'lead',
        riskScore: 50,
        notes: 'Lead from field visit. Awaiting first order.',
      },
    })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Inventory & Batches (FIFO)
  // ───────────────────────────────────────────────────────────────────────────
  for (const p of allProducts) {
    const stock = rndInt(20, 350)
    const valuation = round2(stock * p.costPrice)
    await db.inventory.create({
      data: { productId: p.id, warehouseId: mainWH.id, currentStock: stock, reservedStock: rndInt(0, 15), incomingStock: rndInt(0, 50), reorderLevel: p.reorderLevel, reorderQty: p.reorderLevel * 3, valuation, lastStockAt: daysAgo(rndInt(0, 5)) },
    })
    // 1-3 batches per product
    const batchCount = rndInt(1, 3)
    for (let b = 0; b < batchCount; b++) {
      const qty = rndInt(20, 150)
      const mfgDate = daysAgo(rndInt(20, 90))
      const expiryDate = new Date(mfgDate.getTime() + p.shelfLifeDays * 86400000)
      await db.batch.create({
        data: {
          batchNo: `B${p.sku.replace(/-/g, '')}-${b}${rndInt(100, 999)}`,
          productId: p.id,
          warehouseId: mainWH.id,
          quantity: qty,
          reservedQty: rndInt(0, Math.floor(qty / 4)),
          costPrice: p.costPrice,
          mfgDate,
          expiryDate,
          receivedAt: mfgDate,
          status: qty > 5 ? 'in_stock' : 'partial',
          supplierId: pick(supplierRecs, b).id,
        },
      })
    }
    // Some batches at secondary WH
    if (Math.random() > 0.6) {
      await db.inventory.create({ data: { productId: p.id, warehouseId: secondaryWH.id, currentStock: rndInt(5, 80), reservedStock: 0, incomingStock: 0, reorderLevel: p.reorderLevel, reorderQty: p.reorderLevel * 2, valuation: round2(rndInt(5, 80) * p.costPrice), lastStockAt: daysAgo(rndInt(0, 5)) } })
    }
  }

  // Add some expired/expiring batches for alerts
  const turmeric = allProducts.find((p) => p.sku === 'RF-TUR-100')!
  await db.batch.create({ data: { batchNo: 'B-EXPIRE-001', productId: turmeric.id, warehouseId: mainWH.id, quantity: 25, reservedQty: 0, costPrice: 12.5, mfgDate: daysAgo(400), expiryDate: daysAgo(10), receivedAt: daysAgo(390), status: 'expired', supplierId: supplierRecs[1].id } })
  const chilli = allProducts.find((p) => p.sku === 'RF-CHL-100')!
  await db.batch.create({ data: { batchNo: 'B-EXPIRE-002', productId: chilli.id, warehouseId: mainWH.id, quantity: 18, reservedQty: 0, costPrice: 15, mfgDate: daysAgo(250), expiryDate: daysFromNow(15), receivedAt: daysAgo(245), status: 'in_stock', supplierId: supplierRecs[2].id } })

  // ───────────────────────────────────────────────────────────────────────────
  // Purchase Orders (last 60 days)
  // ───────────────────────────────────────────────────────────────────────────
  let poCounter = 1
  for (let i = 0; i < 12; i++) {
    const supplier = pick(supplierRecs, i)
    const itemCount = rndInt(1, 4)
    const items = []
    let subtotal = 0
    for (let j = 0; j < itemCount; j++) {
      const p = pick(allProducts, i + j)
      const qty = rndInt(20, 100)
      const unitCost = p.costPrice
      const total = round2(qty * unitCost)
      subtotal += total
      items.push({ productId: p.id, quantity: qty, receivedQty: qty, unitCost, taxPercent: p.gstRate, total })
    }
    const tax = round2(subtotal * 0.05)
    const total = round2(subtotal + tax)
    const status = i < 8 ? 'received' : i < 10 ? 'sent' : 'partial'
    const created = daysAgo(rndInt(1, 60))
    const po = await db.purchaseOrder.create({
      data: {
        poNo: `PO-2026-${String(poCounter++).padStart(4, '0')}`,
        supplierId: supplier.id,
        warehouseId: mainWH.id,
        status,
        subtotal,
        tax,
        total,
        paid: status === 'received' ? total : round2(total * 0.5),
        expectedAt: new Date(created.getTime() + supplier.leadTimeDays * 86400000),
        receivedAt: status === 'received' ? new Date(created.getTime() + supplier.leadTimeDays * 86400000) : null,
        notes: 'Standard procurement order',
        createdBy: purchaseMgr.id,
        createdAt: created,
        items: { create: items },
      },
    })
    // Stock movement for received POs
    if (status === 'received' || status === 'partial') {
      for (const it of items) {
        await db.stockMovement.create({ data: { productId: it.productId, warehouseId: mainWH.id, type: 'stock_in', quantity: it.receivedQty, refType: 'purchase', refId: po.id, note: `PO ${po.poNo}`, createdBy: purchaseMgr.id, createdAt: po.receivedAt ?? created } })
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Sales Orders (last 60 days) — dense for analytics
  // ───────────────────────────────────────────────────────────────────────────
  let soCounter = 1
  let invCounter = 1
  let payCounter = 1
  const activeCustomers = customers.filter((c) => c.status !== 'lead')
  for (let i = 0; i < 80; i++) {
    const cust = pick([...activeCustomers, dist1, dist2], i)
    const salesman = salesmen.find((s) => s.id === cust.salesmanId) ?? salesman1
    const itemCount = rndInt(1, 5)
    const items = []
    let subtotal = 0
    let profit = 0
    for (let j = 0; j < itemCount; j++) {
      const p = pick(allProducts, i + j)
      const qty = rndInt(2, 30)
      const unitPrice = cust.type === 'distributor' ? p.distributorPrice : p.wholesalePrice
      const total = round2(qty * unitPrice)
      subtotal += total
      const lineProfit = round2((unitPrice - p.costPrice) * qty)
      profit += lineProfit
      items.push({ productId: p.id, quantity: qty, unitPrice, unitCost: p.costPrice, taxPercent: p.gstRate, discount: 0, total, profit: lineProfit })
    }
    const tax = round2(subtotal * 0.05)
    const total = round2(subtotal + tax)
    const createdDaysAgo = rndInt(0, 60)
    const created = daysAgo(createdDaysAgo)
    const statusRoll = Math.random()
    let status = 'pending'
    let packedAt: Date | null = null, dispatchedAt: Date | null = null, deliveredAt: Date | null = null, cancelledAt: Date | null = null
    if (statusRoll > 0.95) {
      status = 'cancelled'; cancelledAt = new Date(created.getTime() + 3600 * 1000)
    } else if (statusRoll > 0.85) {
      status = 'pending'
    } else if (statusRoll > 0.65) {
      status = 'packed'; packedAt = new Date(created.getTime() + 4 * 3600 * 1000)
    } else if (statusRoll > 0.35) {
      status = 'dispatched'; packedAt = new Date(created.getTime() + 4 * 3600 * 1000); dispatchedAt = new Date(created.getTime() + 12 * 3600 * 1000)
    } else {
      status = 'delivered'; packedAt = new Date(created.getTime() + 4 * 3600 * 1000); dispatchedAt = new Date(created.getTime() + 12 * 3600 * 1000); deliveredAt = new Date(created.getTime() + 36 * 3600 * 1000)
    }
    const paymentStatus = status === 'delivered' ? (Math.random() > 0.25 ? 'paid' : 'partial') : status === 'dispatched' ? 'partial' : 'unpaid'
    const paid = paymentStatus === 'paid' ? total : paymentStatus === 'partial' ? round2(total * 0.5) : 0

    const so = await db.salesOrder.create({
      data: {
        orderNo: `SO-2026-${String(soCounter++).padStart(4, '0')}`,
        customerId: cust.id,
        salesmanId: salesman.id,
        status,
        paymentStatus,
        subtotal,
        tax,
        discount: 0,
        total,
        paid,
        profit: status === 'cancelled' ? 0 : profit,
        itemsCount: itemCount,
        channel: pick(['direct', 'portal', 'whatsapp', 'phone'], i),
        notes: '',
        createdBy: salesman.id,
        packedAt, dispatchedAt, deliveredAt, cancelledAt,
        deliveryAddress: cust.address,
        createdAt: created,
        items: { create: items },
      },
    })
    // Invoice
    const inv = await db.invoice.create({
      data: {
        invoiceNo: `INV-2026-${String(invCounter++).padStart(4, '0')}`,
        orderId: so.id,
        customerId: cust.id,
        type: 'sales',
        subtotal, tax, total, paid, balance: round2(total - paid),
        status: paymentStatus === 'paid' ? 'paid' : paymentStatus === 'partial' ? 'partial' : createdDaysAgo > 30 ? 'overdue' : 'unpaid',
        dueDate: new Date(created.getTime() + (cust.creditDays || 15) * 86400000),
        createdAt: created,
      },
    })
    // Payment(s)
    if (paid > 0) {
      await db.payment.create({
        data: {
          paymentNo: `PAY-2026-${String(payCounter++).padStart(4, '0')}`,
          orderId: so.id,
          invoiceId: inv.id,
          customerId: cust.id,
          amount: paid,
          method: pick(['cash', 'upi', 'bank', 'cheque'], i),
          reference: pick(['UPI-987654', 'CASH-001', 'NEFT-12345', 'CHQ-445566'], i),
          status: 'completed',
          collectedBy: salesman.id,
          createdAt: new Date(created.getTime() + (status === 'delivered' ? 36 : 12) * 3600 * 1000),
        },
      })
    }
    // Dispatch
    if (status === 'dispatched' || status === 'delivered') {
      await db.dispatch.create({
        data: {
          dispatchNo: `DSP-2026-${String(soCounter - 1).padStart(4, '0')}`,
          orderId: so.id,
          driverName: 'Kamlesh Yadav',
          driverPhone: '+919876543220',
          status: status === 'delivered' ? 'delivered' : 'in_transit',
          loadedAt: packedAt,
          deliveredAt,
          createdAt: dispatchedAt!,
        },
      })
    }
    // Stock movements for shipped items
    if (status !== 'pending' && status !== 'cancelled') {
      for (const it of items) {
        await db.stockMovement.create({ data: { productId: it.productId, warehouseId: mainWH.id, type: 'stock_out', quantity: it.quantity, refType: 'sales', refId: so.id, note: `SO ${so.orderNo}`, createdBy: salesman.id, createdAt: packedAt ?? created } })
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Expenses
  // ───────────────────────────────────────────────────────────────────────────
  const expenseCats = [
    { category: 'rent', sub: 'warehouse', amount: 8000, vendor: 'Betiahata Estate' },
    { category: 'salary', sub: 'staff', amount: 45000, vendor: 'Payroll' },
    { category: 'utility', sub: 'electricity', amount: 3200, vendor: 'UPPCL' },
    { category: 'transport', sub: 'fuel', amount: 4500, vendor: 'HP Petrol' },
    { category: 'packaging', sub: 'pouches', amount: 2800, vendor: 'Betiahata Packaging' },
    { category: 'marketing', sub: 'flyers', amount: 1500, vendor: 'City Press' },
    { category: 'misc', sub: 'tea/snacks', amount: 800, vendor: 'Local' },
  ]
  for (let i = 0; i < 30; i++) {
    const e = pick(expenseCats, i)
    await db.expense.create({ data: { category: e.category, subcategory: e.sub, amount: e.amount * rnd(0.7, 1.3), date: daysAgo(rndInt(0, 60)), vendor: e.vendor, paymentMode: pick(['cash', 'upi', 'bank'], i), status: 'paid', note: `Routine ${e.category}`, createdBy: accountant.id, createdAt: daysAgo(rndInt(0, 60)) } })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Bank accounts
  // ───────────────────────────────────────────────────────────────────────────
  await db.bankAccount.create({ data: { name: 'SBI Current Account', bank: 'State Bank of India', accountNo: '38294756281', ifsc: 'SBIN0000456', branch: 'Gorakhpur Main', balance: 184500, type: 'current' } })
  await db.bankAccount.create({ data: { name: 'Cash Drawer', bank: 'Cash', accountNo: 'CASH-001', balance: 32500, type: 'cash' } })
  await db.bankAccount.create({ data: { name: 'UPI Business', bank: 'PhonePe', accountNo: 'risefoods@upi', balance: 12500, type: 'upi' } })

  // Cash entries (30 days)
  for (let i = 0; i < 40; i++) {
    const isReceipt = Math.random() > 0.4
    await db.cashEntry.create({ data: { type: isReceipt ? 'receipt' : 'payment', amount: round2(rnd(500, 8000)), category: isReceipt ? 'sales_collection' : pick(['expense', 'supplier_payment', 'salary'], i), description: isReceipt ? 'Customer collection' : 'Routine payment', createdBy: accountant.id, date: daysAgo(rndInt(0, 30)), createdAt: daysAgo(rndInt(0, 30)) } })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Production batches
  // ───────────────────────────────────────────────────────────────────────────
  for (let i = 0; i < 6; i++) {
    const p = pick(allProducts.filter((x) => x.sku.startsWith('RF-TUR') || x.sku.startsWith('RF-CHL') || x.sku.startsWith('RF-COR')), i)
    if (!p) continue
    const inputQty = rndInt(20, 100)
    const outputQty = Math.floor(inputQty * rnd(0.88, 0.95))
    const lossPercent = round2((1 - outputQty / inputQty) * 100)
    const yieldPercent = round2(100 - lossPercent)
    const startDate = daysAgo(rndInt(1, 30))
    const endDate = new Date(startDate.getTime() + rnd(2, 8) * 3600 * 1000)
    await db.productionBatch.create({
      data: {
        batchNo: `PB-${p.sku}-${i}${rndInt(100, 999)}`,
        productId: p.id,
        startDate,
        endDate,
        stage: pick(['finished', 'packing', 'finished', 'finished', 'qc'], i),
        inputQty, outputQty, yieldPercent, lossPercent,
        machineName: pick(['Grinder-G1', 'Grinder-G2', 'Pulverizer-P1'], i),
        operatorId: factoryStaff.id,
        cost: round2(inputQty * p.costPrice * 0.1),
        downtime: rndInt(0, 90),
        notes: 'Routine batch',
        items: { create: [{ productId: p.id, type: 'finished_good', quantity: outputQty, unit: 'packs' }] },
      },
    })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Visits & Tasks
  // ───────────────────────────────────────────────────────────────────────────
  for (let i = 0; i < 30; i++) {
    const cust = pick(customers, i)
    const salesman = salesmen.find((s) => s.id === cust.salesmanId) ?? salesman1
    await db.visit.create({
      data: {
        customerId: cust.id,
        salesmanId: salesman.id,
        type: pick(['sales', 'collection', 'service', 'new_lead'], i),
        status: pick(['completed', 'completed', 'planned', 'missed'], i),
        notes: pick(['Took fresh order', 'Collected ₹2,500', 'Discussed new SKUs', 'Shop closed — reschedule'], i),
        orderValue: Math.random() > 0.5 ? round2(rnd(500, 5000)) : null,
        collected: Math.random() > 0.6 ? round2(rnd(500, 3000)) : null,
        scheduledAt: daysAgo(rndInt(0, 14)),
        completedAt: Math.random() > 0.2 ? daysAgo(rndInt(0, 14)) : null,
        geoLat: cust.geoLat, geoLng: cust.geoLng,
      },
    })
  }
  for (let i = 0; i < 15; i++) {
    const cust = pick(customers, i)
    await db.task.create({ data: { title: pick(['Follow up on outstanding', 'Collect payment', 'New product demo', 'Resolve complaint', 'Schedule visit'], i), assigneeId: pick(salesmen, i).id, customerId: cust.id, type: pick(['followup', 'collection', 'order', 'service'], i), priority: pick(['low', 'medium', 'high', 'urgent'], i), status: pick(['open', 'in_progress', 'done'], i), dueDate: daysFromNow(rndInt(-2, 7)) } })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Timeline entries
  // ───────────────────────────────────────────────────────────────────────────
  for (const cust of customers.slice(0, 15)) {
    for (let i = 0; i < 4; i++) {
      await db.timelineEntry.create({
        data: {
          customerId: cust.id,
          type: pick(['note', 'call', 'visit', 'whatsapp', 'order', 'payment'], i),
          title: pick(['Sales visit logged', 'Phone follow-up', 'WhatsApp catalog sent', 'Order placed', 'Payment received', 'Note added'], i),
          body: pick(['Customer requested bulk discount on turmeric.', 'Confirmed next delivery for Tuesday.', 'Sent Diwali offers via WhatsApp.', 'Order for 30 packs of turmeric + 20 chilli.', 'Received ₹3,500 via UPI.', 'Customer wants 200g pack added.'], i),
          createdBy: cust.salesmanId,
          createdAt: daysAgo(rndInt(1, 30)),
        },
      })
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Targets
  // ───────────────────────────────────────────────────────────────────────────
  const thisMonth = new Date().toISOString().slice(0, 7)
  for (const s of salesmen) {
    await db.target.create({ data: { userId: s.id, period: 'monthly', periodKey: thisMonth, metric: 'revenue', target: 80000, achieved: round2(rnd(35000, 95000)) } })
    await db.target.create({ data: { userId: s.id, period: 'monthly', periodKey: thisMonth, metric: 'orders', target: 60, achieved: rndInt(22, 68) } })
    await db.target.create({ data: { userId: s.id, period: 'monthly', periodKey: thisMonth, metric: 'collection', target: 70000, achieved: round2(rnd(30000, 82000)) } })
    await db.target.create({ data: { userId: s.id, period: 'monthly', periodKey: thisMonth, metric: 'new_customers', target: 8, achieved: rndInt(2, 10) } })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // AI Insights
  // ───────────────────────────────────────────────────────────────────────────
  const insights = [
    { type: 'trend', category: 'sales', title: 'Sales dropped 18% this week', body: 'Weekly sales fell from ₹32,500 to ₹26,700. Primary driver: lower turmeric movement in Civil Lines zone.', severity: 'warning', metric: 'revenue', metricValue: 26700, deltaPercent: -18, recommendation: 'Schedule sales visits to top 5 turmeric retailers in Civil Lines. Run a 5% volume discount for 200g pack.' },
    { type: 'recommendation', category: 'procurement', title: 'Recommend purchasing coriander next week', body: 'Current coriander inventory lasts only 12 days at avg daily sales. Post-rabi Rajasthan crop is arriving — prices expected 8–10% lower.', severity: 'info', metric: 'inventory_days', metricValue: 12, deltaPercent: -25, recommendation: 'Place PO for 80kg coriander (2-week cover) within next 7 days.' },
    { type: 'risk', category: 'customer', title: 'Top customer inactive 28 days', body: 'Sharma Kirana Store (LTV ₹62,000) has not ordered in 28 days. Risk of churn elevated.', severity: 'critical', metric: 'days_inactive', metricValue: 28, recommendation: 'Salesman Ravi to visit within 48 hrs. Offer ₹500 credit note as goodwill.' },
    { type: 'anomaly', category: 'finance', title: 'Cash flow risk detected', body: 'Outstanding receivables ₹1.84L vs available cash ₹1.85L. 3 large invoices overdue > 30 days.', severity: 'critical', metric: 'cash_flow_gap', metricValue: -100, recommendation: 'Prioritize collection from Deoria Distributors (₹24.5K) and Basti Wholesale (₹8.2K) this week.' },
    { type: 'trend', category: 'inventory', title: 'Inventory turnover improving', body: 'Inventory turnover ratio improved from 4.2 to 5.1 over last 30 days. Slow-moving chilli stock reduced 35%.', severity: 'success', metric: 'turnover_ratio', metricValue: 5.1, deltaPercent: 21.4, recommendation: 'Maintain current reorder cadence. Consider increasing turmeric PO by 15% for festive season.' },
    { type: 'recommendation', category: 'procurement', title: 'Suggest reducing chilli procurement', body: 'Chilli batch B-RFCHL100-2240 expires in 15 days. 18 units still in stock. Demand softening.', severity: 'warning', metric: 'expiry_risk', metricValue: 15, recommendation: 'Hold next chilli PO. Run a clearance promo on expiring batch at 10% discount.' },
    { type: 'forecast', category: 'sales', title: 'Diwali demand forecast: +42%', body: 'Based on last year seasonality and current growth, expect 42% sales spike Oct–Nov. Turmeric and chilli will lead.', severity: 'info', metric: 'forecast_uplift', metricValue: 42, recommendation: 'Build 60-day inventory of turmeric by Sep 15. Negotiate bulk pricing with Erode supplier.' },
  ]
  for (const ins of insights) {
    await db.aIInsight.create({ data: { ...ins, generatedBy: admin.id } })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Notifications
  // ───────────────────────────────────────────────────────────────────────────
  const notifs = [
    { type: 'low_stock', title: 'Low stock alert: Cumin Seeds 100g', body: 'Stock at 8 units (reorder level 20). Suggested PO: 60 units.', severity: 'warning', userId: purchaseMgr.id },
    { type: 'inventory_expiry', title: 'Batch expiring in 15 days', body: 'Batch B-EXPIRE-002 (Red Chilli 100g) — 18 units expire on 2026-07-11.', severity: 'warning', userId: warehouseMgr.id },
    { type: 'pending_payment', title: '3 invoices overdue', body: 'Total ₹42,500 across 3 customers overdue > 30 days.', severity: 'critical', userId: accountant.id },
    { type: 'new_order', title: 'New order from Deoria Distributors', body: 'SO-2026-0078 — ₹18,450. Awaiting confirmation.', severity: 'info', userId: salesMgr.id },
    { type: 'dispatch', title: 'Dispatch loaded', body: 'DSP-2026-0042 loaded on tempo UP32-AB-1234. ETA Basti 4:30 PM.', severity: 'success', userId: deliveryStaff.id },
    { type: 'customer_inactive', title: '5 customers inactive > 21 days', body: 'Civil Lines zone has 2 high-value inactive accounts.', severity: 'warning', userId: salesMgr.id },
    { type: 'supplier_delay', title: 'Guntur Chillies PO delayed', body: 'PO-2026-0007 expected 5 days ago. Follow up required.', severity: 'warning', userId: purchaseMgr.id },
    { type: 'daily_summary', title: 'Daily Sales Summary', body: "Today's sales: ₹14,250. 7 orders. Top SKU: Turmeric 100g.", severity: 'info', userId: owner.id },
  ]
  for (const n of notifs) {
    await db.notification.create({ data: { ...n, isRead: Math.random() > 0.5, createdAt: daysAgo(rndInt(0, 3)) } })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Vehicles, Routes
  // ───────────────────────────────────────────────────────────────────────────
  await db.vehicle.create({ data: { number: 'UP32-AB-1234', type: 'tempo', capacity: 500, driverName: 'Kamlesh Yadav', driverPhone: '+919876543220', status: 'on_route' } })
  await db.vehicle.create({ data: { number: 'UP32-CD-5678', type: 'bike', capacity: 50, driverName: 'Ravi Patel', driverPhone: '+919876543215', status: 'available' } })
  await db.vehicle.create({ data: { number: 'UP32-EF-9012', type: 'truck', capacity: 1500, driverName: 'Mohan Singh', driverPhone: '+919876543299', status: 'available' } })
  await db.route.create({ data: { name: 'Civil Lines Beat', code: 'R-CL-01', salesmanId: salesman1.id, districts: '["Gorakhpur"]', stops: 8 } })
  await db.route.create({ data: { name: 'City Centre Beat', code: 'R-CC-01', salesmanId: salesman2.id, districts: '["Gorakhpur"]', stops: 8 } })
  await db.route.create({ data: { name: 'Rapti Nagar Beat', code: 'R-RN-01', salesmanId: salesman3.id, districts: '["Gorakhpur"]', stops: 5 } })

  // ───────────────────────────────────────────────────────────────────────────
  // Settings
  // ───────────────────────────────────────────────────────────────────────────
  await db.setting.create({ data: { key: 'company_name', value: 'Rise Foods', category: 'general' } })
  await db.setting.create({ data: { key: 'company_gst', value: '09ABCDE1234F1Z5', category: 'general' } })
  await db.setting.create({ data: { key: 'company_fssai', value: '12345678901234', category: 'general' } })
  await db.setting.create({ data: { key: 'company_address', value: 'Betiahata Industrial Area, Gorakhpur, UP 273001', category: 'general' } })
  await db.setting.create({ data: { key: 'currency', value: 'INR', category: 'finance' } })
  await db.setting.create({ data: { key: 'default_credit_limit', value: '15000', category: 'finance' } })
  await db.setting.create({ data: { key: 'auto_reorder_enabled', value: 'true', category: 'inventory' } })
  await db.setting.create({ data: { key: 'fifo_enabled', value: 'true', category: 'inventory' } })
  await db.setting.create({ data: { key: 'expiry_alert_days', value: '30', category: 'inventory' } })

  // Audit log entry
  await db.auditLog.create({ data: { userId: owner.id, action: 'system', entity: 'system', entityId: 'seed', oldValue: null, newValue: '{"event":"seed_completed"}', ip: '127.0.0.1', device: 'server' } })

  console.log('✅ Seed complete!')
  console.log(`   Users: ${await db.user.count()}`)
  console.log(`   Products: ${await db.product.count()}`)
  console.log(`   Customers: ${await db.customer.count()}`)
  console.log(`   Sales Orders: ${await db.salesOrder.count()}`)
  console.log(`   Purchase Orders: ${await db.purchaseOrder.count()}`)
  console.log(`   Invoices: ${await db.invoice.count()}`)
  console.log(`   Payments: ${await db.payment.count()}`)
  console.log(`   Inventory: ${await db.inventory.count()}`)
  console.log(`   Batches: ${await db.batch.count()}`)
  console.log(`   Insights: ${await db.aIInsight.count()}`)
  console.log(`   Notifications: ${await db.notification.count()}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
