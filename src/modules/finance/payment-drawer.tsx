'use client'
import { useState } from 'react'
import { FormDrawer, Field, FormGrid } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/shared/components/status-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { IndianRupee, User, Search } from 'lucide-react'
import { fmtINR } from '@/shared/lib/format'
import { useCustomers, useRecordPayment } from '@/shared/services/mutations'
import { useApp } from '@/shared/lib/store'
import { toast } from 'sonner'

export function PaymentDrawer({ open, onOpenChange, presetCustomerId }: { open: boolean; onOpenChange: (b: boolean) => void; presetCustomerId?: string }) {
  const { user } = useApp()
  const { data: customers = [] } = useCustomers()
  const recordPayment = useRecordPayment()
  const [customerId, setCustomerId] = useState(presetCustomerId ?? '')
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<'cash' | 'upi' | 'bank' | 'cheque' | 'credit'>('cash')
  const [reference, setReference] = useState('')
  const [search, setSearch] = useState('')

  const customer = customers.find((c) => c.id === customerId)
  const filtered = search ? customers.filter((c) => c.businessName.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)) : customers

  const handleSubmit = async () => {
    if (!customerId || amount <= 0) { toast.error('Customer and amount are required'); return }
    await recordPayment.mutateAsync({
      customerId, amount, method, reference: reference || null,
      collectedBy: user?.id,
    })
    setCustomerId(''); setAmount(0); setReference('')
    onOpenChange(false)
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Record Payment"
      description="Log a customer payment — auto-updates outstanding balance"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!customerId || amount <= 0 || recordPayment.isPending}>
            <IndianRupee className="h-4 w-4" /> {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Customer" required>
          {customer ? (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
              <div>
                <p className="text-sm font-medium">{customer.businessName}</p>
                <p className="text-xs text-muted-foreground">{customer.phone} · {customer.area}</p>
              </div>
              <div className="text-right">
                <Badge variant={customer.outstanding > 0 ? 'danger' : 'success'}>{fmtINR(customer.outstanding, true)} due</Badge>
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
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="Search customers..." value={search} onValueChange={setSearch} />
                  <CommandList>
                    <CommandEmpty>No customers found.</CommandEmpty>
                    <CommandGroup>
                      {filtered.slice(0, 20).map((c) => (
                        <CommandItem key={c.id} onSelect={() => setCustomerId(c.id)}>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{c.businessName}</p>
                            <p className="text-xs text-muted-foreground">{c.phone} · Outstanding {fmtINR(c.outstanding, true)}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </Field>

        <FormGrid cols={2}>
          <Field label="Amount (₹)" required>
            <Input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="h-9" placeholder="0.00" />
          </Field>
          <Field label="Method">
            <Select value={method} onValueChange={(v: any) => setMethod(v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FormGrid>
        <Field label="Reference">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} className="h-9" placeholder="UTR / Cheque no. / Receipt no." />
        </Field>

        {customer && amount > 0 && (
          <div className="rounded-lg bg-muted/40 p-4 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Current Outstanding</span><span className="tabular-nums">{fmtINR(customer.outstanding)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span className="tabular-nums text-emerald-600">-{fmtINR(amount)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t">
              <span>New Outstanding</span>
              <span className="tabular-nums">{fmtINR(Math.max(0, customer.outstanding - amount))}</span>
            </div>
          </div>
        )}
      </div>
    </FormDrawer>
  )
}
