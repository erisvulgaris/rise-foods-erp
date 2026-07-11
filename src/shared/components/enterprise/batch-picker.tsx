'use client'
import { useState, useMemo } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/shared/components/status-badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, Package, Calendar, MapPin, Check, X, Zap, ShieldAlert } from 'lucide-react'
import { fmtDate, daysUntil, cn, fmtINR } from '@/shared/lib/format'

export interface BatchInfo {
  id: string
  batchNo: string
  quantity: number
  available: number
  reserved: number
  costPrice: number
  mfgDate: string
  expiryDate: string
  receivedAt: string
  warehouseName?: string
  rackCode?: string
  lotNo?: string
  supplierName?: string
}

export interface AllocationResult {
  batchId: string
  batchNo: string
  quantity: number
  expiryDate: string
}

interface BatchPickerProps {
  open: boolean
  onOpenChange: (b: boolean) => void
  batches: BatchInfo[]
  requiredQty: number
  mode: 'FIFO' | 'FEFO' | 'MANUAL'
  onModeChange: (mode: 'FIFO' | 'FEFO' | 'MANUAL') => void
  onConfirm: (allocations: AllocationResult[]) => void
  productName?: string
}

export function BatchPicker({ open, onOpenChange, batches, requiredQty, mode, onModeChange, onConfirm, productName }: BatchPickerProps) {
  const [manualOverrides, setManualOverrides] = useState<Record<string, number>>({})

  // Sort batches based on mode
  const sortedBatches = useMemo(() => {
    const valid = batches.filter((b) => b.available > 0 && daysUntil(b.expiryDate) > 0)
    if (mode === 'FIFO') return [...valid].sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime())
    if (mode === 'FEFO') return [...valid].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    return valid
  }, [batches, mode])

  // Auto-allocate computed via useMemo
  const autoAllocation = useMemo(() => {
    if (mode === 'MANUAL') return {}
    const alloc: Record<string, number> = {}
    let remaining = requiredQty
    for (const batch of sortedBatches) {
      if (remaining <= 0) break
      const take = Math.min(batch.available, remaining)
      alloc[batch.id] = take
      remaining -= take
    }
    return alloc
  }, [sortedBatches, requiredQty, mode])

  // Merge: manual overrides take precedence over auto
  const allocations = mode === 'MANUAL' ? manualOverrides : { ...autoAllocation, ...manualOverrides }
  const totalAllocated = Object.values(allocations).reduce((s, v) => s + v, 0)
  const remaining = requiredQty - totalAllocated
  const isFullyAllocated = remaining <= 0

  const updateAllocation = (batchId: string, qty: number) => {
    const batch = sortedBatches.find((b) => b.id === batchId)
    if (!batch) return
    const clamped = Math.max(0, Math.min(qty, batch.available))
    setManualOverrides((a) => ({ ...a, [batchId]: clamped }))
  }

  const handleConfirm = () => {
    const results: AllocationResult[] = Object.entries(allocations)
      .filter(([_, qty]) => qty > 0)
      .map(([batchId, qty]) => {
        const batch = batches.find((b) => b.id === batchId)!
        return { batchId, batchNo: batch.batchNo, quantity: qty, expiryDate: batch.expiryDate }
      })
    onConfirm(results)
    setManualOverrides({})
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-3xl max-h-[92vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> Batch Allocation
                {productName && <span className="text-muted-foreground font-normal">· {productName}</span>}
              </DrawerTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Required: <strong>{requiredQty}</strong> · Allocated: <strong className={isFullyAllocated ? 'text-emerald-600' : 'text-amber-600'}>{totalAllocated}</strong> · Remaining: <strong className={remaining > 0 ? 'text-rose-600' : ''}>{Math.max(0, remaining)}</strong>
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              {(['FIFO', 'FEFO', 'MANUAL'] as const).map((m) => (
                <button key={m} onClick={() => { onModeChange(m); setManualOverrides({}) }}
                  className={cn('px-3 py-1 text-xs font-medium rounded-md', mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  {m === 'FIFO' ? 'FIFO' : m === 'FEFO' ? 'FEFO' : 'Manual'}
                </button>
              ))}
            </div>
          </div>
        </DrawerHeader>
        <ScrollArea className="flex-1 overflow-y-auto px-4 py-3">
          {sortedBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldAlert className="h-10 w-10 text-rose-500 mb-2" />
              <p className="text-sm font-medium">No valid batches available</p>
              <p className="text-xs text-muted-foreground mt-1">All batches may be expired or out of stock</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedBatches.map((batch, idx) => {
                const days = daysUntil(batch.expiryDate)
                const isNearExpiry = days >= 0 && days <= 30
                const allocated = allocations[batch.id] ?? 0
                const isRecommended = mode !== 'MANUAL' && allocated > 0 && idx === 0
                return (
                  <div key={batch.id} className={cn('rounded-lg border p-3', allocated > 0 && 'border-primary/30 bg-primary/5', isRecommended && 'ring-2 ring-primary/20')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', isNearExpiry ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600')}>
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-mono font-medium">{batch.batchNo}</span>
                            {isRecommended && <Badge variant="success"><Zap className="h-2.5 w-2.5" /> Recommended</Badge>}
                            {isNearExpiry && <Badge variant="warning">Expires in {days}d</Badge>}
                            {batch.lotNo && <Badge variant="outline">Lot: {batch.lotNo}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Mfg: {fmtDate(batch.mfgDate)}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Exp: {fmtDate(batch.expiryDate)}</span>
                            {batch.warehouseName && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {batch.warehouseName}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs">
                            <span>Available: <strong className="tabular-nums">{batch.available}</strong></span>
                            {batch.reserved > 0 && <span className="text-amber-600">Reserved: {batch.reserved}</span>}
                            <span className="text-muted-foreground">Cost: {fmtINR(batch.costPrice)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateAllocation(batch.id, Math.max(0, allocated - 1))}>−</Button>
                          <input type="number" value={allocated} onChange={(e) => updateAllocation(batch.id, parseInt(e.target.value) || 0)} className="h-7 w-14 text-center text-sm border rounded-md px-1 tabular-nums" max={batch.available} min={0} />
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateAllocation(batch.id, Math.min(batch.available, allocated + 1))}>+</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs ml-1" onClick={() => updateAllocation(batch.id, batch.available)}>Max</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        <DrawerFooter className="border-t pt-3 flex-row justify-between items-center">
          <div className="text-sm">
            {isFullyAllocated ? <span className="text-emerald-600 flex items-center gap-1"><Check className="h-4 w-4" /> Fully allocated</span>
              : <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {remaining} units unallocated</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!isFullyAllocated}>Confirm Allocation</Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
