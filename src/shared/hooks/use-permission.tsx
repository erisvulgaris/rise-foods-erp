'use client'
import { useApp } from '@/shared/lib/store'
import { can, type ModuleName, type ModulePermission } from '@/shared/lib/rbac'
import type { Role } from '@/shared/types'

/** Hook to check if current user can perform an action on a module */
export function usePermission(module: ModuleName, action: keyof ModulePermission = 'view') {
  const { user } = useApp()
  if (!user) return false
  return can(user.role as Role, module, action)
}

/** Hook returning the current user's role */
export function useRole(): Role | null {
  const { user } = useApp()
  return user?.role as Role ?? null
}

/** Hook returning whether current user is owner or admin (full access) */
export function useIsAdmin(): boolean {
  const role = useRole()
  return role === 'owner' || role === 'admin'
}

/** Component that only renders children if user has permission */
export function Can({ module, action = 'view', children, fallback = null }: {
  module: ModuleName
  action?: keyof ModulePermission
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const allowed = usePermission(module, action)
  return <>{allowed ? children : fallback}</>
}
