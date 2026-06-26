'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/shared/lib/store'
import { visibleModules, ROLE_LABELS, type ModuleName } from '@/shared/lib/rbac'
import {
  LayoutDashboard, Users, Package, Warehouse, ShoppingCart, Truck, Banknote,
  Factory, BarChart3, FileText, Settings, Menu, Bell, Search, ChevronLeft,
  LogOut, Sparkles, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/shared/components/status-badge'
import { ThemeToggle } from './theme-toggle'
import { SearchPalette } from './search-palette'
import { api } from '@/shared/services/api'
import { fmtRelative } from '@/shared/lib/format'
import type { NotificationItem } from '@/shared/types'
import { cn } from '@/lib/utils'

const NAV: { id: ModuleName; label: string; icon: any; group: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'crm', label: 'CRM', icon: Users, group: 'Sales' },
  { id: 'sales', label: 'Sales', icon: ShoppingCart, group: 'Sales' },
  { id: 'products', label: 'Products', icon: Package, group: 'Catalog' },
  { id: 'inventory', label: 'Inventory', icon: Warehouse, group: 'Catalog' },
  { id: 'procurement', label: 'Procurement', icon: Truck, group: 'Catalog' },
  { id: 'warehouse', label: 'Warehouse', icon: Truck, group: 'Ops' },
  { id: 'production', label: 'Production', icon: Factory, group: 'Ops' },
  { id: 'finance', label: 'Finance', icon: Banknote, group: 'Money' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'Insights' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'Insights' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'System' },
]

const NOTIF_ICONS: Record<string, any> = {
  low_stock: Package, pending_payment: Banknote, new_order: ShoppingCart,
  dispatch: Truck, failed_delivery: Truck, customer_inactive: Users,
  supplier_delay: Truck, inventory_expiry: Warehouse, daily_summary: BarChart3,
  system: Sparkles,
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, activeView, setView, sidebarCollapsed, toggleSidebar, searchOpen, setSearchOpen, notifOpen, setNotifOpen } = useApp()
  const [notifCount, setNotifCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    api.notifications().then((n) => {
      setNotifications(n)
      setNotifCount(n.filter((x) => !x.isRead).length)
    }).catch(() => {})
  }, [notifOpen])

  if (!user) return null
  const allowed = visibleModules(user.role)
  const grouped = NAV.filter((n) => allowed.includes(n.id)).reduce((acc, n) => {
    (acc[n.group] = acc[n.group] || []).push(n)
    return acc
  }, {} as Record<string, typeof NAV>)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        'relative flex flex-col border-r border-sidebar-border bg-sidebar glass-sidebar transition-all duration-300 z-30',
        sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
      )}>
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shrink-0 shadow-soft">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight leading-tight truncate">Rise Foods</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ERP · Operating System</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              {!sidebarCollapsed && (
                <p className="px-2.5 mb-1.5 text-[10px] uppercase tracking-wider font-medium text-muted-foreground/70">{group}</p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = activeView === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all',
                        isActive ? 'nav-item-active shadow-soft' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        sidebarCollapsed && 'justify-center'
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className={cn('h-4 w-4 nav-icon shrink-0', isActive && 'text-sidebar-primary')} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      {!sidebarCollapsed && isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary pulse-soft" />}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="border-t border-sidebar-border p-2">
          <div className={cn('flex items-center gap-2.5 rounded-lg p-2', !sidebarCollapsed && 'bg-sidebar-accent')}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-medium">
                {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{ROLE_LABELS[user.role]}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={logout}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-soft z-40"
          onClick={toggleSidebar}
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', sidebarCollapsed && 'rotate-180')} />
        </Button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-3 h-16 px-4 sm:px-6 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden" onClick={toggleSidebar}>
              <Menu className="h-4 w-4" />
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Gorakhpur, UP</span>
              <span className="h-1 w-1 rounded-full bg-emerald-500 pulse-soft" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex h-9 w-56 justify-start px-3 text-muted-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="text-xs">Search anything...</span>
              <kbd className="ml-auto text-[10px] px-1 py-0.5 rounded border bg-muted">⌘K</kbd>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={() => setSearchOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell className="h-4 w-4" />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-semibold flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Notifications panel */}
      <AnimatePresence>
        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setNotifOpen(false)} />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-screen w-full sm:w-96 bg-card border-l shadow-soft-lg flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-16 border-b">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  {notifCount > 0 && <Badge variant="danger">{notifCount} new</Badge>}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNotifOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium">All caught up</p>
                    <p className="text-xs text-muted-foreground">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = NOTIF_ICONS[n.type] ?? Sparkles
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          'flex gap-3 p-4 border-b hover:bg-muted/40 cursor-pointer transition-colors',
                          !n.isRead && 'bg-primary/5'
                        )}
                        onClick={() => api.markNotifRead(n.id)}
                      >
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                          n.severity === 'critical' ? 'bg-rose-500/10 text-rose-600' :
                          n.severity === 'warning' ? 'bg-amber-500/10 text-amber-600' :
                          n.severity === 'success' ? 'bg-emerald-500/10 text-emerald-600' :
                          'bg-sky-500/10 text-sky-600'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-tight">{n.title}</p>
                          {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{fmtRelative(n.createdAt)}</p>
                        </div>
                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchPalette />
    </div>
  )
}
