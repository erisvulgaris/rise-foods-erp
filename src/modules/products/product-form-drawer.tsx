'use client'
import { useState } from 'react'
import { FormDrawer, Field, FormGrid } from '@/shared/components/form-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateProduct, useUpdateProduct } from '@/shared/services/mutations'
import { fmtINR } from '@/shared/lib/format'
import type { Product } from '@/shared/types'

interface Props { open: boolean; onOpenChange: (b: boolean) => void; editing?: Product | null }

const empty = {
  sku: '', barcode: '', name: '', categoryId: '', brand: 'Rise Foods', description: '', hsn: '', gstRate: 5,
  mrp: 0, wholesalePrice: 0, distributorPrice: 0, retailPrice: 0, costPrice: 0,
  packagingSize: '', shelfLifeDays: 540, moq: 1, reorderLevel: 10,
  abcClass: 'C' as 'A' | 'B' | 'C', xyzClass: 'Z' as 'X' | 'Y' | 'Z', status: 'active' as 'active' | 'discontinued' | 'draft',
}

export function ProductFormDrawer({ open, onOpenChange, editing }: Props) {
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const [form, setForm] = useState(editing ? {
    sku: editing.sku, barcode: editing.barcode ?? '', name: editing.name, categoryId: editing.categoryId ?? '',
    brand: editing.brand, description: editing.description ?? '', hsn: editing.hsn ?? '', gstRate: editing.gstRate,
    mrp: editing.mrp, wholesalePrice: editing.wholesalePrice, distributorPrice: editing.distributorPrice,
    retailPrice: editing.retailPrice, costPrice: editing.costPrice, packagingSize: editing.packagingSize ?? '',
    shelfLifeDays: editing.shelfLifeDays, moq: editing.moq, reorderLevel: editing.reorderLevel,
    abcClass: editing.abcClass, xyzClass: editing.xyzClass as any, status: editing.status,
  } : empty)
  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }))
  const margin = form.retailPrice > 0 ? +(((form.retailPrice - form.costPrice) / form.retailPrice) * 100).toFixed(2) : 0

  const handleSubmit = async () => {
    if (editing) { await update.mutateAsync({ id: editing.id, data: form }) }
    else { await create.mutateAsync(form) }
    onOpenChange(false)
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title={editing ? 'Edit Product' : 'Add Product'} description="Product details, pricing tiers, and inventory settings" width="lg"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!form.sku || !form.name || create.isPending || update.isPending}>{editing ? 'Update' : 'Create'}</Button></>}
    >
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold mb-3">Basic Info</h3>
          <FormGrid cols={2}>
            <Field label="SKU" required><Input value={form.sku} onChange={(e) => set('sku', e.target.value)} className="h-9 font-mono" placeholder="RF-TUR-100" /></Field>
            <Field label="Barcode"><Input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} className="h-9 font-mono" /></Field>
            <Field label="Product Name" required><Input value={form.name} onChange={(e) => set('name', e.target.value)} className="h-9" placeholder="Turmeric Powder 100g" /></Field>
            <Field label="Brand"><Input value={form.brand} onChange={(e) => set('brand', e.target.value)} className="h-9" /></Field>
            <Field label="HSN Code"><Input value={form.hsn} onChange={(e) => set('hsn', e.target.value)} className="h-9 font-mono" placeholder="0910" /></Field>
            <Field label="GST Rate (%)"><Input type="number" value={form.gstRate} onChange={(e) => set('gstRate', parseFloat(e.target.value) || 0)} className="h-9" /></Field>
            <Field label="Packaging Size"><Input value={form.packagingSize} onChange={(e) => set('packagingSize', e.target.value)} className="h-9" placeholder="100g, 500g, 1kg" /></Field>
            <Field label="Description"><Input value={form.description} onChange={(e) => set('description', e.target.value)} className="h-9" /></Field>
          </FormGrid>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Pricing Tiers</h3>
          <FormGrid cols={3}>
            <Field label="Cost Price (₹)" required><Input type="number" value={form.costPrice} onChange={(e) => set('costPrice', parseFloat(e.target.value) || 0)} className="h-9" /></Field>
            <Field label="Wholesale (₹)"><Input type="number" value={form.wholesalePrice} onChange={(e) => set('wholesalePrice', parseFloat(e.target.value) || 0)} className="h-9" /></Field>
            <Field label="Distributor (₹)"><Input type="number" value={form.distributorPrice} onChange={(e) => set('distributorPrice', parseFloat(e.target.value) || 0)} className="h-9" /></Field>
            <Field label="Retail (₹)"><Input type="number" value={form.retailPrice} onChange={(e) => set('retailPrice', parseFloat(e.target.value) || 0)} className="h-9" /></Field>
            <Field label="MRP (₹)" required><Input type="number" value={form.mrp} onChange={(e) => set('mrp', parseFloat(e.target.value) || 0)} className="h-9" /></Field>
            <div className="flex items-end"><div className="w-full rounded-lg bg-emerald-500/10 p-2.5 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Margin</p><p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{margin.toFixed(1)}%</p></div></div>
          </FormGrid>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Inventory Settings</h3>
          <FormGrid cols={3}>
            <Field label="Shelf Life (days)"><Input type="number" value={form.shelfLifeDays} onChange={(e) => set('shelfLifeDays', parseInt(e.target.value) || 0)} className="h-9" /></Field>
            <Field label="MOQ"><Input type="number" value={form.moq} onChange={(e) => set('moq', parseInt(e.target.value) || 1)} className="h-9" /></Field>
            <Field label="Reorder Level"><Input type="number" value={form.reorderLevel} onChange={(e) => set('reorderLevel', parseInt(e.target.value) || 0)} className="h-9" /></Field>
            <Field label="ABC Class">
              <Select value={form.abcClass} onValueChange={(v) => set('abcClass', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="A">A — High Value</SelectItem><SelectItem value="B">B — Medium Value</SelectItem><SelectItem value="C">C — Low Value</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="XYZ Class">
              <Select value={form.xyzClass} onValueChange={(v) => set('xyzClass', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="X">X — Stable Demand</SelectItem><SelectItem value="Y">Y — Variable Demand</SelectItem><SelectItem value="Z">Z — Erratic Demand</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="discontinued">Discontinued</SelectItem></SelectContent>
              </Select>
            </Field>
          </FormGrid>
        </div>
        {form.costPrice > 0 && form.retailPrice > 0 && (
          <div className="rounded-lg bg-muted/40 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Cost</span><span className="tabular-nums">{fmtINR(form.costPrice)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Retail</span><span className="tabular-nums">{fmtINR(form.retailPrice)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Profit per unit</span><span className="tabular-nums text-emerald-600">{fmtINR(form.retailPrice - form.costPrice)}</span></div>
            <div className="flex justify-between font-semibold pt-2 border-t"><span>Margin %</span><span className="tabular-nums text-emerald-600">{margin.toFixed(2)}%</span></div>
          </div>
        )}
      </div>
    </FormDrawer>
  )
}
