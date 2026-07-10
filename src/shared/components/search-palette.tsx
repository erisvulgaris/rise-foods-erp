'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  LayoutDashboard, Users, Package, Warehouse, ShoppingCart, Truck, Banknote,
  Factory, BarChart3, FileText, Settings, Search, ArrowRight, Bell, TrendingUp,
  AlertTriangle, Plus, FileSpreadsheet, UserPlus, PackagePlus, ShoppingCart as CartIcon,
  MapPin, CheckSquare, ArrowLeftRight,
} from 'lucide-react'
import { useApp } from '@/shared/lib/store'
import { ModuleName } from '@/shared/lib/rbac'
import { api } from '@/shared/services/api'
import { fmtINR } from '@/shared/lib/format'
import type { Customer, Product, SalesOrder } from '@/shared/types'

const QUICK_ACTIONS = [
  { id: 'new-order', label: 'New Sales Order', icon: CartIcon, group: 'Create' },
  { id: 'new-customer', label: 'Add Customer', icon: UserPlus, group: 'Create' },
  { id: 'new-product', label: 'Add Product', icon: PackagePlus, group: 'Create' },
  { id: 'export-sales', label: 'Export Sales Report', icon: FileSpreadsheet, group: 'Reports' },
  { id: 'export-inventory', label: 'Export Inventory Report', icon: FileSpreadsheet, group: 'Reports' },
]

const NAV_ITEMS: { id: ModuleName; label: string; icon: any; desc: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Executive KPIs & trends' },
  { id: 'crm', label: 'CRM', icon: Users, desc: 'Retailers & distributors' },
  { id: 'sales', label: 'Sales', icon: ShoppingCart, desc: 'Orders & invoices' },
  { id: 'visits', label: 'Visits', icon: MapPin, desc: 'Field activity tracking' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, desc: 'Follow-ups & to-do' },
  { id: 'products', label: 'Products', icon: Package, desc: 'Catalog & pricing' },
  { id: 'inventory', label: 'Inventory', icon: Warehouse, desc: 'Stock & batches' },
  { id: 'stock_movements', label: 'Stock Movements', icon: ArrowLeftRight, desc: 'Audit trail' },
  { id: 'procurement', label: 'Procurement', icon: Truck, desc: 'Suppliers & POs' },
  { id: 'warehouse', label: 'Warehouse', icon: Truck, desc: 'Dispatch & returns' },
  { id: 'production', label: 'Production', icon: Factory, desc: 'Batches & yield' },
  { id: 'finance', label: 'Finance', icon: Banknote, desc: 'P&L & cash flow' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Insights & forecasts' },
  { id: 'reports', label: 'Reports', icon: FileText, desc: 'PDF / Excel / CSV' },
  { id: 'settings', label: 'Settings', icon: Settings, desc: 'Users & RBAC' },
]

export function SearchPalette() {
  const { searchOpen, setSearchOpen, setView, setActiveCustomer } = useApp()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<SalesOrder[]>([])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [searchOpen, setSearchOpen])

  useEffect(() => {
    if (!searchOpen) return
    Promise.all([api.customers(), api.products(), api.salesOrders()]).then(([c, p, o]) => {
      setCustomers(c.slice(0, 8))
      setProducts(p.slice(0, 8))
      setOrders(o.slice(0, 6))
    }).catch(() => {})
  }, [searchOpen])

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl gap-0" showCloseButton={false}>
        <Command className="rounded-lg">
          <CommandInput placeholder="Search anything or jump to a module..." />
          <CommandList className="max-h-[420px]">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {NAV_ITEMS.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => { setView(item.id); setSearchOpen(false) }}
                  className="py-2"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <kbd className="text-[10px] px-1 py-0.5 rounded border bg-muted text-muted-foreground uppercase">{item.id[0]}</kbd>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              {QUICK_ACTIONS.map((a) => (
                <CommandItem key={a.id} onSelect={() => setSearchOpen(false)} className="py-2">
                  <a.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{a.label}</span>
                  {a.id === 'new-order' && <kbd className="ml-auto text-[10px] px-1 py-0.5 rounded border bg-muted text-muted-foreground uppercase">N</kbd>}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            {customers.length > 0 && (
              <CommandGroup heading="Customers">
                {customers.map((c) => (
                  <CommandItem
                    key={c.id}
                    onSelect={() => { setView('crm'); setActiveCustomer(c.id); setSearchOpen(false) }}
                    className="py-2"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.businessName}</p>
                      <p className="text-xs text-muted-foreground">{c.area} · {c.phone}</p>
                    </div>
                    {c.outstanding > 0 && <span className="text-xs text-rose-500">{fmtINR(c.outstanding)}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {products.length > 0 && (
              <CommandGroup heading="Products">
                {products.map((p) => (
                  <CommandItem
                    key={p.id}
                    onSelect={() => { setView('products'); setSearchOpen(false) }}
                    className="py-2"
                  >
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                    <span className="text-xs">{fmtINR(p.mrp)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {orders.length > 0 && (
              <CommandGroup heading="Recent Orders">
                {orders.map((o) => (
                  <CommandItem
                    key={o.id}
                    onSelect={() => { setView('sales'); setSearchOpen(false) }}
                    className="py-2"
                  >
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{o.orderNo}</p>
                      <p className="text-xs text-muted-foreground">{o.customer.businessName}</p>
                    </div>
                    <span className="text-xs">{fmtINR(o.total)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
