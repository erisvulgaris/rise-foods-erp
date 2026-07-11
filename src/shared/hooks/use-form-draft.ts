'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Autosave form drafts to localStorage.
 * Restores on mount, saves on change (debounced).
 */
export function useFormDraft<T>(key: string, initial: T, debounceMs = 1000) {
  // Lazy initialize from localStorage (no effect, no setState cascade)
  const [data, setData] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const stored = localStorage.getItem(`draft-${key}`)
      if (stored) return { ...initial, ...JSON.parse(stored) }
    } catch {}
    return initial
  })
  const timerRef = useRef<NodeJS.Timeout>()
  const [restored] = useState(true)

  // Autosave (debounced)
  useEffect(() => {
    if (!restored) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`draft-${key}`, JSON.stringify(data))
      } catch {}
    }, debounceMs) as any
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [data, key, restored, debounceMs])

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(`draft-${key}`) } catch {}
    setData(initial)
  }, [key, initial])

  return { data, setData, hasDraft: true, clearDraft, restored }
}
