'use client'
import { useState, useMemo } from 'react'
import { FormDrawer, Field, FormGrid } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/shared/components/status-badge'
import { Plus, Trash2, Minus, ShoppingCart, Search, User, Package } from 'lucide-react'
import { fmtINR, cn } from '@/shared/lib/format'
import { useProducts, useCustomers, useCreateOrder } from '@/shared/services/mutations'
import { useApp } from '@/shared/lib/store'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Product, Customer } from '@/shared/types'

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  unitCost: number
  taxPercent: number
}

export function NewOrderDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { user } = useApp()
  const { data: products = [] } = useProducts()
  const { data: customers = [] } = useCustomers()
  const createOrder = useCreateOrder()

  const [customerId, setCustomerId] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [channel, setChannel] = useState('direct')
  const [notes, setNotes] = useState('')
  const [paidNow, setPaidNow] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank' | 'cheque' | 'credit'>('cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')

  const selectedCustomer = customers.find((c) => c.id === customerId)

  const filteredCustomers = customerSearch
    ? customers.filter((c) => c.businessName.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch) || c.area.toLowerCase().includes(customerSearch.toLowerCase()))
    : customers

  const filteredProducts = productSearch
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    : products

  const addToCart = (product: Product) => {
    setCart((c) => {
      const existing = c.find((x) => x.product.id === product.id)
      if (existing) {
        return c.map((x) => x.product.id === product.id ? { ...x, quantity: x.quantity + 1 } : x)
      }
      const unitPrice = selectedCustomer?.type === 'distributor' ? product.distributorPrice : product.wholesalePrice
      return [...c, { product, quantity: 1, unitPrice, unitCost: product.costPrice, taxPercent: product.gstRate }]
    })
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) { setCart((c) => c.filter((x) => x.product.id !== productId)); return }
    setCart((c) => c.map((x) => x.product.id === productId ? { ...x, quantity: qty } : x))
  }

  const updatePrice = (productId: string, price: number) => {
    setCart((c) => c.map((x) => x.product.id === productId ? { ...x, unitPrice: price } : x))
  }

  const removeItem = (productId: string) => setCart((c) => c.filter((x) => x.product.id !== productId))

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, x) => s + x.quantity * x.unitPrice, 0)
    const afterDiscount = subtotal - discount
    const tax = +(afterDiscount * 0.05).toFixed(2)
    const total = +(afterDiscount + tax).toFixed(2)
    const profit = cart.reduce((s, x) => s + (x.unitPrice - x.unitCost) * x.quantity, 0)
    return { subtotal, tax, total, profit, afterDiscount }
  }, [cart, discount])

  const handleSubmit = async () => {
    if (!customerId) return
    if (cart.length === 0) return
    await createOrder.mutateAsync({
      customerId,
      salesmanId: user?.id,
      items: cart.map((x) => ({
        productId: x.product.id, quantity: x.quantity,
        unitPrice: x.unitPrice, unitCost: x.unitCost, taxPercent: x.taxPercent, discount: 0,
      })),
      discount, channel, notes,
      paidNow: paymentMethod === 'credit' ? 0 : paidNow,
      paymentMethod: paymentMethod === 'credit' ? undefined : paymentMethod,
      paymentReference: paymentReference || undefined,
      createdBy: user?.id,
    })
    // Reset
    setCustomerId(''); setCart([]); setDiscount(0); setNotes(''); setPaidNow(0); setPaymentReference('')
    onOpenChange(false)
  }

  const canSubmit = customerId && cart.length > 0 && !createOrder.isPending

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="New Sales Order"
      description="Select customer, add items, and process payment"
      width="xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            <ShoppingCart className="h-4 w-4" />
            {createOrder.isPending ? 'Creating...' : `Place Order · ${fmtINR(totals.total)}`}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Customer selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Customer</h3>
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
              <div>
                <p className="text-sm font-medium">{selectedCustomer.businessName}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.area} · {selectedCustomer.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{selectedCustomer.type}</Badge>
                <Badge variant={selectedCustomer.outstanding > selectedCustomer.creditLimit * 0.8 ? 'danger' : 'success'}>
                  Outstanding {fmtINR(selectedCustomer.outstanding, true)}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setCustomerId('')}>Change</Button>
              </div>
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start h-10">
                  <User className="h-4 w-4" />
                  <span className="text-muted-foreground">Select customer...</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search by name, phone, area..." value={customerSearch} onValueChange={setCustomerSearch} />
                  <CommandList>
                    <CommandEmpty>No customers found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCustomers.slice(0, 20).map((c) => (
                        <CommandItem key={c.id} onSelect={() => setCustomerId(c.id)}>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{c.businessName}</p>
                            <p className="text-xs text-muted-foreground">{c.area} · {c.phone}</p>
                          </div>
                          <Badge variant="outline" className="capitalize">{c.type}</Badge>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Product search */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Add Products</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start h-10">
                <Plus className="h-4 w-4" />
                <span className="text-muted-foreground">Search products to add...</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput placeholder="Search by name or SKU..." value={productSearch} onValueChange={setProductSearch} />
                <CommandList>
                  <CommandEmpty>No products found.</CommandEmpty>
                  <CommandGroup>
                    {filteredProducts.slice(0, 20).map((p) => (
                      <CommandItem key={p.id} onSelect={() => addToCart(p)} disabled={cart.some((x) => x.product.id === p.id)}>
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.sku} · {p.packagingSize}</p>
                        </div>
                        <span className="text-sm font-medium">{fmtINR(p.wholesalePrice)}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Cart ({cart.length} items)</h3>
              <Button variant="ghost" size="sm" onClick={() => setCart([])}><Trash2 className="h-3 w-3" /> Clear</Button>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Item</th>
                    <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Qty</th>
                    <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Price</th>
                    <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.product.id} className="border-t">
                      <td className="px-3 py-2">
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.product.sku}</p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQty(item.product.id, parseInt(e.target.value) || 0)}
                            className="h-7 w-14 text-center px-1"
                          />
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updatePrice(item.product.id, parseFloat(e.target.value) || 0)}
                          className="h-7 w-20 text-right px-1"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="font-medium tabular-nums">{fmtINR(item.quantity * item.unitPrice)}</span>
                      </td>
                      <td className="px-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => removeItem(item.product.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Totals + payment */}
        {cart.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Order Details</h3>
              <FormGrid cols={2}>
                <Field label="Discount (₹)">
                  <Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="h-9" />
                </Field>
                <Field label="Channel">
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="portal">Portal</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FormGrid>
              <Field label="Notes">
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." className="h-9" />
              </Field>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Payment</h3>
              <FormGrid cols={2}>
                <Field label="Method">
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="credit">Credit (Later)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Paid Now (₹)">
                  <Input type="number" value={paymentMethod === 'credit' ? 0 : paidNow} onChange={(e) => setPaidNow(parseFloat(e.target.value) || 0)} disabled={paymentMethod === 'credit'} className="h-9" />
                </Field>
              </FormGrid>
              {paymentMethod !== 'credit' && paidNow > 0 && (
                <Field label="Reference">
                  <Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="UTR / Cheque no." className="h-9" />
                </Field>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {cart.length > 0 && (
          <div className="rounded-lg bg-muted/40 p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{fmtINR(totals.subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="tabular-nums text-rose-600">-{fmtINR(discount)}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST (5%)</span><span className="tabular-nums">{fmtINR(totals.tax)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t"><span>Total</span><span className="tabular-nums">{fmtINR(totals.total)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Estimated Profit</span><span className="tabular-nums text-emerald-600 dark:text-emerald-400">{fmtINR(totals.profit)}</span></div>
            {paymentMethod !== 'credit' && paidNow > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t"><span className="text-muted-foreground">Balance Due</span><span className="tabular-nums text-amber-600">{fmtINR(totals.total - paidNow)}</span></div>
            )}
            {paymentMethod === 'credit' && selectedCustomer && (
              <div className="flex justify-between text-xs pt-2 border-t">
                <span className="text-muted-foreground">New Outstanding</span>
                <span className={cn('tabular-nums font-medium', selectedCustomer.outstanding + totals.total > selectedCustomer.creditLimit ? 'text-rose-600' : 'text-amber-600')}>
                  {fmtINR(selectedCustomer.outstanding + totals.total)} / {fmtINR(selectedCustomer.creditLimit)} limit
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </FormDrawer>
  )
}
