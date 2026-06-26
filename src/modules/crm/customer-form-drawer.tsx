'use client'
import { useState, useEffect } from 'react'
import { FormDrawer, Field, FormGrid } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateCustomer, useUpdateCustomer, useUsers } from '@/shared/services/mutations'
import type { Customer } from '@/shared/types'

interface Props {
  open: boolean
  onOpenChange: (b: boolean) => void
  editing?: Customer | null
}

const empty = {
  businessName: '', ownerName: '', phone: '', alternatePhone: '', email: '',
  gst: '', fssai: '', address: '', district: 'Gorakhpur', area: '', pin: '',
  type: 'retailer' as 'retailer' | 'distributor' | 'horeca' | 'lead',
  salesmanId: '', creditLimit: 15000, creditDays: 15, status: 'lead' as 'lead' | 'active' | 'inactive' | 'blocked',
  notes: '',
}

export function CustomerFormDrawer({ open, onOpenChange, editing }: Props) {
  const { data: users = [] } = useUsers()
  const salesmen = users.filter((u: any) => u.role === 'salesman' || u.role === 'sales_manager')
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (editing) {
      setForm({
        businessName: editing.businessName,
        ownerName: editing.ownerName ?? '',
        phone: editing.phone,
        alternatePhone: editing.alternatePhone ?? '',
        email: editing.email ?? '',
        gst: editing.gst ?? '',
        fssai: editing.fssai ?? '',
        address: editing.address,
        district: editing.district,
        area: editing.area,
        pin: editing.pin ?? '',
        type: editing.type,
        salesmanId: editing.salesmanId ?? '',
        creditLimit: editing.creditLimit,
        creditDays: editing.creditDays,
        status: editing.status,
        notes: editing.notes ?? '',
      })
    } else {
      setForm(empty)
    }
  }, [editing, open])

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, data: form })
    } else {
      await create.mutateAsync(form)
    }
    onOpenChange(false)
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit Customer' : 'Add Customer'}
      description="Customer business details and credit terms"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.businessName || !form.phone || !form.address || create.isPending || update.isPending}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold mb-3">Business Info</h3>
          <FormGrid cols={2}>
            <Field label="Business Name" required>
              <Input value={form.businessName} onChange={(e) => set('businessName', e.target.value)} className="h-9" placeholder="Sharma Kirana Store" />
            </Field>
            <Field label="Owner Name">
              <Input value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} className="h-9" placeholder="Rajesh Sharma" />
            </Field>
            <Field label="Phone" required>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="h-9" placeholder="+91..." />
            </Field>
            <Field label="Alternate Phone">
              <Input value={form.alternatePhone} onChange={(e) => set('alternatePhone', e.target.value)} className="h-9" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="h-9" />
            </Field>
            <Field label="GST">
              <Input value={form.gst} onChange={(e) => set('gst', e.target.value)} className="h-9 font-mono" placeholder="09ABCDE1234F1Z5" />
            </Field>
            <Field label="FSSAI">
              <Input value={form.fssai} onChange={(e) => set('fssai', e.target.value)} className="h-9 font-mono" />
            </Field>
            <Field label="Type">
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="retailer">Retailer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="horeca">HoReCa</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FormGrid>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Address</h3>
          <FormGrid cols={2}>
            <Field label="Address" required>
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} className="h-9" />
            </Field>
            <Field label="Area">
              <Input value={form.area} onChange={(e) => set('area', e.target.value)} className="h-9" placeholder="Civil Lines" />
            </Field>
            <Field label="District">
              <Input value={form.district} onChange={(e) => set('district', e.target.value)} className="h-9" />
            </Field>
            <Field label="PIN">
              <Input value={form.pin} onChange={(e) => set('pin', e.target.value)} className="h-9" />
            </Field>
          </FormGrid>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Credit & Sales</h3>
          <FormGrid cols={3}>
            <Field label="Salesman">
              <Select value={form.salesmanId} onValueChange={(v) => set('salesmanId', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Assign..." /></SelectTrigger>
                <SelectContent>
                  {salesmen.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Credit Limit (₹)">
              <Input type="number" value={form.creditLimit} onChange={(e) => set('creditLimit', parseFloat(e.target.value) || 0)} className="h-9" />
            </Field>
            <Field label="Credit Days">
              <Input type="number" value={form.creditDays} onChange={(e) => set('creditDays', parseInt(e.target.value) || 0)} className="h-9" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FormGrid>
          <div className="mt-3">
            <Field label="Notes">
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="min-h-[60px]" placeholder="Customer preferences, payment history, etc." />
            </Field>
          </div>
        </div>
      </div>
    </FormDrawer>
  )
}
