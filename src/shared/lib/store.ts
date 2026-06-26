'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '../types'
import type { ModuleName } from '../lib/rbac'

export type ViewKey = ModuleName | 'welcome'

interface AppState {
  // Auth
  user: { id: string; email: string; name: string; role: Role; employeeId?: string } | null
  setUser: (u: AppState['user']) => void
  logout: () => void

  // Navigation
  activeView: ViewKey
  setView: (v: ViewKey) => void
  activeCustomerId: string | null
  setActiveCustomer: (id: string | null) => void

  // Theme — handled by next-themes but mirrored for SSR-aware logic
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Global search
  searchOpen: boolean
  setSearchOpen: (b: boolean) => void

  // Notifications
  notifOpen: boolean
  setNotifOpen: (b: boolean) => void
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      logout: () => set({ user: null, activeView: 'welcome' }),

      activeView: 'dashboard',
      setView: (v) => set({ activeView: v, activeCustomerId: null }),
      activeCustomerId: null,
      setActiveCustomer: (id) => set({ activeCustomerId: id }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      searchOpen: false,
      setSearchOpen: (b) => set({ searchOpen: b }),

      notifOpen: false,
      setNotifOpen: (b) => set({ notifOpen: b }),
    }),
    {
      name: 'risefoods-erp',
      partialize: (s) => ({ user: s.user, activeView: s.activeView, sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
)
