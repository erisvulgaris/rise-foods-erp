// ─────────────────────────────────────────────────────────────────────────────
// RBAC — Role-Based Access Control
// ─────────────────────────────────────────────────────────────────────────────
import type { Role } from '../types'

export interface ModulePermission {
  view: boolean
  create?: boolean
  edit?: boolean
  delete?: boolean
  approve?: boolean
}

export type PermissionMatrix = Record<string, ModulePermission>

const FULL: ModulePermission = { view: true, create: true, edit: true, delete: true, approve: true }
const VIEW: ModulePermission = { view: true }
const EDIT: ModulePermission = { view: true, create: true, edit: true }
const NONE: ModulePermission = { view: false }

export const MODULES = [
  'dashboard', 'crm', 'products', 'inventory', 'procurement', 'sales',
  'finance', 'warehouse', 'production', 'analytics', 'reports', 'settings',
  'visits', 'tasks', 'stock_movements',
] as const
export type ModuleName = (typeof MODULES)[number]

export const RBAC: Record<Role, PermissionMatrix> = {
  owner: Object.fromEntries(MODULES.map((m) => [m, FULL])),
  admin: Object.fromEntries(MODULES.map((m) => [m, FULL])),
  purchase_manager: {
    dashboard: VIEW, crm: VIEW, products: EDIT, inventory: EDIT,
    procurement: FULL, sales: VIEW, finance: VIEW, warehouse: VIEW,
    production: VIEW, analytics: VIEW, reports: VIEW, settings: VIEW,
    visits: VIEW, tasks: VIEW, stock_movements: VIEW,
  },
  warehouse_manager: {
    dashboard: VIEW, crm: NONE, products: VIEW, inventory: FULL,
    procurement: VIEW, sales: VIEW, finance: NONE, warehouse: FULL,
    production: VIEW, analytics: VIEW, reports: VIEW, settings: VIEW,
    visits: NONE, tasks: VIEW, stock_movements: FULL,
  },
  sales_manager: {
    dashboard: VIEW, crm: FULL, products: VIEW, inventory: VIEW,
    procurement: NONE, sales: FULL, finance: VIEW, warehouse: VIEW,
    production: NONE, analytics: FULL, reports: VIEW, settings: VIEW,
    visits: FULL, tasks: FULL, stock_movements: VIEW,
  },
  salesman: {
    dashboard: VIEW, crm: FULL, products: VIEW, inventory: VIEW,
    procurement: NONE, sales: FULL, finance: NONE, warehouse: NONE,
    production: NONE, analytics: VIEW, reports: NONE, settings: VIEW,
    visits: FULL, tasks: FULL, stock_movements: NONE,
  },
  accountant: {
    dashboard: VIEW, crm: VIEW, products: VIEW, inventory: VIEW,
    procurement: VIEW, sales: VIEW, finance: FULL, warehouse: VIEW,
    production: VIEW, analytics: VIEW, reports: FULL, settings: VIEW,
    visits: VIEW, tasks: VIEW, stock_movements: VIEW,
  },
  factory_staff: {
    dashboard: VIEW, crm: NONE, products: VIEW, inventory: VIEW,
    procurement: NONE, sales: NONE, finance: NONE, warehouse: VIEW,
    production: FULL, analytics: NONE, reports: VIEW, settings: VIEW,
    visits: NONE, tasks: VIEW, stock_movements: VIEW,
  },
  delivery_staff: {
    dashboard: VIEW, crm: VIEW, products: NONE, inventory: VIEW,
    procurement: NONE, sales: VIEW, finance: NONE, warehouse: FULL,
    production: NONE, analytics: NONE, reports: VIEW, settings: VIEW,
    visits: VIEW, tasks: VIEW, stock_movements: VIEW,
  },
  retailer: {
    dashboard: VIEW, crm: NONE, products: VIEW, inventory: NONE,
    procurement: NONE, sales: FULL, finance: VIEW, warehouse: NONE,
    production: NONE, analytics: NONE, reports: NONE, settings: VIEW,
    visits: NONE, tasks: NONE, stock_movements: NONE,
  },
  distributor: {
    dashboard: VIEW, crm: NONE, products: VIEW, inventory: NONE,
    procurement: NONE, sales: FULL, finance: VIEW, warehouse: NONE,
    production: NONE, analytics: NONE, reports: NONE, settings: VIEW,
    visits: NONE, tasks: NONE, stock_movements: NONE,
  },
}

export function can(role: Role, module: ModuleName, action: keyof ModulePermission = 'view'): boolean {
  const perm = RBAC[role]?.[module]
  if (!perm) return false
  return Boolean(perm[action])
}

export function visibleModules(role: Role): ModuleName[] {
  return MODULES.filter((m) => can(role, m, 'view'))
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  purchase_manager: 'Purchase Manager',
  warehouse_manager: 'Warehouse Manager',
  sales_manager: 'Sales Manager',
  salesman: 'Salesman',
  accountant: 'Accountant',
  factory_staff: 'Factory Staff',
  delivery_staff: 'Delivery Staff',
  retailer: 'Retailer',
  distributor: 'Distributor',
}
