'use client'
import { useState, useEffect } from 'react'
import { Wifi, WifiOff, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); setShowBanner(false); toast.success('Back online — syncing data') }
    const onOffline = () => { setIsOnline(false); setShowBanner(true); toast.warning('You are offline — changes will be queued') }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (isOnline && !showBanner) return null

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
          <CloudOff className="h-4 w-4" />
          <span>Offline mode — changes will sync when reconnected</span>
        </div>
      )}
    </>
  )
}

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', isOnline ? 'text-emerald-600' : 'text-amber-600')}>
      {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {isOnline ? 'Online' : 'Offline'}
    </div>
  )
}
