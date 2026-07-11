'use client'
import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/shared/components/status-badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Filter, X, Save, Star, Clock, ChevronDown, Plus } from 'lucide-react'
import { cn, fmtDate } from '@/shared/lib/format'

export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'inList' | 'notIn' | 'empty' | 'notEmpty'

export type DatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'financialYear' | 'custom'

export interface FilterCondition {
  id: string
  field: string
  operator: FilterOperator
  value: string | number | [string, string]
}

export interface FilterSet {
  id: string
  name: string
  conditions: FilterCondition[]
  datePreset?: DatePreset
  dateField?: string
  customDateStart?: string
  customDateEnd?: string
  isFavorite?: boolean
  isShared?: boolean
}

export interface FilterField {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'select'
  options?: { value: string; label: string }[]
}

interface FilterBarProps {
  fields: FilterField[]
  filters: FilterSet | null
  onFiltersChange: (filters: FilterSet | null) => void
  storageKey: string
}

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Equals',
  contains: 'Contains',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  greaterThan: 'Greater than',
  lessThan: 'Less than',
  between: 'Between',
  inList: 'In list',
  notIn: 'Not in',
  empty: 'Is empty',
  notEmpty: 'Is not empty',
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'financialYear', label: 'Financial Year' },
  { value: 'custom', label: 'Custom Range' },
]

function getDateRange(preset: DatePreset, customStart?: string, customEnd?: string): [Date, Date] | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (preset) {
    case 'today': return [today, now]
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return [y, y] }
    case 'last7days': { const d = new Date(today); d.setDate(d.getDate() - 7); return [d, now] }
    case 'last30days': { const d = new Date(today); d.setDate(d.getDate() - 30); return [d, now] }
    case 'thisWeek': { const d = new Date(today); d.setDate(d.getDate() - d.getDay()); return [d, now] }
    case 'thisMonth': { return [new Date(now.getFullYear(), now.getMonth(), 1), now] }
    case 'lastMonth': { return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)] }
    case 'thisQuarter': { const q = Math.floor(now.getMonth() / 3); return [new Date(now.getFullYear(), q * 3, 1), now] }
    case 'financialYear': { const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; return [new Date(fy, 3, 1), now] }
    case 'custom': return customStart && customEnd ? [new Date(customStart), new Date(customEnd)] : null
    default: return null
  }
}

