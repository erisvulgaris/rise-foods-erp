'use client'
import { useState } from 'react'
import { FormDrawer, Field, FormGrid } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProducts, useUsers, useCreateProductionBatch } from '@/shared/services/mutations'
import { Factory, Gauge } from 'lucide-react'

const empty = {
  productId: '', batchNo: '', startDate: new Date().toISOString().slice(0, 10),
  inputQty: 0, outputQty: 0, machineName: '', operatorId: '',
  stage: 'cleaning' as 'cleaning' | 'grinding' | 'packing' | 'finished' | 'qc',
  cost: 0, downtime: 0, notes: '',
}

export function ProductionBatchDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { data: products = [] } = useProducts()
  const { data: users = [] } = useUsers()
  const create = useCreateProductionBatch()
  const [form, setForm] = useState(empty)
  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const operators = users.filter((u: any) => u.role === 'factory_staff' || u.role === 'admin')
  const yieldPct = form.inputQty > 0 ? (form.outputQty / form.inputQty) * 100 : 0
  const lossPct = 100 - yieldPct

  const handleSubmit = async () => {
    await create.mutateAsync({ ...form, operatorId: form.operatorId || null, machineName: form.machineName || null, notes: form.notes || null })
    setForm(empty)
    onOpenChange(false)
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="New Production Batch" description="Log a grinding/cleaning/packing batch with yield and loss tracking" width="md"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!form.batchNo || !form.productId || form.inputQty <= 0 || create.isPending}><Factory className="h-4 w-4" />{create.isPending ? 'Creating...' : 'Create Batch'}</Button></>}
    >
      <div className="space-y-4">
        <FormGrid cols={2}>
          <Field label="Batch No" required><Input value={form.batchNo} onChange={(e) => set('batchNo', e.target.value)} className="h-9 font-mono" placeholder="PB-TUR-001" /></Field>
          <Field label="Product" required>
            <Select value={form.productId} onValueChange={(v) => set('productId', v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Start Date"><Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className="h-9" /></Field>
          <Field label="Stage">
            <Select value={form.stage} onValueChange={(v: any) => set('stage', v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="grinding">Grinding</SelectItem>
                <SelectItem value="packing">Packing</SelectItem>
                <SelectItem value="qc">Quality Check</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FormGrid>

        <FormGrid cols={2}>
          <Field label="Input Quantity (kg/units)" required><Input type="number" value={form.inputQty} onChange={(e) => set('inputQty', parseFloat(e.target.value) || 0)} className="h-9" /></Field>
          <Field label="Output Quantity"><Input type="number" value={form.outputQty} onChange={(e) => set('outputQty', parseFloat(e.target.value) || 0)} className="h-9" /></Field>
          <Field label="Machine"><Input value={form.machineName} onChange={(e) => set('machineName', e.target.value)} className="h-9" placeholder="Grinder-G1" /></Field>
          <Field label="Operator">
            <Select value={form.operatorId} onValueChange={(v) => set('operatorId', v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Assign..." /></SelectTrigger>
              <SelectContent>{operators.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Cost (₹)"><Input type="number" value={form.cost} onChange={(e) => set('cost', parseFloat(e.target.value) || 0)} className="h-9" /></Field>
          <Field label="Downtime (min)"><Input type="number" value={form.downtime} onChange={(e) => set('downtime', parseInt(e.target.value) || 0)} className="h-9" /></Field>
        </FormGrid>

        <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="min-h-[60px]" /></Field>

        {form.inputQty > 0 && (
          <div className="rounded-lg bg-muted/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold"><Gauge className="h-4 w-4" /> Yield Analysis</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded-lg bg-emerald-500/10"><p className="text-[10px] text-muted-foreground uppercase">Yield</p><p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{yieldPct.toFixed(1)}%</p></div>
              <div className="text-center p-2 rounded-lg bg-rose-500/10"><p className="text-[10px] text-muted-foreground uppercase">Loss</p><p className="text-xl font-semibold text-rose-600 dark:text-rose-400 tabular-nums">{lossPct.toFixed(1)}%</p></div>
            </div>
          </div>
        )}
      </div>
    </FormDrawer>
  )
}
