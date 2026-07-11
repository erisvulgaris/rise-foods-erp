'use client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/shared/components/status-badge'
import { Search, Plus, Check, X, ChevronUp, ChevronDown, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Fuzzy search ───
function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true
  const q = query.toLowerCase().trim()
  const t = (text ?? '').toLowerCase()
  if (t.includes(q)) return true  // direct substring
  // Fuzzy: all chars of q appear in order in t
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++
  }
  return qi === q.length
}

function fuzzyScore(query: string, text: string): number {
  if (!query) return 0
  const q = query.toLowerCase().trim()
  const t = (text ?? '').toLowerCase()
  if (t.startsWith(q)) return 100 - t.length  // starts-with is best
  if (t.includes(q)) return 50 - t.indexOf(q)
  let qi = 0, score = 0, consecutive = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) { qi++; consecutive++; score += 1 + consecutive }
    else consecutive = 0
  }
  return qi === q.length ? score - 10 : -1
}

export interface EntityOption {
  id: string
  label: string
  sublabel?: string
  searchText?: string  // additional text to search (phone, GST, SKU, etc.)
  badges?: { text: string; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'violet' }[]
  meta?: React.ReactNode  // right-aligned content (price, stock, etc.)
  isFavorite?: boolean
  isRecent?: boolean
  isDisabled?: boolean
  disabledReason?: string
  warning?: string  // yellow warning text
}

export interface EntityPickerProps {
  options: EntityOption[]
  value?: string | null
  onChange: (id: string) => void
  placeholder?: string
  searchPlaceholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  // On-the-fly creation
  canCreate?: boolean
  createLabel?: string
  onCreate?: (query: string) => Promise<EntityOption | null>
  // Recent + favorites
  storageKey?: string  // localStorage key for recents
  // Display
  emptyMessage?: string
  className?: string
  triggerClassName?: string
  // Behavior
  autoFocus?: boolean
  clearable?: boolean
  // Filter
  filterFn?: (option: EntityOption, query: string) => boolean
}

