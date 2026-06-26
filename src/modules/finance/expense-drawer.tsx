'use client'
import { useState } from 'react'
import { FormDrawer, Field, FormGrid } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAddExpense } from '@/shared/services/mutations'
import { useApp } from '@/shared/lib/store'

const CATEGORIES = ['rent', 'salary', 'utility', 'transport', 'marketing', 'packaging', 'cogs', 'misc']
const SUBCATS: Record<string, string[]> = {
  rent: ['warehouse', 'office', 'shop'],
  salary: ['staff', 'operator', 'salesman', 'delivery'],
  utility: ['electricity', 'water', 'internet', 'phone'],
  transport: ['fuel', 'maintenance', 'freight'],
  marketing: ['flyers', 'social', 'promo', 'signage'],
  packaging: ['pouches', 'labels', 'cartons', 'tape'],
  cogs: ['raw_material', 'grinding', 'processing'],
  misc: ['tea', 'stationery', 'bank_charges', 'other'],
}

export function ExpenseDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { user } = useApp()
  const addExpense = useAddExpense()
  const [category, setCategory] = useState('misc')
  const [subcategory, setSubcategory] = useState('')
  const [amount, setAmount] = useState(0)
  const [vendor, setVendor] = useState('')
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank' | 'cheque'>('cash')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  const handleSubmit = async () => {
    if (amount <= 0) return
    await addExpense.mutateAsync({
      category, subcategory: subcategory || null, amount,
      vendor: vendor || null, paymentMode, date,
      status: 'paid', note: note || null,
      createdBy: user?.id,
    })
    setAmount(0); setVendor(''); setNote('')
    onOpenChange(false)
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Add Expense"
      description="Record a business expense — auto-creates cash outflow entry"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={amount <= 0 || addExpense.isPending}>
            {addExpense.isPending ? 'Saving...' : 'Save Expense'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormGrid cols={2}>
          <Field label="Category">
            <Select value={category} onValueChange={(v) => { setCategory(v); setSubcategory('') }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subcategory">
            <Select value={subcategory} onValueChange={setSubcategory}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Optional..." /></SelectTrigger>
              <SelectContent>
                {(SUBCATS[category] ?? []).map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Amount (₹)" required>
            <Input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="h-9" />
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
          </Field>
          <Field label="Vendor">
            <Input value={vendor} onChange={(e) => setVendor(e.target.value)} className="h-9" />
          </Field>
          <Field label="Payment Mode">
            <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FormGrid>
        <Field label="Note">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" />
        </Field>
      </div>
    </FormDrawer>
  )
}
