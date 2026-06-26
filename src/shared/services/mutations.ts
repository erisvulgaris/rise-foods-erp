'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { toast } from 'sonner'

// ─── Query hooks ───
export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: api.dashboard })
export const useCustomers = (q?: string) => useQuery({ queryKey: ['customers', q], queryFn: () => api.customers(q) })
export const useCustomer = (id: string | null) => useQuery({ queryKey: ['customer', id], queryFn: () => api.customer(id!), enabled: !!id })
export const useCustomerTimeline = (id: string | null) => useQuery({ queryKey: ['customer-timeline', id], queryFn: () => api.customerTimeline(id!), enabled: !!id })
export const useCustomerOrders = (id: string | null) => useQuery({ queryKey: ['customer-orders', id], queryFn: () => api.customerOrders(id!), enabled: !!id })
export const useProducts = () => useQuery({ queryKey: ['products'], queryFn: api.products })
export const useInventory = () => useQuery({ queryKey: ['inventory'], queryFn: api.inventory })
export const useBatches = () => useQuery({ queryKey: ['batches'], queryFn: api.batches })
export const useSuppliers = () => useQuery({ queryKey: ['suppliers'], queryFn: api.suppliers })
export const usePurchaseOrders = () => useQuery({ queryKey: ['pos'], queryFn: api.purchaseOrders })
export const useSalesOrders = () => useQuery({ queryKey: ['sales-orders'], queryFn: api.salesOrders })
export const useInvoices = () => useQuery({ queryKey: ['invoices'], queryFn: api.invoices })
export const usePayments = () => useQuery({ queryKey: ['payments'], queryFn: api.payments })
export const useExpenses = () => useQuery({ queryKey: ['expenses'], queryFn: api.expenses })
export const useBankAccounts = () => useQuery({ queryKey: ['bank-accounts'], queryFn: api.bankAccounts })
export const usePNL = () => useQuery({ queryKey: ['pnl'], queryFn: api.pnl })
export const useProductionBatches = () => useQuery({ queryKey: ['production'], queryFn: api.productionBatches })
export const useInsights = () => useQuery({ queryKey: ['insights'], queryFn: api.insights })
export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: api.notifications })
export const useUsers = () => useQuery({ queryKey: ['users'], queryFn: api.users })
export const useAnalytics = () => useQuery({ queryKey: ['analytics'], queryFn: api.analytics })
export const useAuditLog = () => useQuery({ queryKey: ['audit'], queryFn: api.auditLog })
export const useReorderSuggestions = () => useQuery({ queryKey: ['reorder-suggestions'], queryFn: async () => {
  const r = await fetch('/api/reorder-suggestions')
  return r.json()
} })

// ─── Mutation helpers ───
async function postJSON(url: string, body: unknown) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  return r.json()
}
async function putJSON(url: string, body: unknown) {
  const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  return r.json()
}
async function deleteJSON(url: string) {
  const r = await fetch(url, { method: 'DELETE' })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  return r.json()
}

// ─── Mutation hooks ───
export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => postJSON('/api/customers', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Customer created') },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => putJSON(`/api/customers/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); qc.invalidateQueries({ queryKey: ['customer'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Customer updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteJSON(`/api/customers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Customer deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => postJSON('/api/products', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Product created') },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => putJSON(`/api/products/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Product updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => postJSON('/api/sales/orders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Order created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAdvanceOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'advance' | 'cancel' | 'reopen' }) => postJSON(`/api/sales/orders/${id}/advance`, { action }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['customer-orders'] })
      toast.success(vars.action === 'cancel' ? 'Order cancelled' : 'Order advanced')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => postJSON('/api/sales/payments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['sales-orders'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Payment recorded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAddExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => postJSON('/api/finance/expenses', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Expense added') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => postJSON('/api/suppliers', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Supplier created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreatePO() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => postJSON('/api/procurement/orders', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pos'] }); qc.invalidateQueries({ queryKey: ['inventory'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Purchase order created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => postJSON(`/api/inventory/${id}/adjust`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Stock adjusted') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAddTimelineEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => postJSON('/api/timeline', data),
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: ['customer-timeline'] }); if (vars.customerId) qc.invalidateQueries({ queryKey: ['customer-timeline', vars.customerId] }); toast.success('Timeline entry added') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useLogVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => postJSON('/api/visits', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer-timeline'] }); toast.success('Visit logged') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => postJSON('/api/tasks', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreateProductionBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => postJSON('/api/production', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['production'] }); toast.success('Production batch created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useGenerateInsights() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => postJSON('/api/insights/generate', {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['insights'] }); toast.success('AI insights regenerated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useGenerateNotifications() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => postJSON('/api/notifications/generate', {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Notifications refreshed') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useMarkNotifRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/notifications/${id}/read`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
