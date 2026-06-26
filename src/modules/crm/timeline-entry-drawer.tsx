'use client'
import { useState } from 'react'
import { FormDrawer, Field } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StickyNote, PhoneCall, MapPin, MessageSquare } from 'lucide-react'
import { useAddTimelineEntry } from '@/shared/services/mutations'
import { useApp } from '@/shared/lib/store'

const TYPES = [
  { value: 'note', label: 'Note', icon: StickyNote },
  { value: 'call', label: 'Phone Call', icon: PhoneCall },
  { value: 'visit', label: 'Visit', icon: MapPin },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
]

export function TimelineEntryDrawer({ open, onOpenChange, customerId }: { open: boolean; onOpenChange: (b: boolean) => void; customerId: string }) {
  const { user } = useApp()
  const addEntry = useAddTimelineEntry()
  const [type, setType] = useState('note')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const handleSubmit = async () => {
    if (!title) return
    await addEntry.mutateAsync({
      customerId, type, title, body: body || null,
      createdBy: user?.id,
    })
    setTitle(''); setBody('')
    onOpenChange(false)
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Add Timeline Entry"
      description="Log a note, call, visit, or WhatsApp message"
      width="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title || addEntry.isPending}>Add Entry</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Type">
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${type === t.value ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/40'}`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" placeholder="Brief summary..." />
        </Field>
        <Field label="Details">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[100px]" placeholder="Full notes..." />
        </Field>
      </div>
    </FormDrawer>
  )
}
