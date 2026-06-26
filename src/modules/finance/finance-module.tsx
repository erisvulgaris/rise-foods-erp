'use client'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/page-header'
import { KPICard } from '@/shared/components/kpi-card'
import { DataTable, type Column } from '@/shared/components/data-table'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/shared/components/status-badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Banknote, TrendingUp, TrendingDown, Wallet, Building2, Download, Plus, IndianRupee, Receipt } from 'lucide-react'
import { fmtINR, fmtDate, fmtNumber, exportCSV } from '@/shared/lib/format'
import { BarChartCard, AreaChartCard, DonutChart } from '@/shared/components/charts'
import { useExpenses, useBankAccounts, usePNL } from '@/shared/services/mutations'
import { ExpenseDrawer } from './expense-drawer'
import { PaymentDrawer } from './payment-drawer'
import type { Expense } from '@/shared/types'

export function FinanceModule() {
  const { data: pnl } = usePNL()
  const { data: expenses = [], isLoading: loading } = useExpenses()
  const { data: accounts = [] } = useBankAccounts()
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  // Expense by category
  const expByCat = expenses.reduce((acc, e) => {
    const found = acc.find((x) => x.label === e.category)
    if (found) found.value += e.amount
    else acc.push({ label: e.category, value: e.amount })
    return acc
  }, [] as { label: string; value: number }[]).sort((a, b) => b.value - a.value)

  const expenseColumns: Column<Expense>[] = [
    { key: 'category', header: 'Category', sortable: true, cell: (e) => <Badge variant="outline" className="capitalize">{e.category}</Badge> },
    { key: 'subcategory', header: 'Sub', cell: (e) => <span className="text-xs text-muted-foreground">{e.subcategory ?? '—'}</span> },
    { key: 'amount', header: 'Amount', align: 'right', sortable: true, cell: (e) => <span className="tabular-nums font-medium">{fmtINR(e.amount)}</span> },
    { key: 'vendor', header: 'Vendor', cell: (e) => <span className="text-sm">{e.vendor ?? '—'}</span> },
    { key: 'paymentMode', header: 'Mode', align: 'center', cell: (e) => <Badge variant="outline" className="capitalize">{e.paymentMode}</Badge> },
    { key: 'date', header: 'Date', sortable: true, cell: (e) => <span className="text-xs text-muted-foreground">{fmtDate(e.date)}</span> },
    { key: 'status', header: 'Status', align: 'center', cell: (e) => <Badge variant={e.status === 'paid' ? 'success' : 'warning'}>{e.status}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="P&L, cash flow, expenses, bank accounts"
        icon={Banknote}
        accent="success"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV('expenses.csv', expenses as any)}><Download className="h-4 w-4" /> Export</Button>
            <Button variant="outline" size="sm" onClick={() => setPaymentOpen(true)}><Receipt className="h-4 w-4" /> Record Payment</Button>
            <Button size="sm" onClick={() => setExpenseOpen(true)}><Plus className="h-4 w-4" /> Add Expense</Button>
          </div>
        }
      />

      {pnl && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard label="Revenue" value={fmtINR(pnl.revenue, true)} icon={IndianRupee} accent="primary" delta={15.2} deltaLabel="MoM" />
            <KPICard label="Gross Profit" value={fmtINR(pnl.grossProfit, true)} icon={TrendingUp} accent="success" sublabel={`${((pnl.grossProfit / pnl.revenue) * 100).toFixed(1)}% margin`} />
            <KPICard label="Net Profit" value={fmtINR(pnl.netProfit, true)} icon={TrendingUp} accent="violet" sublabel={`${((pnl.netProfit / pnl.revenue) * 100).toFixed(1)}% margin`} />
            <KPICard label="Cash Balance" value={fmtINR(totalBalance, true)} icon={Wallet} accent="info" sublabel={`${accounts.length} accounts`} />
          </div>

          <Card className="p-5 shadow-soft">
            <h3 className="text-sm font-semibold mb-1">Profit & Loss Breakdown</h3>
            <p className="text-xs text-muted-foreground mb-4">Current period</p>
            <div className="grid lg:grid-cols-2 gap-6">
              <BarChartCard
                data={pnl?.breakdown ?? []}
                xKey="label"
                yKeys={[{ key: 'value', color: 'var(--chart-1)' }]}
                height={240}
                formatter={(v) => fmtINR(v, true)}
              />
              <div className="space-y-2">
                {pnl.breakdown.map((b, i) => {
                  const isPositive = b.value > 0 && (b.label === 'Revenue' || b.label === 'Gross Profit' || b.label === 'Net Profit')
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm font-medium">{b.label}</span>
                      <span className={`tabular-nums font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : b.label === 'COGS' || b.label === 'Operating Expenses' ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                        {fmtINR(b.value, true)}
                      </span>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-sm font-semibold">Net Margin</span>
                  <span className="tabular-nums font-bold text-primary">{((pnl.netProfit / pnl.revenue) * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-3">Expenses by Category</h3>
          <DonutChart data={expByCat} height={220} formatter={(v) => fmtINR(v, true)} centerLabel="Total" centerValue={fmtINR(totalExpenses, true)} />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-3">Bank Accounts</h3>
          <div className="space-y-2">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.bank} · {a.accountNo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{fmtINR(a.balance, true)}</p>
                  <Badge variant="outline" className="capitalize">{a.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="mt-4">
          <DataTable data={expenses} columns={expenseColumns} loading={loading} pageSize={12} searchPlaceholder="Search expenses..." />
        </TabsContent>
        <TabsContent value="cashflow" className="mt-4">
          <Card className="p-5 shadow-soft">
            <h3 className="text-sm font-semibold mb-3">Cash Flow Trend (last 30 days)</h3>
            <AreaChartCard
              data={expenses.reduce((acc: any[], e) => {
                const d = new Date(e.date).toISOString().slice(5, 10)
                const found = acc.find((x) => x.date === d)
                if (found) found.outflow += e.amount
                else acc.push({ date: d, outflow: e.amount, inflow: 0 })
                return acc
              }, []).sort((a, b) => a.date.localeCompare(b.date))}
              xKey="date"
              yKeys={[{ key: 'outflow', label: 'Outflow', color: 'var(--chart-5)' }]}
              height={240}
              formatter={(v) => fmtINR(v, true)}
            />
          </Card>
        </TabsContent>
      </Tabs>

      <ExpenseDrawer open={expenseOpen} onOpenChange={setExpenseOpen} />
      <PaymentDrawer open={paymentOpen} onOpenChange={setPaymentOpen} />
    </div>
  )
}
