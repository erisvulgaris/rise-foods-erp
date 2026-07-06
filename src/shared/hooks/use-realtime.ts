'use client'
import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useApp } from '@/shared/lib/store'
import { toast } from 'sonner'
import type { NotificationItem } from '@/shared/types'

const WS_PORT = 3003

export function useRealtimeNotifications() {
  const { user, setSearchOpen } = useApp()
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null)

  useEffect(() => {
    if (!user) return

    // Connect via the gateway with XTransformPort
    const socket = io(`/?XTransformPort=${WS_PORT}`, {
      path: '/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('identify', { id: user.id, role: user.role, name: user.name })
    })

    socket.on('disconnect', () => setConnected(false))
    socket.on('reconnect', () => {
      socket.emit('identify', { id: user.id, role: user.role, name: user.name })
    })

    socket.on('connected', (data: { message: string }) => {
      // Silent welcome
    })

    socket.on('notification', (data: any) => {
      setLatestNotification(data)
      // Show toast
      const sev = data.severity || 'info'
      if (sev === 'critical') {
        toast.error(data.title, { description: data.body })
      } else if (sev === 'warning') {
        toast.warning(data.title, { description: data.body })
      } else if (sev === 'success') {
        toast.success(data.title, { description: data.body })
      } else {
        toast.info(data.title, { description: data.body })
      }
    })

    socket.on('refresh-dashboard', () => {
      // TanStack Query will auto-refetch on window focus or invalidation
      // We could dispatch a custom event here if needed
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  const sendNotification = (data: { type: string; title: string; body?: string; severity?: string; role?: string }) => {
    socketRef.current?.emit('notification', data)
  }

  return { connected, latestNotification, sendNotification }
}
