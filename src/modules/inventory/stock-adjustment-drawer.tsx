'use client'
import { useState } from 'react'
import { FormDrawer, Field, FormGrid } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdjustStock, useInventory } from '@/shared/services/mutations'
import { useApp } from '@/shared/lib/store'
import { AlertTriangle } from 'lucide-react'

export function StockAdjustmentDrawer({ open, onOpenChange, presetProductId }: { open: boolean; onOpenChange: (b: boolean) => void; presetProductId?: string }) {
  const { user } = useApp()
  const { data: inventory = [] } = useInventory()
  const adjust = useAdjustStock()
  const [productId, setProductId] = useState(presetProductId ?? '')
  const [warehouseId, setWarehouseId] = useState('')
  const [type, setType] = useState<'adjustment' | 'damaged' | 'lost' | 'expired'>('adjustment')
  const [quantity, setQuantity] = useState(0)
  const [note, setNote] = useState('')

  const productInventory = inventory.filter((i: any) => i.productId === productId)
  const selectedInv = productInventory.find((i: any) => i.warehouseId === warehouseId)

  const handleSubmit = async () => {
    if (!productId || !warehouseId || quantity === 0) return
    await adjust.mutateAsync({
      id: productId,
      data: {
        productId, warehouseId, type,
        quantity: type === 'damaged' || type === 'lost' || type === 'expired' ? -Math.abs(quantity) : quantity,
        note, createdBy: user?.id,
      },
    })
    setProductId(''); setWarehouseId(''); setQuantity(0); setNote('')
    onOpenChange(false)
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Stock Adjustment" description="Adjust stock for damaged, lost, expired, or corrected quantities" width="md"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!productId || !warehouseId || quantity === 0 || adjust.isPending}>{adjust.isPending ? 'Adjusting...' : 'Apply Adjustment'}</Button></>}
    >
      <div className="space-y-4">
        <Field label="Product" required>
          <Select value={productId} onValueChange={(v) => { setProductId(v); setWarehouseId('') }}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select product..." /></SelectTrigger>
            <SelectContent>{inventory.map((i: any) => <SelectItem key={i.id} value={i.productId}>{i.product.name} ({i.product.sku})</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        {productId && (
          <Field label="Warehouse" required>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select warehouse..." /></SelectTrigger>
              <SelectContent>{productInventory.map((i: any) => (
                <SelectItem key={i.id} value={i.warehouseId}>{i.warehouse.name} ({i.warehouse.code}) — Stock: {i.currentStock}</SelectItem>
              ))}</SelectContent>
            </Select>
          </Field>
        )}

        <FormGrid cols={2}>
          <Field label="Adjustment Type" required>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="adjustment">Adjustment (±)</SelectItem>
                <SelectItem value="damaged">Damaged (-)</SelectItem>
                <SelectItem value="lost">Lost (-)</SelectItem>
                <SelectItem value="expired">Expired (-)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Quantity" required hint={type !== 'adjustment' ? 'Will be subtracted from stock' : 'Positive to add, negative to remove'}>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} className="h-9" />
          </Field>
        </FormGrid>

        <Field label="Reason / Note"><Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" placeholder="Explain the reason for adjustment..." /></Field>

        {selectedInv && quantity !== 0 && (
          <div className="rounded-lg bg-muted/40 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Current Stock</span><span className="tabular-nums">{selectedInv.currentStock}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Adjustment</span><span className="tabular-nums text-rose-600">{type === 'adjustment' ? (quantity > 0 ? '+' : '') + quantity : -Math.abs(quantity)}</span></div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>New Stock</span>
              <span className={`tabular-nums ${selectedInv.currentStock + (type === 'adjustment' ? quantity : -Math.abs(quantity)) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {selectedInv.currentStock + (type === 'adjustment' ? quantity : -Math.abs(quantity))}
              </span>
            </div>
            {selectedInv.currentStock + (type === 'adjustment' ? quantity : -Math.abs(quantity)) < 0 && (
              <div className="flex items-center gap-2 text-xs text-rose-600 pt-2 border-t"><AlertTriangle className="h-3 w-3" /> Warning: Stock will go negative. Please verify the quantity.</div>
            )}
          </div>
        )}
      </div>
    </FormDrawer>
  )
}
