'use client'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/page-header'
import { DataTable, type Column } from '@/shared/components/data-table'
import { KPICard } from '@/shared/components/kpi-card'
import { Badge, StatusBadge } from '@/shared/components/status-badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, TrendingUp, DollarSign, Boxes, Plus, Download, Layers } from 'lucide-react'
import { fmtINR, fmtNumber, exportCSV, abcColor } from '@/shared/lib/format'
import { useProducts } from '@/shared/services/mutations'
import type { Product } from '@/shared/types'

export function ProductsModule() {
  const { data: products = [], isLoading: loading } = useProducts()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [cat, setCat] = useState<string>('all')

  const cats = Array.from(new Set(products.map((p) => p.category?.name ?? 'Uncategorized')))
  const filtered = cat === 'all' ? products : products.filter((p) => (p.category?.name ?? 'Uncategorized') === cat)

  const totalSKUs = products.length
  const totalValue = products.reduce((s, p) => s + p.costPrice, 0)
  const avgMargin = products.length ? products.reduce((s, p) => s + p.marginPercent, 0) / products.length : 0
  const classA = products.filter((p) => p.abcClass === 'A').length

  const columns: Column<Product>[] = [
    {
      key: 'name', header: 'Product', sortable: true,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 text-orange-600 dark:text-orange-400">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category', header: 'Category', sortable: true, sortAccessor: (p) => p.category?.name ?? '',
      cell: (p) => <Badge variant="outline">{p.category?.name ?? '—'}</Badge>,
    },
    {
      key: 'packagingSize', header: 'Size', align: 'center',
      cell: (p) => <span className="text-sm">{p.packagingSize ?? '—'}</span>,
    },
    {
      key: 'costPrice', header: 'Cost', align: 'right', sortable: true, sortAccessor: (p) => p.costPrice,
      cell: (p) => <span className="tabular-nums text-sm text-muted-foreground">{fmtINR(p.costPrice)}</span>,
    },
    {
      key: 'wholesalePrice', header: 'Wholesale', align: 'right', sortable: true, sortAccessor: (p) => p.wholesalePrice,
      cell: (p) => <span className="tabular-nums text-sm font-medium">{fmtINR(p.wholesalePrice)}</span>,
    },
    {
      key: 'mrp', header: 'MRP', align: 'right', sortable: true, sortAccessor: (p) => p.mrp,
      cell: (p) => <span className="tabular-nums text-sm">{fmtINR(p.mrp)}</span>,
    },
    {
      key: 'marginPercent', header: 'Margin', align: 'right', sortable: true, sortAccessor: (p) => p.marginPercent,
      cell: (p) => <span className="tabular-nums text-sm font-semibold text-emerald-600 dark:text-emerald-400">{p.marginPercent.toFixed(1)}%</span>,
    },
    {
      key: 'abcClass', header: 'ABC', align: 'center', sortable: true,
      cell: (p) => <span className={abcColor(p.abcClass)}>{p.abcClass} · {p.xyzClass}</span>,
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (p) => <StatusBadge status={p.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog"
        description={`${totalSKUs} SKUs across ${cats.length} categories`}
        icon={Package}
        accent="warning"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV('products.csv', products as any)}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm"><Plus className="h-4 w-4" /> Add Product</Button>
            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              <button onClick={() => setView('grid')} className={`px-2 py-1 text-xs rounded-md ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Grid</button>
              <button onClick={() => setView('table')} className={`px-2 py-1 text-xs rounded-md ${view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Table</button>
            </div>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total SKUs" value={fmtNumber(totalSKUs)} icon={Boxes} accent="primary" sublabel={`${classA} Class A products`} />
        <KPICard label="Avg Margin" value={`${avgMargin.toFixed(1)}%`} icon={TrendingUp} accent="success" sublabel="Across all SKUs" />
        <KPICard label="Categories" value={fmtNumber(cats.length)} icon={Layers} accent="info" sublabel="Spices, Besan, Poha..." />
        <KPICard label="Cost Basis" value={fmtINR(totalValue, true)} icon={DollarSign} accent="violet" sublabel="Sum of cost prices" />
      </div>

      <Tabs value={cat} onValueChange={setCat}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All ({products.length})</TabsTrigger>
          {cats.map((c) => (
            <TabsTrigger key={c} value={c}>{c} ({products.filter((p) => (p.category?.name ?? 'Uncategorized') === c).length})</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {view === 'table' ? (
        <DataTable
          data={filtered}
          columns={columns}
          loading={loading}
          pageSize={12}
          searchPlaceholder="Search by name, SKU..."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <Card key={i} className="p-5 h-64 shadow-soft"><div className="h-full shimmer rounded" /></Card>)
          ) : filtered.map((p) => (
            <Card key={p.id} className="p-4 shadow-soft hover:shadow-soft-md transition-all group">
              <div className="aspect-square rounded-lg bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent flex items-center justify-center mb-3 relative overflow-hidden">
                <Package className="h-12 w-12 text-orange-500/40 group-hover:scale-110 transition-transform" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={abcColor(p.abcClass)}>{p.abcClass}</span>
                  <Badge variant="outline" className="bg-background/80">{p.packagingSize}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.sku}</p>
                <div className="flex items-baseline justify-between mt-2">
                  <div>
                    <p className="text-lg font-semibold tabular-nums">{fmtINR(p.mrp)}</p>
                    <p className="text-[10px] text-muted-foreground">MRP</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{p.marginPercent.toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground">margin</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-3 pt-3 border-t text-xs">
                  <div><span className="text-muted-foreground">Cost:</span> <span className="tabular-nums">{fmtINR(p.costPrice)}</span></div>
                  <div><span className="text-muted-foreground">WS:</span> <span className="tabular-nums">{fmtINR(p.wholesalePrice)}</span></div>
                  <div><span className="text-muted-foreground">Reorder:</span> <span className="tabular-nums">{p.reorderLevel}</span></div>
                  <div><span className="text-muted-foreground">Shelf:</span> <span className="tabular-nums">{p.shelfLifeDays}d</span></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
