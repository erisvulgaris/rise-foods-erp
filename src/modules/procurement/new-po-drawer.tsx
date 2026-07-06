'use client'
import { useState, useMemo } from 'react'
import { FormDrawer, Field, FormGrid } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/shared/components/status-badge'
import { Plus, Trash2, Minus, ShoppingCart, Building2 } from 'lucide-react'
import { fmtINR } from '@/shared/lib/format'
import { useProducts, useSuppliers, useInventory, useCreatePO } from '@/shared/services/mutations'
import { useApp } from '@/shared/lib/store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Product } from '@/shared/types'

interface CartItem { product: Product; quantity: number; unitCost: number }

export function NewPODrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { user } = useApp()
  const { data: products = [] } = useProducts()
  const { data: suppliers = [] } = useSuppliers()
  const { data: inventory = [] } = useInventory()
  const createPO = useCreatePO()
  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [expectedAt, setExpectedAt] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [supplierSearch, setSupplierSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')

  const warehouses = Array.from(new Map(inventory.map((i: any) => [i.warehouse.id, i.warehouse])).values())
  const selectedSupplier = suppliers.find((s) => s.id === supplierId)
  const filteredSuppliers = supplierSearch ? suppliers.filter((s) => s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || s.phone.includes(supplierSearch)) : suppliers
  const filteredProducts = productSearch ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase())) : products

  const addToCart = (product: Product) => {
    setCart((c) => {
      const existing = c.find((x) => x.product.id === product.id)
      if (existing) return c.map((x) => x.product.id === product.id ? { ...x, quantity: x.quantity + 10 } : x)
      return [...c, { product, quantity: 10, unitCost: product.costPrice }]
    })
  }
  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) { setCart((c) => c.filter((x) => x.product.id !== productId)); return }
    setCart((c) => c.map((x) => x.product.id === productId ? { ...x, quantity: qty } : x))
  }
  const updateCost = (productId: string, cost: number) => setCart((c) => c.map((x) => x.product.id === productId ? { ...x, unitCost: cost } : x))
  const removeItem = (productId: string) => setCart((c) => c.filter((x) => x.product.id !== productId))

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, x) => s + x.quantity * x.unitCost, 0)
    const tax = +(subtotal * 0.05).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    return { subtotal, tax, total }
  }, [cart])

  const handleSubmit = async () => {
    if (!supplierId || !warehouseId || cart.length === 0) return
    await createPO.mutateAsync({
      supplierId, warehouseId,
      items: cart.map((x) => ({ productId: x.product.id, quantity: x.quantity, unitCost: x.unitCost, taxPercent: x.product.gstRate })),
      expectedAt, notes, createdBy: user?.id,
    })
    setSupplierId(''); setWarehouseId(''); setCart([]); setNotes('')
    onOpenChange(false)
  }

  const canSubmit = supplierId && warehouseId && cart.length > 0 && !createPO.isPending

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="New Purchase Order" description="Select supplier, warehouse, and add line items" width="xl"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}><ShoppingCart className="h-4 w-4" />{createPO.isPending ? 'Creating...' : `Create PO · ${fmtINR(totals.total, true)}`}</Button></>}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Supplier & Warehouse</h3>
          <FormGrid cols={2}>
            <Field label="Supplier" required>
              {selectedSupplier ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/40">
                  <div className="min-w-0"><p className="text-sm font-medium truncate">{selectedSupplier.name}</p><p className="text-xs text-muted-foreground">{selectedSupplier.district} · Lead {selectedSupplier.leadTimeDays}d</p></div>
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => setSupplierId('')}>Change</Button>
                </div>
              ) : (
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start h-9"><Building2 className="h-4 w-4" /><span className="text-muted-foreground">Select supplier...</span></Button></PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search suppliers..." value={supplierSearch} onValueChange={setSupplierSearch} />
                      <CommandList><CommandEmpty>No suppliers found.</CommandEmpty><CommandGroup>
                        {filteredSuppliers.slice(0, 20).map((s) => (
                          <CommandItem key={s.id} onSelect={() => setSupplierId(s.id)}>
                            <div className="flex-1"><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.district} · {s.phone}</p></div>
                            <Badge variant="outline">{s.leadTimeDays}d</Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup></CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </Field>
            <Field label="Warehouse" required>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select warehouse..." /></SelectTrigger>
                <SelectContent>{warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Expected Date"><Input type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} className="h-9" /></Field>
            <Field label="Notes"><Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-9" placeholder="Optional..." /></Field>
          </FormGrid>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Add Products</h3>
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start h-10"><Plus className="h-4 w-4" /><span className="text-muted-foreground">Search products to add...</span></Button></PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput placeholder="Search by name or SKU..." value={productSearch} onValueChange={setProductSearch} />
                <CommandList><CommandEmpty>No products found.</CommandEmpty><CommandGroup>
                  {filteredProducts.slice(0, 20).map((p) => (
                    <CommandItem key={p.id} onSelect={() => addToCart(p)} disabled={cart.some((x) => x.product.id === p.id)}>
                      <div className="flex-1"><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-muted-foreground font-mono">{p.sku} · {p.packagingSize}</p></div>
                      <span className="text-sm font-medium">Cost: {fmtINR(p.costPrice)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup></CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {cart.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Line Items ({cart.length})</h3>
              <Button variant="ghost" size="sm" onClick={() => setCart([])}><Trash2 className="h-3 w-3" /> Clear</Button>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40"><tr>
                  <th className="text-left px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Item</th>
                  <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Qty</th>
                  <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Unit Cost</th>
                  <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Total</th>
                  <th></th>
                </tr></thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.product.id} className="border-t">
                      <td className="px-3 py-2"><p className="text-sm font-medium">{item.product.name}</p><p className="text-xs text-muted-foreground font-mono">{item.product.sku}</p></td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, item.quantity - 10)}><Minus className="h-3 w-3" /></Button>
                          <Input type="number" value={item.quantity} onChange={(e) => updateQty(item.product.id, parseInt(e.target.value) || 0)} className="h-7 w-16 text-center px-1" step={5} />
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, item.quantity + 10)}><Plus className="h-3 w-3" /></Button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right"><Input type="number" value={item.unitCost} onChange={(e) => updateCost(item.product.id, parseFloat(e.target.value) || 0)} className="h-7 w-20 text-right px-1" /></td>
                      <td className="px-3 py-2 text-right"><span className="font-medium tabular-nums">{fmtINR(item.quantity * item.unitCost)}</span></td>
                      <td className="px-2"><Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => removeItem(item.product.id)}><Trash2 className="h-3 w-3" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {cart.length > 0 && (
          <div className="rounded-lg bg-muted/40 p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{fmtINR(totals.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST (5%)</span><span className="tabular-nums">{fmtINR(totals.tax)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t"><span>Total</span><span className="tabular-nums">{fmtINR(totals.total)}</span></div>
            {selectedSupplier && <div className="flex justify-between text-xs pt-2 border-t"><span className="text-muted-foreground">Payment Terms</span><span className="font-medium">{selectedSupplier.paymentTerms ?? 'Net 15'}</span></div>}
          </div>
        )}
      </div>
    </FormDrawer>
  )
}
