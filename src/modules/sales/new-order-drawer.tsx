'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { FormDrawer, Field, FormGrid } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/shared/components/status-badge'
import { Plus, Trash2, Minus, ShoppingCart, AlertTriangle, Save, FileText, Package } from 'lucide-react'
import { fmtINR, cn } from '@/shared/lib/format'
import { useProducts, useCustomers, useInventory, useCreateOrder } from '@/shared/services/mutations'
import { useApp } from '@/shared/lib/store'
import { CustomerPicker, ProductPicker } from '@/shared/components/entity-picker'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Product, Customer } from '@/shared/types'

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  unitCost: number
  taxPercent: number
  batchNo?: string
}

export function NewOrderDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { user } = useApp()
  const { data: products = [] } = useProducts()
  const { data: customers = [] } = useCustomers()
  const { data: inventory = [] } = useInventory()
  const createOrder = useCreateOrder()

  const [customerId, setCustomerId] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat')
  const [roundOff, setRoundOff] = useState(true)
  const [channel, setChannel] = useState('direct')
  const [notes, setNotes] = useState('')
  const [paidNow, setPaidNow] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank' | 'cheque' | 'credit'>('cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [justAddedProductId, setJustAddedProductId] = useState<string | null>(null)

  const selectedCustomer = customers.find((c) => c.id === customerId)

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, x) => s + x.quantity * x.unitPrice, 0)
    const discountAmount = discountType === 'percent' ? (subtotal * discount) / 100 : discount
    const afterDiscount = subtotal - discountAmount
    const taxableAmount = afterDiscount
    const tax = cart.reduce((s, x) => {
      const lineTaxable = (x.quantity * x.unitPrice) - (discountAmount * (x.quantity * x.unitPrice) / subtotal)
      return s + lineTaxable * (x.taxPercent / 100)
    }, 0)
    const total = afterDiscount + tax
    const roundedTotal = roundOff ? Math.round(total) : total
    const roundOffAmount = roundedTotal - total
    const profit = cart.reduce((s, x) => s + (x.unitPrice - x.unitCost) * x.quantity, 0) - discountAmount
    return { subtotal, discountAmount, taxableAmount, tax, total: roundedTotal, roundOffAmount, profit, afterDiscount }
  }, [cart, discount, discountType, roundOff])

  // ─── Validations ───
  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {}
    if (!customerId) errs.customer = 'Customer is required'
    if (cart.length === 0) errs.cart = 'Add at least one product'
    if (selectedCustomer?.status === 'blocked') errs.customer = 'Cannot create order for blocked customer'
    if (selectedCustomer && selectedCustomer.outstanding + totals.total > selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 && paymentMethod === 'credit') {
      errs.credit = `Credit limit exceeded (₹${(selectedCustomer.outstanding + totals.total).toLocaleString('en-IN')} > ₹${selectedCustomer.creditLimit.toLocaleString('en-IN')})`
    }
    // Check for duplicate products
    const productIds = cart.map((x) => x.product.id)
    const dups = productIds.filter((id, i) => productIds.indexOf(id) !== i)
    if (dups.length > 0) errs.duplicate = 'Duplicate product in cart'
    // Check stock
    cart.forEach((item) => {
      const inv = inventory.find((i) => i.productId === item.product.id)
      if (inv && item.quantity > inv.currentStock) {
        errs[`stock_${item.product.id}`] = `Only ${inv.currentStock} in stock (requested ${item.quantity})`
      }
    })
    // Check zero/negative
    cart.forEach((item) => {
      if (item.quantity <= 0) errs[`qty_${item.product.id}`] = 'Quantity must be positive'
    })
    return errs
  }, [customerId, cart, selectedCustomer, inventory, totals.total, paymentMethod])

  // ─── Cart operations ───
  const addToCart = (product: Product) => {
    setCart((c) => {
      const existing = c.find((x) => x.product.id === product.id)
      if (existing) {
        return c.map((x) => x.product.id === product.id ? { ...x, quantity: x.quantity + 1 } : x)
      }
      const unitPrice = selectedCustomer?.type === 'distributor' ? product.distributorPrice : product.wholesalePrice
      return [...c, { product, quantity: 1, unitPrice, unitCost: product.costPrice, taxPercent: product.gstRate }]
    })
    setJustAddedProductId(product.id)
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) { setCart((c) => c.filter((x) => x.product.id !== productId)); return }
    setCart((c) => c.map((x) => x.product.id === productId ? { ...x, quantity: qty } : x))
  }

  const updatePrice = (productId: string, price: number) => {
    setCart((c) => c.map((x) => x.product.id === productId ? { ...x, unitPrice: price } : x))
  }

  const removeItem = (productId: string) => setCart((c) => c.filter((x) => x.product.id !== productId))

  // Reset on close — use key prop on parent to remount instead of effect
  // (handled by parent component remounting the drawer)

  const handleSubmit = async () => {
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    await createOrder.mutateAsync({
      customerId,
      salesmanId: user?.id,
      items: cart.map((x) => ({
        productId: x.product.id, quantity: x.quantity,
        unitPrice: x.unitPrice, unitCost: x.unitCost, taxPercent: x.taxPercent, discount: 0,
      })),
      discount: totals.discountAmount, channel, notes,
      paidNow: paymentMethod === 'credit' ? 0 : paidNow,
      paymentMethod: paymentMethod === 'credit' ? undefined : paymentMethod,
      paymentReference: paymentReference || undefined,
      createdBy: user?.id,
    })
    setCustomerId(''); setCart([]); setDiscount(0); setNotes(''); setPaidNow(0); setPaymentReference('')
    onOpenChange(false)
  }

  // Keyboard: Ctrl+Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && open) {
        e.preventDefault()
        handleSubmit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, handleSubmit])

  const canSubmit = customerId && cart.length > 0 && Object.keys(validationErrors).length === 0 && !createOrder.isPending

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
            {createOrder.isPending ? 'Creating...' : `Place Order · ${fmtINR(totals.total, true)}`}
            <kbd className="ml-1 text-[10px] px-1 py-0.5 rounded bg-primary-foreground/20">⌘↵</kbd>
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
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{selectedCustomer.businessName}</p>
                  <Badge variant="outline" className="capitalize">{selectedCustomer.type}</Badge>
                  {selectedCustomer.status === 'blocked' && <Badge variant="danger">BLOCKED</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{selectedCustomer.area} · {selectedCustomer.phone}</p>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className={cn('font-medium', selectedCustomer.outstanding > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                    Outstanding: {fmtINR(selectedCustomer.outstanding, true)}
                  </span>
                  <span className="text-muted-foreground">Credit: {fmtINR(selectedCustomer.creditLimit, true)}</span>
                  <span className="text-muted-foreground">Risk: {selectedCustomer.riskScore.toFixed(0)}/100</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCustomerId('')}>Change</Button>
            </div>
          ) : (
            <CustomerPicker
              customers={customers}
              value={customerId}
              onChange={setCustomerId}
            />
          )}
          {validationErrors.customer && (
            <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {validationErrors.customer}</p>
          )}
        </div>

        {/* Product search */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Add Products</h3>
          <ProductPicker
            products={products}
            inventory={inventory}
            value={null}
            onChange={(id) => {
              const p = products.find((x) => x.id === id)
              if (p) addToCart(p)
            }}
            excludeIds={cart.map((x) => x.product.id)}
          />
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Cart ({cart.length} items)</h3>
              <Button variant="ghost" size="sm" onClick={() => setCart([])}><Trash2 className="h-3 w-3" /> Clear</Button>
            </div>
            {validationErrors.duplicate && (
              <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {validationErrors.duplicate}</p>
            )}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Item</th>
                    <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Qty</th>
                    <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Price</th>
                    <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">GST</th>
                    <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => {
                    const inv = inventory.find((i) => i.productId === item.product.id)
                    const isOutOfStock = inv && item.quantity > inv.currentStock
                    return (
                      <tr key={item.product.id} className={cn('border-t', justAddedProductId === item.product.id && 'bg-primary/5 animate-pulse')}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-500/10 text-orange-600 shrink-0">
                              <Package className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{item.product.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-mono">{item.product.sku}</span>
                                <span>·</span>
                                <span>Stock: {inv?.currentStock ?? 0}</span>
                                <span>·</span>
                                <span className="text-emerald-600">{item.product.marginPercent.toFixed(0)}% margin</span>
                              </div>
                            </div>
                          </div>
                          {validationErrors[`stock_${item.product.id}`] && (
                            <p className="text-[10px] text-rose-600 mt-1 flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5" /> {validationErrors[`stock_${item.product.id}`]}</p>
                          )}
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
                              className={cn('h-7 w-14 text-center px-1', isOutOfStock && 'border-rose-500')}
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
                          <span className="text-xs tabular-nums text-muted-foreground">{item.taxPercent}%</span>
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
                    )
                  })}
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
                <Field label="Discount Type">
                  <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat (₹)</SelectItem>
                      <SelectItem value="percent">Percent (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={`Discount ${discountType === 'percent' ? '(%)' : '(₹)'}`}>
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
                <Field label="Round Off">
                  <Select value={roundOff ? 'yes' : 'no'} onValueChange={(v) => setRoundOff(v === 'yes')}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
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
              {validationErrors.credit && (
                <p className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {validationErrors.credit}</p>
              )}
            </div>
          </div>
        )}

        {/* Summary with tax breakup */}
        {cart.length > 0 && (
          <div className="rounded-lg bg-muted/40 p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{fmtINR(totals.subtotal)}</span></div>
            {totals.discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount ({discountType === 'percent' ? `${discount}%` : 'flat'})</span><span className="tabular-nums text-rose-600">-{fmtINR(totals.discountAmount)}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Taxable Amount</span><span className="tabular-nums">{fmtINR(totals.taxableAmount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST</span><span className="tabular-nums">{fmtINR(totals.tax)}</span></div>
            {roundOff && totals.roundOffAmount !== 0 && (
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Round Off</span><span className="tabular-nums text-muted-foreground">{totals.roundOffAmount > 0 ? '+' : ''}{fmtINR(totals.roundOffAmount)}</span></div>
            )}
            <div className="flex justify-between text-base font-semibold pt-2 border-t"><span>Total</span><span className="tabular-nums">{fmtINR(totals.total)}</span></div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                <p className="text-[10px] text-muted-foreground uppercase">Profit</p>
                <p className="text-sm font-semibold text-emerald-600 tabular-nums">{fmtINR(totals.profit, true)}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-sky-500/10">
                <p className="text-[10px] text-muted-foreground uppercase">Margin %</p>
                <p className="text-sm font-semibold text-sky-600 tabular-nums">{totals.total > 0 ? ((totals.profit / totals.total) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
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
