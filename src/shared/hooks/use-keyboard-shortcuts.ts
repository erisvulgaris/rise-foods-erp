'use client'
import { useEffect } from 'react'
import { useApp } from '@/shared/lib/store'
import type { ModuleName } from '@/shared/lib/rbac'

const SHORTCUTS: Record<string, ModuleName> = {
  d: 'dashboard', c: 'crm', s: 'sales', p: 'products', i: 'inventory',
  o: 'procurement', w: 'warehouse', f: 'finance', a: 'analytics', r: 'reports', x: 'settings',
  v: 'visits', t: 'tasks', m: 'stock_movements',
}

export function useKeyboardShortcuts() {
  const { setView, setSearchOpen, user } = useApp()

  useEffect(() => {
    if (!user) return
    const handler = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K → search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }
      // Don't trigger on input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if ((e.target as HTMLElement)?.contentEditable === 'true') return

      // Single-key shortcuts (no modifier)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const view = SHORTCUTS[e.key.toLowerCase()]
        if (view) {
          e.preventDefault()
          setView(view)
        }
        // N → new order (go to sales + open drawer)
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault()
          setView('sales')
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [user, setView, setSearchOpen])
}
