'use client'
import { useState } from 'react'
import { FormDrawer, Field, FormGrid } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROLE_LABELS } from '@/shared/lib/rbac'
import type { Role } from '@/shared/types'

const empty = { name: '', email: '', password: '', phone: '', role: 'staff' as Role, employeeId: '', isActive: true }

export function UserFormDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!r.ok) { const err = await r.json(); throw new Error(err.error ?? 'Failed') }
      setForm(empty); onOpenChange(false)
    } catch { } finally { setLoading(false) }
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Add User" description="Create a new system user with role-based access" width="md"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!form.name || !form.email || !form.password || loading}>{loading ? 'Creating...' : 'Create User'}</Button></>}
    >
      <div className="space-y-4">
        <FormGrid cols={2}>
          <Field label="Full Name" required><Input value={form.name} onChange={(e) => set('name', e.target.value)} className="h-9" /></Field>
          <Field label="Email" required><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="h-9" /></Field>
          <Field label="Password" required hint="Min 6 characters"><Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className="h-9" /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="h-9" /></Field>
          <Field label="Employee ID"><Input value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} className="h-9 font-mono" placeholder="RF-012" /></Field>
          <Field label="Role" required>
            <Select value={form.role} onValueChange={(v) => set('role', v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </FormGrid>
      </div>
    </FormDrawer>
  )
}