export function EntityPicker({
  options, value, onChange, placeholder = 'Select...', searchPlaceholder = 'Search...',
  label, required, disabled, canCreate, createLabel = 'Create', onCreate,
  storageKey, emptyMessage = 'No results found.', className, triggerClassName,
  autoFocus, clearable = true, filterFn,
}: EntityPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Load recents from localStorage
  const recents = useMemo(() => {
    if (!storageKey) return new Set<string>()
    try {
      const stored = localStorage.getItem(`entity-recents-${storageKey}`)
      return new Set<string>(stored ? JSON.parse(stored) : [])
    } catch { return new Set<string>() }
  }, [storageKey])

  const selected = options.find((o) => o.id === value)

  // Filter + sort options
  const filtered = useMemo(() => {
    let result = options
    if (query.trim()) {
      const scored = options
        .map((o) => {
          const searchText = [o.label, o.sublabel, o.searchText].filter(Boolean).join(' ')
          const customPassed = filterFn ? filterFn(o, query) : false
          const score = fuzzyScore(query, searchText)
          return { option: o, score: Math.max(score, customPassed ? 1 : -1) }
        })
        .filter((x) => x.score >= 0)
        .sort((a, b) => b.score - a.score)
      result = scored.map((x) => x.option)
    }
    // Sort: favorites first, then recents, then alpha
    if (!query.trim()) {
      result = [...result].sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
        const aRecent = recents.has(a.id) ? 1 : 0
        const bRecent = recents.has(b.id) ? 1 : 0
        if (aRecent !== bRecent) return bRecent - aRecent
        return a.label.localeCompare(b.label)
      })
    }
    return result
  }, [options, query, recents, filterFn])

  // Reset highlighted index when filter changes
  useEffect(() => { setHighlightedIndex(0) }, [query])

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [open])

  // Save to recents on select
  const saveRecent = useCallback((id: string) => {
    if (!storageKey) return
    try {
      const stored = localStorage.getItem(`entity-recents-${storageKey}`)
      const arr: string[] = stored ? JSON.parse(stored) : []
      const filtered = arr.filter((x) => x !== id)
      filtered.unshift(id)
      localStorage.setItem(`entity-recents-${storageKey}`, JSON.stringify(filtered.slice(0, 10)))
    } catch {}
  }, [storageKey])

  const handleSelect = (id: string) => {
    const option = options.find((o) => o.id === id)
    if (option?.isDisabled) return
    onChange(id)
    saveRecent(id)
    setOpen(false)
    setQuery('')
  }

  const handleCreate = async () => {
    if (!onCreate || !query.trim()) return
    setCreating(true)
    try {
      const newOption = await onCreate(query.trim())
      if (newOption) {
        handleSelect(newOption.id)
      }
    } finally {
      setCreating(false)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1 + (canCreate && query.trim() ? 1 : 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex < filtered.length) {
        handleSelect(filtered[highlightedIndex].id)
      } else if (canCreate && query.trim()) {
        handleCreate()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      triggerRef.current?.focus()
    }
  }

  const showCreateOption = canCreate && query.trim() && !filtered.some((o) => o.label.toLowerCase() === query.toLowerCase().trim())
  const totalItems = filtered.length + (showCreateOption ? 1 : 0)

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="text-xs font-medium mb-1.5 block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn('w-full justify-between h-9 font-normal', !selected && 'text-muted-foreground', triggerClassName)}
          >
            {selected ? (
              <span className="flex items-center gap-2 min-w-0">
                <span className="truncate">{selected.label}</span>
                {selected.sublabel && <span className="text-xs text-muted-foreground truncate">{selected.sublabel}</span>}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                {placeholder}
              </span>
            )}
            <div className="flex items-center gap-1 shrink-0">
              {selected && clearable && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onChange('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onChange('') } }}
                  className="h-4 w-4 rounded hover:bg-muted flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[400px]" align="start" onKeyDown={handleKeyDown}>
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <CommandInput
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={query}
                onValueChange={setQuery}
                className="flex-1 h-9 border-0 focus:ring-0"
              />
              {canCreate && query.trim() && (
                <kbd className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border bg-muted">↵ create</kbd>
              )}
            </div>
            <CommandList className="max-h-[320px] overflow-y-auto">
              {filtered.length === 0 && !showCreateOption && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                  {canCreate && query.trim() && (
                    <Button size="sm" variant="outline" className="mt-3" onClick={handleCreate} disabled={creating}>
                      <Plus className="h-3 w-3" /> {creating ? 'Creating...' : `${createLabel} "${query.trim()}"`}
                    </Button>
                  )}
                </div>
              )}
              {/* Favorites section */}
              {!query.trim() && filtered.some((o) => o.isFavorite) && (
                <CommandGroup heading="★ Favorites">
                  {filtered.filter((o) => o.isFavorite).slice(0, 5).map((option, idx) => (
                    <EntityOptionRow
                      key={option.id}
                      option={option}
                      index={idx}
                      highlighted={highlightedIndex === idx}
                      onSelect={handleSelect}
                    />
                  ))}
                </CommandGroup>
              )}
              {/* Recents section */}
              {!query.trim() && recents.size > 0 && filtered.some((o) => recents.has(o.id) && !o.isFavorite) && (
                <CommandGroup heading="Recently Used">
                  {filtered.filter((o) => recents.has(o.id) && !o.isFavorite).slice(0, 5).map((option, idx) => {
                    const realIdx = idx + (filtered.filter((o) => o.isFavorite).slice(0, 5).length)
                    return (
                      <EntityOptionRow
                        key={option.id}
                        option={option}
                        index={realIdx}
                        highlighted={highlightedIndex === realIdx}
                        onSelect={handleSelect}
                      />
                    )
                  })}
                </CommandGroup>
              )}
              {/* All results */}
              <CommandGroup heading={query.trim() ? `Results (${filtered.length})` : 'All'}>
                {filtered.map((option, idx) => (
                  <EntityOptionRow
                    key={option.id}
                    option={option}
                    index={idx}
                    highlighted={highlightedIndex === idx}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
              {/* Create option */}
              {showCreateOption && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreate}
                    className="border-t cursor-pointer text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{createLabel} <strong>"{query.trim()}"</strong></span>
                    {creating && <span className="text-xs text-muted-foreground ml-auto">Creating...</span>}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
            {/* Footer with count */}
            {totalItems > 0 && (
              <div className="border-t px-3 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                <span className="flex items-center gap-2">
                  <span>↑↓ navigate</span>
                  <span>↵ select</span>
                  <span>esc close</span>
                </span>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      {selected?.warning && (
        <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">⚠ {selected.warning}</p>
      )}
    </div>
  )
}

function EntityOptionRow({
  option, index, highlighted, onSelect,
}: {
  option: EntityOption
  index: number
  highlighted: boolean
  onSelect: (id: string) => void
}) {
  return (
    <CommandItem
      value={option.id}
      onSelect={() => onSelect(option.id)}
      disabled={option.isDisabled}
      className={cn(
        'py-2 px-3',
        highlighted && 'bg-accent',
        option.isDisabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="flex items-center gap-2 w-full min-w-0">
        {option.isFavorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{option.label}</span>
            {option.badges?.map((b, i) => (
              <Badge key={i} variant={b.variant ?? 'default'} className="text-[9px] px-1 py-0 h-4">{b.text}</Badge>
            ))}
          </div>
          {option.sublabel && <p className="text-xs text-muted-foreground truncate">{option.sublabel}</p>}
          {option.warning && <p className="text-[10px] text-amber-600 truncate">⚠ {option.warning}</p>}
          {option.isDisabled && option.disabledReason && <p className="text-[10px] text-rose-600 truncate">{option.disabledReason}</p>}
        </div>
        {option.meta && <div className="shrink-0 text-right">{option.meta}</div>}
        <Check className={cn('h-3 w-3 shrink-0', highlighted ? 'opacity-100' : 'opacity-0')} />
      </div>
    </CommandItem>
  )
}

// ─── Preset: Customer Picker ───
export function CustomerPicker({ customers, value, onChange, onCreate, storageKey = 'customers' }: {
  customers: any[]
  value?: string | null
  onChange: (id: string) => void
  onCreate?: (query: string) => Promise<EntityOption | null>
}) {
  const options: EntityOption[] = customers.map((c) => {
    const creditUtil = c.creditLimit > 0 ? (c.outstanding / c.creditLimit) * 100 : 0
    const isBlocked = c.status === 'blocked'
    const creditExceeded = c.outstanding > c.creditLimit && c.creditLimit > 0
    return {
      id: c.id,
      label: c.businessName,
      sublabel: `${c.area}, ${c.district} · ${c.phone}`,
      searchText: `${c.businessName} ${c.ownerName ?? ''} ${c.phone} ${c.gst ?? ''} ${c.area} ${c.district}`,
      badges: [
        { text: c.type, variant: c.type === 'distributor' ? 'violet' : c.type === 'lead' ? 'info' : 'default' },
        ...(creditExceeded ? [{ text: 'CREDIT EXCEEDED', variant: 'danger' as const }] : []),
        ...(isBlocked ? [{ text: 'BLOCKED', variant: 'danger' as const }] : []),
      ],
      meta: (
        <div className="text-right">
          <p className={cn('text-xs font-medium tabular-nums', c.outstanding > 0 ? 'text-rose-600' : 'text-emerald-600')}>
            ₹{c.outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-muted-foreground">of ₹{c.creditLimit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
      ),
      isDisabled: isBlocked,
      disabledReason: isBlocked ? 'Customer is blocked — cannot place orders' : undefined,
      warning: creditExceeded ? `Credit exceeded by ₹${(c.outstanding - c.creditLimit).toLocaleString('en-IN')}` : undefined,
    }
  })

  return (
    <EntityPicker
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Select customer..."
      searchPlaceholder="Search by name, phone, GST, area..."
      canCreate={!!onCreate}
      createLabel="Create Customer"
      onCreate={onCreate}
      storageKey={storageKey}
      emptyMessage="No customers found."
      clearable
    />
  )
}

// ─── Preset: Product Picker ───
export function ProductPicker({ products, inventory, value, onChange, onCreate, excludeIds = [], warehouseId, storageKey = 'products' }: {
  products: any[]
  inventory?: any[]
  value?: string | null
  onChange: (id: string) => void
  onCreate?: (query: string) => Promise<EntityOption | null>
  excludeIds?: string[]
  warehouseId?: string
  storageKey?: string
}) {
  const options: EntityOption[] = products
    .filter((p) => !excludeIds.includes(p.id))
    .map((p) => {
      const inv = inventory?.find((i) => i.productId === p.id && (!warehouseId || i.warehouseId === warehouseId))
      const stock = inv?.currentStock ?? 0
      const isLowStock = stock <= p.reorderLevel
      const isOutOfStock = stock === 0
      const isDiscontinued = p.status === 'discontinued'
      const margin = p.marginPercent
      return {
        id: p.id,
        label: p.name,
        sublabel: `${p.sku} · ${p.packagingSize ?? ''} · ₹${p.mrp} MRP`,
        searchText: `${p.name} ${p.sku} ${p.barcode ?? ''} ${p.hsn ?? ''} ${p.brand}`,
        badges: [
          { text: p.abcClass, variant: p.abcClass === 'A' ? 'success' : p.abcClass === 'B' ? 'warning' : 'default' },
          ...(isOutOfStock ? [{ text: 'OUT OF STOCK', variant: 'danger' as const }] : []),
          ...(isLowStock && !isOutOfStock ? [{ text: 'LOW STOCK', variant: 'warning' as const }] : []),
          ...(isDiscontinued ? [{ text: 'DISCONTINUED', variant: 'danger' as const }] : []),
        ],
        meta: (
          <div className="text-right">
            <p className="text-xs font-medium tabular-nums">{stock} units</p>
            <p className="text-[10px] text-muted-foreground">WS: ₹{p.wholesalePrice}</p>
            <p className="text-[10px] text-emerald-600">{margin.toFixed(0)}% margin</p>
          </div>
        ),
        isDisabled: isOutOfStock || isDiscontinued,
        disabledReason: isOutOfStock ? 'Out of stock' : isDiscontinued ? 'Discontinued' : undefined,
      }
    })

  return (
    <EntityPicker
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Select product..."
      searchPlaceholder="Search by name, SKU, barcode, HSN..."
      canCreate={!!onCreate}
      createLabel="Create Product"
      onCreate={onCreate}
      storageKey={storageKey}
      emptyMessage="No products found."
      clearable
    />
  )
}

// ─── Preset: Supplier Picker ───
export function SupplierPicker({ suppliers, value, onChange, onCreate, storageKey = 'suppliers' }: {
  suppliers: any[]
  value?: string | null
  onChange: (id: string) => void
  onCreate?: (query: string) => Promise<EntityOption | null>
}) {
  const options: EntityOption[] = suppliers.map((s) => ({
    id: s.id,
    label: s.name,
    sublabel: `${s.district} · ${s.phone} · Lead: ${s.leadTimeDays}d`,
    searchText: `${s.name} ${s.contactPerson ?? ''} ${s.phone} ${s.gst ?? ''} ${s.district}`,
    badges: [
      { text: `★ ${s.rating.toFixed(1)}`, variant: s.rating >= 4 ? 'success' : s.rating >= 3 ? 'warning' : 'danger' },
      ...(s.status === 'blocked' ? [{ text: 'BLOCKED', variant: 'danger' as const }] : []),
    ],
    meta: (
      <div className="text-right">
        <p className="text-xs font-medium">₹{s.totalPurchased.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        <p className="text-[10px] text-muted-foreground">total purchased</p>
      </div>
    ),
    isDisabled: s.status === 'blocked',
    disabledReason: s.status === 'blocked' ? 'Supplier is blocked' : undefined,
  }))

  return (
    <EntityPicker
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Select supplier..."
      searchPlaceholder="Search by name, phone, GST, district..."
      canCreate={!!onCreate}
      createLabel="Create Supplier"
      onCreate={onCreate}
      storageKey={storageKey}
      clearable
    />
  )
}
