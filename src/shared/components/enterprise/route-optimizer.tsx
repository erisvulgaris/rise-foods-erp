'use client'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/shared/components/status-badge'
import { Card } from '@/components/ui/card'
import { MapPin, Navigation, Clock, Truck, Zap, Route as RouteIcon, Map as MapIcon, List } from 'lucide-react'
import { cn, fmtDate, fmtRelative } from '@/shared/lib/format'
import { toast } from 'sonner'

export interface DeliveryStop {
  id: string
  customerName: string
  address: string
  area: string
  district: string
  phone: string
  lat?: number
  lng?: number
  orderNo?: string
  orderAmount?: number
  status: 'planned' | 'visited' | 'missed'
  scheduledAt?: string
  visitedAt?: string
}

interface RouteOptimizerProps {
  stops: DeliveryStop[]
  onReorder: (stops: DeliveryStop[]) => void
  onMarkVisited: (id: string) => void
  onMarkMissed: (id: string) => void
  vehicleNo?: string
  driverName?: string
}

export function RouteOptimizer({ stops, onReorder, onMarkVisited, onMarkMissed, vehicleNo, driverName }: RouteOptimizerProps) {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [optimizing, setOptimizing] = useState(false)
  const [optimizedStops, setOptimizedStops] = useState<DeliveryStop[]>(stops)

  const totalAmount = stops.reduce((s, st) => s + (st.orderAmount ?? 0), 0)
  const visitedCount = stops.filter((s) => s.status === 'visited').length
  const missedCount = stops.filter((s) => s.status === 'missed').length

  // Simple route optimization: sort by area grouping (nearest neighbor approximation)
  const optimizeRoute = () => {
    setOptimizing(true)
    setTimeout(() => {
      const unvisited = stops.filter((s) => s.status === 'planned')
      // Group by area, then by district
      const grouped = unvisited.reduce((acc, stop) => {
        const key = `${stop.district}||${stop.area}`
        if (!acc[key]) acc[key] = []
        acc[key].push(stop)
        return acc
      }, {} as Record<string, DeliveryStop[]>)
      const optimized = Object.values(grouped).flat()
      setOptimizedStops(optimized)
      onReorder(optimized)
      setOptimizing(false)
      toast.success(`Route optimized: ${optimized.length} stops across ${Object.keys(grouped).length} areas`)
    }, 500)
  }

  const moveStop = (index: number, direction: 'up' | 'down') => {
    const newStops = [...optimizedStops]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newStops.length) return
    ;[newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]]
    setOptimizedStops(newStops)
    onReorder(newStops)
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] text-muted-foreground uppercase">Total Stops</p>
          </div>
          <p className="text-xl font-bold tabular-nums">{stops.length}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="h-3.5 w-3.5 text-emerald-500" />
            <p className="text-[10px] text-muted-foreground uppercase">Visited</p>
          </div>
          <p className="text-xl font-bold tabular-nums text-emerald-600">{visitedCount}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-[10px] text-muted-foreground uppercase">Remaining</p>
          </div>
          <p className="text-xl font-bold tabular-nums text-amber-600">{stops.length - visitedCount - missedCount}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-3.5 w-3.5 text-violet-500" />
            <p className="text-[10px] text-muted-foreground uppercase">Order Value</p>
          </div>
          <p className="text-xl font-bold tabular-nums">₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </Card>
      </div>

      {/* Vehicle info */}
      {(vehicleNo || driverName) && (
        <Card className="p-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
            <Truck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            {vehicleNo && <p className="text-sm font-medium">{vehicleNo}</p>}
            {driverName && <p className="text-xs text-muted-foreground">Driver: {driverName}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={optimizeRoute} disabled={optimizing}>
            <Zap className="h-3.5 w-3.5" /> {optimizing ? 'Optimizing...' : 'Optimize Route'}
          </Button>
        </Card>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border p-0.5 w-fit">
        <button onClick={() => setView('list')} className={cn('px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5', view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
          <List className="h-3 w-3" /> List View
        </button>
        <button onClick={() => setView('map')} className={cn('px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5', view === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
          <MapIcon className="h-3 w-3" /> Map View
        </button>
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-2">
          {optimizedStops.map((stop, idx) => (
            <Card key={stop.id} className={cn('p-3 transition-all', stop.status === 'visited' && 'opacity-60', stop.status === 'missed' && 'opacity-40 border-rose-500/20')}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0',
                  stop.status === 'visited' ? 'bg-emerald-500 text-white' :
                  stop.status === 'missed' ? 'bg-rose-500 text-white' :
                  'bg-muted text-muted-foreground border'
                )}>
                  {stop.status === 'visited' ? '✓' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{stop.customerName}</p>
                    {stop.orderNo && <Badge variant="outline" className="text-[9px] font-mono">{stop.orderNo}</Badge>}
                    {stop.orderAmount && <Badge variant="success" className="text-[9px]">₹{stop.orderAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {stop.address}, {stop.area}, {stop.district}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">📞 {stop.phone}</p>
                  {stop.visitedAt && <p className="text-[10px] text-emerald-600 mt-0.5">Visited {fmtRelative(stop.visitedAt)}</p>}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {stop.status === 'planned' && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onMarkVisited(stop.id)}>
                        <Navigation className="h-3 w-3" /> Visit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-500" onClick={() => onMarkMissed(stop.id)}>
                        Miss
                      </Button>
                    </>
                  )}
                  <div className="flex gap-0.5">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveStop(idx, 'up')} disabled={idx === 0}>↑</Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveStop(idx, 'down')} disabled={idx === optimizedStops.length - 1}>↓</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {optimizedStops.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No delivery stops scheduled</p>
            </div>
          )}
        </div>
      )}

      {/* Map view (simplified — shows positions on a grid) */}
      {view === 'map' && (
        <Card className="p-4">
          <div className="relative h-80 bg-muted/30 rounded-lg overflow-hidden bg-grid">
            {optimizedStops.map((stop, idx) => {
              // Spread stops in a rough grid based on area/district hash
              const hash = stop.area.charCodeAt(0) + stop.district.charCodeAt(0)
              const x = ((hash * 37) % 80) + 10 + (idx % 3) * 5
              const y = ((hash * 53) % 70) + 15 + (idx % 4) * 5
              return (
                <div
                  key={stop.id}
                  className={cn(
                    'absolute flex items-center justify-center rounded-full text-xs font-bold transition-all cursor-pointer',
                    stop.status === 'visited' ? 'h-6 w-6 bg-emerald-500 text-white' :
                    stop.status === 'missed' ? 'h-6 w-6 bg-rose-500 text-white' :
                    'h-7 w-7 bg-primary text-white ring-2 ring-primary/30'
                  )}
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                  title={`${idx + 1}. ${stop.customerName} — ${stop.area}`}
                >
                  {stop.status === 'visited' ? '✓' : idx + 1}
                </div>
              )
            })}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><RouteIcon className="h-3 w-3" /> {optimizedStops.length} stops</span>
              <span className="bg-background/80 px-2 py-0.5 rounded">OpenStreetMap ready — integrate for live maps</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
