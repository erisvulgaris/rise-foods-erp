'use client'
import { useState } from 'react'
import { FormDrawer, Field, FormGrid } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCreateSupplier } from '@/shared/services/mutations'

const empty = {
  name: '', contactPerson: '', phone: '', email: '', gst: '',
  address: '', district: '', rating: 3.5, leadTimeDays: 7,
  paymentTerms: '', notes: '',
}

export function SupplierFormDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const create = useCreateSupplier()
  const [form, setForm] = useState(empty)
  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    await create.mutateAsync(form)
    setForm(empty)
    onOpenChange(false)
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Add Supplier" description="Supplier business details and procurement terms"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!form.name || !form.phone || create.isPending}>{create.isPending ? 'Creating...' : 'Create Supplier'}</Button></>}
    >
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold mb-3">Business Info</h3>
          <FormGrid cols={2}>
            <Field label="Supplier Name" required><Input value={form.name} onChange={(e) => set('name', e.target.value)} className="h-9" placeholder="Erode Turmeric Cooperative" /></Field>
            <Field label="Contact Person"><Input value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} className="h-9" /></Field>
            <Field label="Phone" required><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="h-9" placeholder="+91..." /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="h-9" /></Field>
            <Field label="GST"><Input value={form.gst} onChange={(e) => set('gst', e.target.value)} className="h-9 font-mono" /></Field>
            <Field label="District"><Input value={form.district} onChange={(e) => set('district', e.target.value)} className="h-9" /></Field>
          </FormGrid>
          <div className="mt-3"><Field label="Address"><Textarea value={form.address} onChange={(e) => set('address', e.target.value)} className="min-h-[60px]" /></Field></div>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Procurement Terms</h3>
          <FormGrid cols={3}>
            <Field label="Rating (0–5)"><Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => set('rating', parseFloat(e.target.value) || 0)} className="h-9" /></Field>
            <Field label="Lead Time (days)"><Input type="number" value={form.leadTimeDays} onChange={(e) => set('leadTimeDays', parseInt(e.target.value) || 0)} className="h-9" /></Field>
            <Field label="Payment Terms"><Input value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} className="h-9" placeholder="30 days credit" /></Field>
          </FormGrid>
          <div className="mt-3"><Field label="Notes"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="min-h-[60px]" /></Field></div>
        </div>
      </div>
    </FormDrawer>
  )
}
