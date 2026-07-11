'use client'
import { useEffect, useState, useCallback } from 'react'

const DB_NAME = 'rise-foods-erp'
const DB_VERSION = 1
const STORE_QUEUES = 'mutation-queue'
const STORE_DRAFTS = 'drafts'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_QUEUES)) {
        db.createObjectStore(STORE_QUEUES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export interface QueuedMutation {
  id: string
  url: string
  method: 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  timestamp: number
  retries: number
  status: 'pending' | 'processing' | 'failed' | 'synced'
  error?: string
  queryKeysToInvalidate?: string[][]
}

export function useOfflineEngine() {
  const [isOnline, setIsOnline] = useState(true)
  const [queue, setQueue] = useState<QueuedMutation[]>([])
  const [syncing, setSyncing] = useState(false)

  // Monitor network status
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const onOnline = () => { setIsOnline(true); processQueue() }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    loadQueue()
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const loadQueue = async () => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_QUEUES, 'readonly')
      const store = tx.objectStore(STORE_QUEUES)
      const req = store.getAll()
      req.onsuccess = () => setQueue(req.result as QueuedMutation[])
    } catch {}
  }

  const queueMutation = useCallback(async (mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retries' | 'status'>) => {
    const item: QueuedMutation = {
      ...mutation,
      id: `mut-${Date.now()}-${Math.random().toString(36).slice(6)}`,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    }
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_QUEUES, 'readwrite')
      tx.objectStore(STORE_QUEUES).add(item)
      setQueue((q) => [...q, item])
    } catch {}
    return item
  }, [])

  const processQueue = useCallback(async () => {
    if (!navigator.onLine) return
    const pending = queue.filter((m) => m.status === 'pending' || m.status === 'failed')
    if (pending.length === 0) return
    setSyncing(true)
    for (const mutation of pending) {
      try {
        // Mark processing
        await updateMutationStatus(mutation.id, 'processing')
        const res = await fetch(mutation.url, {
          method: mutation.method,
          headers: { 'Content-Type': 'application/json' },
          body: mutation.body ? JSON.stringify(mutation.body) : undefined,
        })
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        await updateMutationStatus(mutation.id, 'synced')
        // Remove from queue after successful sync
        setTimeout(() => removeFromQueue(mutation.id), 2000)
      } catch (e: any) {
        await updateMutationStatus(mutation.id, 'failed', e.message)
      }
    }
    setSyncing(false)
    loadQueue()
  }, [queue])

  const updateMutationStatus = async (id: string, status: QueuedMutation['status'], error?: string) => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_QUEUES, 'readwrite')
      const store = tx.objectStore(STORE_QUEUES)
      const getReq = store.get(id)
      getReq.onsuccess = () => {
        const item = getReq.result
        if (item) {
          item.status = status
          if (error) item.error = error
          if (status === 'failed') item.retries++
          store.put(item)
        }
      }
    } catch {}
    setQueue((q) => q.map((m) => m.id === id ? { ...m, status, error: error ?? m.error } : m))
  }

  const removeFromQueue = async (id: string) => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_QUEUES, 'readwrite')
      tx.objectStore(STORE_QUEUES).delete(id)
    } catch {}
    setQueue((q) => q.filter((m) => m.id !== id))
  }

  const clearQueue = async () => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_QUEUES, 'readwrite')
      tx.objectStore(STORE_QUEUES).clear()
    } catch {}
    setQueue([])
  }

  // Save/load draft
  const saveDraft = useCallback(async (key: string, data: unknown) => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_DRAFTS, 'readwrite')
      tx.objectStore(STORE_DRAFTS).put({ key, data, savedAt: Date.now() })
    } catch {}
  }, [])

  const loadDraft = useCallback(async (key: string): Promise<unknown | null> => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_DRAFTS, 'readonly')
      const req = tx.objectStore(STORE_DRAFTS).get(key)
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result?.data ?? null)
        req.onerror = () => resolve(null)
      })
    } catch { return null }
  }, [])

  const clearDraft = useCallback(async (key: string) => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_DRAFTS, 'readwrite')
      tx.objectStore(STORE_DRAFTS).delete(key)
    } catch {}
  }, [])

  const pendingCount = queue.filter((m) => m.status === 'pending' || m.status === 'failed').length

  return {
    isOnline,
    queue,
    pendingCount,
    syncing,
    queueMutation,
    processQueue,
    clearQueue,
    removeFromQueue,
    saveDraft,
    loadDraft,
    clearDraft,
  }
}
