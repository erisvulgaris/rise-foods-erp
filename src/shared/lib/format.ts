// ─────────────────────────────────────────────────────────────────────────────
// Formatters & helpers
// ─────────────────────────────────────────────────────────────────────────────

export const fmtINR = (n: number, compact = false): string => {
  if (n == null || isNaN(n)) return '₹0'
  if (compact) {
    if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`
    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`
    return `₹${n.toFixed(0)}`
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export const fmtINR2 = (n: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

export const fmtNumber = (n: number): string => new Intl.NumberFormat('en-IN').format(n)

export const fmtPercent = (n: number, digits = 1): string => `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`

export const fmtDate = (d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}): string => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...opts })
}

export const fmtDateTime = (d: string | Date | null | undefined): string => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const fmtRelative = (d: string | Date | null | undefined): string => {
  if (!d) return 'never'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return 'never'
  const diff = Date.now() - date.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const mon = Math.floor(day / 30)
  if (mon < 12) return `${mon}mo ago`
  return `${Math.floor(mon / 12)}y ago`
}

export const daysUntil = (d: string | Date): number => {
  const date = typeof d === 'string' ? new Date(d) : d
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

export const cn = (...inputs: (string | false | null | undefined)[]) => inputs.filter(Boolean).join(' ')

// Status → color tokens (Tailwind class strings)
export const statusColor = (status: string): { bg: string; text: string; dot: string; label: string } => {
  const map: Record<string, { bg: string; text: string; dot: string; label?: string }> = {
    // order
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    packed: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    dispatched: { bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
    delivered: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    cancelled: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
    returned: { bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
    // payment
    paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    unpaid: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
    partial: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    overdue: { bg: 'bg-rose-600/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-600' },
    // customer
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    inactive: { bg: 'bg-zinc-500/10', text: 'text-zinc-700 dark:text-zinc-400', dot: 'bg-zinc-500' },
    lead: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-500' },
    blocked: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
    // batch
    in_stock: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    expired: { bg: 'bg-rose-600/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-600' },
    damaged: { bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
    empty: { bg: 'bg-zinc-500/10', text: 'text-zinc-700 dark:text-zinc-400', dot: 'bg-zinc-500' },
    // generic
    info: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-500' },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    critical: { bg: 'bg-rose-600/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-600' },
    success: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    missed: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
    planned: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-500' },
    received: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    sent: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-500' },
    draft: { bg: 'bg-zinc-500/10', text: 'text-zinc-700 dark:text-zinc-400', dot: 'bg-zinc-500' },
    closed: { bg: 'bg-zinc-500/10', text: 'text-zinc-700 dark:text-zinc-400', dot: 'bg-zinc-500' },
  }
  const s = map[status.toLowerCase()] ?? map.info
  return { ...s, label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }
}

export const abcColor = (cls: string): string => {
  if (cls === 'A') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
  if (cls === 'B') return 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
  return 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400'
}

export const riskColor = (score: number): string => {
  if (score >= 70) return 'text-rose-600 dark:text-rose-400'
  if (score >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

export const exportCSV = (filename: string, rows: Record<string, unknown>[]) => {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const exportJSON = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Excel (.xlsx) export ───
export const exportXLSX = async (filename: string, rows: Record<string, unknown>[], sheetName = 'Sheet1') => {
  if (!rows.length) return
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(rows)
  // Auto-size columns
  const colWidths = Object.keys(rows[0]).map((key) => {
    const maxLen = Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length))
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) }
  })
  ws['!cols'] = colWidths
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}