export function FilterBar({ fields, filters, onFiltersChange, storageKey }: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [savedFilters, setSavedFilters] = useState<FilterSet[]>([])
  const [showSaved, setShowSaved] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // Load saved filters
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`filters-${storageKey}`)
      if (stored) setSavedFilters(JSON.parse(stored))
    } catch {}
  }, [storageKey])

  const persistFilters = (newFilters: FilterSet[]) => {
    setSavedFilters(newFilters)
    try { localStorage.setItem(`filters-${storageKey}`, JSON.stringify(newFilters)) } catch {}
  }

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: `cond-${Date.now()}`,
      field: fields[0]?.key ?? '',
      operator: 'contains',
      value: '',
    }
    const newFilters: FilterSet = {
      id: filters?.id ?? `filter-${Date.now()}`,
      name: filters?.name ?? 'Custom',
      conditions: [...(filters?.conditions ?? []), newCondition],
      datePreset: filters?.datePreset,
      dateField: filters?.dateField,
    }
    onFiltersChange(newFilters)
  }

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    if (!filters) return
    onFiltersChange({
      ...filters,
      conditions: filters.conditions.map((c) => c.id === id ? { ...c, ...updates } : c),
    })
  }

  const removeCondition = (id: string) => {
    if (!filters) return
    const newConditions = filters.conditions.filter((c) => c.id !== id)
    onFiltersChange(newConditions.length === 0 && !filters.datePreset ? null : { ...filters, conditions: newConditions })
  }

  const setDatePreset = (preset: DatePreset) => {
    onFiltersChange({
      id: filters?.id ?? `filter-${Date.now()}`,
      name: filters?.name ?? 'Custom',
      conditions: filters?.conditions ?? [],
      datePreset: preset === 'custom' ? 'custom' : preset,
      dateField: filters?.dateField ?? 'createdAt',
      customDateStart: filters?.customDateStart,
      customDateEnd: filters?.customDateEnd,
    })
  }

  const saveCurrentFilter = () => {
    if (!filters || !saveName.trim()) return
    const newSet: FilterSet = { ...filters, id: `filter-${Date.now()}`, name: saveName.trim() }
    persistFilters([...savedFilters, newSet])
    setSaveName('')
    setShowSaveDialog(false)
  }

  const loadFilter = (filterSet: FilterSet) => {
    onFiltersChange(filterSet)
    setShowSaved(false)
  }

  const toggleFavorite = (id: string) => {
    persistFilters(savedFilters.map((f) => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f))
  }

  const deleteFilter = (id: string) => {
    persistFilters(savedFilters.filter((f) => f.id !== id))
  }

  const clearAll = () => {
    onFiltersChange(null)
  }

  const activeCount = (filters?.conditions?.length ?? 0) + (filters?.datePreset ? 1 : 0)

  return (
    <div className="space-y-2">
      {/* Quick filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date preset */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {filters?.datePreset ? DATE_PRESETS.find((p) => p.value === filters.datePreset)?.label : 'Date Range'}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-1">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setDatePreset(p.value)}
                  className={cn('w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent', filters?.datePreset === p.value && 'bg-accent font-medium')}
                >
                  {p.label}
                </button>
              ))}
              {filters?.datePreset === 'custom' && (
                <div className="pt-2 border-t space-y-2">
                  <Input type="date" value={filters.customDateStart ?? ''} onChange={(e) => onFiltersChange({ ...filters, customDateStart: e.target.value })} className="h-8 text-xs" />
                  <Input type="date" value={filters.customDateEnd ?? ''} onChange={(e) => onFiltersChange({ ...filters, customDateEnd: e.target.value })} className="h-8 text-xs" />
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Advanced filters toggle */}
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setShowAdvanced(!showAdvanced)}>
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && <Badge variant="primary" className="ml-1 h-4 px-1 text-[10px]">{activeCount}</Badge>}
          <ChevronDown className={cn('h-3 w-3 opacity-50 transition-transform', showAdvanced && 'rotate-180')} />
        </Button>

        {/* Saved filters */}
        <Popover open={showSaved} onOpenChange={setShowSaved}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Star className="h-3.5 w-3.5" /> Saved
              {savedFilters.length > 0 && <span className="text-[10px] text-muted-foreground">({savedFilters.length})</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            {savedFilters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No saved filters yet</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {savedFilters
                  .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
                  .map((f) => (
                    <div key={f.id} className="flex items-center gap-1 group">
                      <button onClick={() => loadFilter(f)} className="flex-1 text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent truncate">
                        {f.name}
                      </button>
                      <button onClick={() => toggleFavorite(f.id)} className={cn('h-6 w-6 rounded flex items-center justify-center hover:bg-muted', f.isFavorite && 'text-amber-400')}>
                        <Star className={cn('h-3 w-3', f.isFavorite && 'fill-current')} />
                      </button>
                      <button onClick={() => deleteFilter(f.id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-rose-500 opacity-0 group-hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Active filter chips */}
        {filters?.conditions?.map((cond) => {
          const field = fields.find((f) => f.key === cond.field)
          return (
            <Badge key={cond.id} variant="info" className="gap-1 h-7 pr-1">
              <span className="text-[10px] opacity-70">{field?.label ?? cond.field}:</span>
              <span className="text-[10px]">{OPERATOR_LABELS[cond.operator]}</span>
              <span className="text-[10px] font-medium max-w-[80px] truncate">{String(cond.value)}</span>
              <button onClick={() => removeCondition(cond.id)} className="h-4 w-4 rounded hover:bg-black/10 flex items-center justify-center">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )
        })}

        {/* Clear all */}
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clearAll}>
            <X className="h-3 w-3" /> Clear all
          </Button>
        )}

        {/* Save current */}
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowSaveDialog(true)}>
            <Save className="h-3 w-3" /> Save
          </Button>
        )}
      </div>

      {/* Advanced filter panel */}
      {showAdvanced && (
        <div className="rounded-lg border bg-card p-3 space-y-2 shadow-soft">
          {filters?.conditions?.map((cond) => {
            const field = fields.find((f) => f.key === cond.field)
            return (
              <div key={cond.id} className="flex items-center gap-2 flex-wrap">
                <Select value={cond.field} onValueChange={(v) => updateCondition(cond.id, { field: v })}>
                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{fields.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={cond.operator} onValueChange={(v) => updateCondition(cond.id, { operator: v as FilterOperator })}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(OPERATOR_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                {cond.operator !== 'empty' && cond.operator !== 'notEmpty' && (
                  <>
                    {cond.operator === 'between' ? (
                      <div className="flex items-center gap-1">
                        <Input value={Array.isArray(cond.value) ? cond.value[0] : ''} onChange={(e) => updateCondition(cond.id, { value: [e.target.value, Array.isArray(cond.value) ? cond.value[1] : ''] })} className="h-8 w-24 text-xs" placeholder="From" />
                        <span className="text-xs text-muted-foreground">—</span>
                        <Input value={Array.isArray(cond.value) ? cond.value[1] : ''} onChange={(e) => updateCondition(cond.id, { value: [Array.isArray(cond.value) ? cond.value[0] : '', e.target.value] })} className="h-8 w-24 text-xs" placeholder="To" />
                      </div>
                    ) : field?.type === 'select' && field.options ? (
                      <Select value={String(cond.value)} onValueChange={(v) => updateCondition(cond.id, { value: v })}>
                        <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{field.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input value={String(cond.value)} onChange={(e) => updateCondition(cond.id, { value: e.target.value })} className="h-8 w-40 text-xs" placeholder="Value" />
                    )}
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => removeCondition(cond.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addCondition}>
            <Plus className="h-3 w-3" /> Add Condition
          </Button>
        </div>
      )}

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="flex items-center gap-2">
          <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Filter name..." className="h-8 w-40 text-xs" autoFocus />
          <Button size="sm" className="h-8 text-xs" onClick={saveCurrentFilter}>Save</Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
        </div>
      )}
    </div>
  )
}

// ─── Filter evaluation utility ───
export function applyFilters<T extends Record<string, any>>(data: T[], filters: FilterSet | null, fields: FilterField[]): T[] {
  if (!filters) return data
  let result = data

  // Date filter
  if (filters.datePreset && filters.dateField) {
    const range = getDateRange(filters.datePreset, filters.customDateStart, filters.customDateEnd)
    if (range) {
      const [start, end] = range
      result = result.filter((row) => {
        const val = row[filters.dateField!]
        if (!val) return false
        const date = new Date(val)
        return date >= start && date <= end
      })
    }
  }

  // Condition filters
  for (const cond of filters.conditions ?? []) {
    const field = fields.find((f) => f.key === cond.field)
    if (!field) continue
    result = result.filter((row) => {
      const val = row[cond.field]
      switch (cond.operator) {
        case 'equals': return String(val ?? '').toLowerCase() === String(cond.value).toLowerCase()
        case 'contains': return String(val ?? '').toLowerCase().includes(String(cond.value).toLowerCase())
        case 'startsWith': return String(val ?? '').toLowerCase().startsWith(String(cond.value).toLowerCase())
        case 'endsWith': return String(val ?? '').toLowerCase().endsWith(String(cond.value).toLowerCase())
        case 'greaterThan': return Number(val) > Number(cond.value)
        case 'lessThan': return Number(val) < Number(cond.value)
        case 'between': return Array.isArray(cond.value) && Number(val) >= Number(cond.value[0]) && Number(val) <= Number(cond.value[1])
        case 'inList': return String(cond.value).split(',').map((s) => s.trim().toLowerCase()).includes(String(val ?? '').toLowerCase())
        case 'notIn': return !String(cond.value).split(',').map((s) => s.trim().toLowerCase()).includes(String(val ?? '').toLowerCase())
        case 'empty': return val == null || val === ''
        case 'notEmpty': return val != null && val !== ''
        default: return true
      }
    })
  }

  return result
}
