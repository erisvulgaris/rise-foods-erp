'use client'
import { useApp } from '@/shared/lib/store'
import { AppShell } from '@/shared/components/app-shell'
import { LoginScreen } from '@/modules/auth/login-screen'
import { DashboardModule } from '@/modules/dashboard/dashboard-module'
import { CRMModule } from '@/modules/crm/crm-module'
import { ProductsModule } from '@/modules/products/products-module'
import { InventoryModule } from '@/modules/inventory/inventory-module'
import { ProcurementModule } from '@/modules/procurement/procurement-module'
import { SalesModule } from '@/modules/sales/sales-module'
import { FinanceModule } from '@/modules/finance/finance-module'
import { AnalyticsModule } from '@/modules/analytics/analytics-module'
import { ReportsModule } from '@/modules/reports/reports-module'
import { SettingsModule } from '@/modules/settings/settings-module'
import { ProductionModule, WarehouseModule } from '@/modules/production/production-module'

export default function Home() {
  const { user, activeView } = useApp()

  if (!user) return <LoginScreen />

  return (
    <AppShell>
      {activeView === 'dashboard' && <DashboardModule />}
      {activeView === 'crm' && <CRMModule />}
      {activeView === 'products' && <ProductsModule />}
      {activeView === 'inventory' && <InventoryModule />}
      {activeView === 'procurement' && <ProcurementModule />}
      {activeView === 'sales' && <SalesModule />}
      {activeView === 'finance' && <FinanceModule />}
      {activeView === 'analytics' && <AnalyticsModule />}
      {activeView === 'reports' && <ReportsModule />}
      {activeView === 'settings' && <SettingsModule />}
      {activeView === 'production' && <ProductionModule />}
      {activeView === 'warehouse' && <WarehouseModule />}
    </AppShell>
  )
}
