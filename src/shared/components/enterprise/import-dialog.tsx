'use client'
import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/shared/components/status-badge'
import { FormDrawer, Field } from '@/shared/components/form-drawer'
import { Upload, FileSpreadsheet, Check, X, AlertTriangle, Download, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface ImportColumn {
  sourceHeader: string
  targetField: string
  sampleValue?: string
  isRequired?: boolean
  isValid?: boolean
}

export interface ImportResult {
  total: number
  success: number
  failed: number
  errors: { row: number; field: string; message: string }[]
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (b: boolean) => void
  title: string
  targetFields: { key: string; label: string; required?: boolean; type?: 'string' | 'number' | 'date' }[]
  onImport: (rows: Record<string, unknown>[]) => Promise<ImportResult>
  templateUrl?: string
}

export function ImportDialog({ open, onOpenChange, title, targetFields, onImport, templateUrl }: ImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'result'>('upload')
  const [rawData, setRawData] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<ImportColumn[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      if (json.length === 0) { toast.error('File is empty'); return }
      const fileHeaders = Object.keys(json[0])
      setHeaders(fileHeaders)
      setRawData(json)
      // Auto-map by matching headers to target fields
      const autoMapped: ImportColumn[] = fileHeaders.map((h) => {
        const match = targetFields.find((f) => f.key.toLowerCase() === h.toLowerCase().replace(/\s+/g, '_') || f.label.toLowerCase() === h.toLowerCase())
        return { sourceHeader: h, targetField: match?.key ?? '', sampleValue: json[0][h], isRequired: match?.required, isValid: !!match }
      })
      setMappings(autoMapped)
      setStep('map')
      toast.success(`${json.length} rows loaded from ${file.name}`)
    } catch (e: any) {
      toast.error(`Failed to parse file: ${e.message}`)
    }
  }, [targetFields])

  const updateMapping = (sourceHeader: string, targetField: string) => {
    setMappings((m) => m.map((col) => col.sourceHeader === sourceHeader ? { ...col, targetField, isValid: targetField !== '' } : col))
  }

  const mappedFields = mappings.filter((m) => m.targetField).map((m) => m.targetField)
  const missingRequired = targetFields.filter((f) => f.required && !mappedFields.includes(f.key))

  const handleImport = async () => {
    setImporting(true)
    setStep('result')
    try {
      // Transform data using mappings
      const transformed: Record<string, unknown>[] = rawData.map((row) => {
        const obj: Record<string, unknown> = {}
        for (const mapping of mappings) {
          if (mapping.targetField) {
            const field = targetFields.find((f) => f.key === mapping.targetField)
            let val: unknown = row[mapping.sourceHeader]
            if (field?.type === 'number') val = Number(val) || 0
            if (field?.type === 'date') val = new Date(val as string).toISOString()
            obj[mapping.targetField] = val
          }
        }
        return obj
      })
      const res = await onImport(transformed)
      setResult(res)
      if (res.failed === 0) toast.success(`All ${res.success} records imported successfully`)
      else toast.warning(`${res.success} imported, ${res.failed} failed`)
    } catch (e: any) {
      toast.error(`Import failed: ${e.message}`)
      setResult({ total: 0, success: 0, failed: 1, errors: [{ row: 0, field: 'general', message: e.message }] })
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setStep('upload')
    setRawData([])
    setHeaders([])
    setMappings([])
    setResult(null)
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={(b) => { if (!b) reset(); onOpenChange(b) }}
      title={`Import ${title}`}
      description="Upload Excel/CSV file, map columns, and import"
      width="lg"
      footer={
        <>
          {step === 'map' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={() => setStep('preview')} disabled={missingRequired.length > 0}>
                {missingRequired.length > 0 ? `Missing: ${missingRequired.map((f) => f.label).join(', ')}` : 'Preview'} <ChevronRight className="h-3 w-3" />
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('map')}>Back</Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? 'Importing...' : `Import ${rawData.length} rows`}
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={() => { reset(); onOpenChange(false) }}>Done</Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border-2 border-dashed p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
              <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Drop Excel/CSV file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .xls, .csv · Max 10,000 rows</p>
            </div>
            {templateUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(templateUrl, '_blank')}>
                <Download className="h-3 w-3" /> Download Template
              </Button>
            )}
            <div className="rounded-lg bg-muted/40 p-3 text-xs">
              <p className="font-medium mb-1">Required Fields:</p>
              <ul className="space-y-0.5 text-muted-foreground">
                {targetFields.map((f) => (
                  <li key={f.key}>• {f.label} {f.required && <span className="text-rose-500">*</span>} {f.type && f.type !== 'string' && <span className="text-muted-foreground">({f.type})</span>}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Step: Map */}
        {step === 'map' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Map Columns</p>
              <Badge variant="info">{rawData.length} rows detected</Badge>
            </div>
            <div className="space-y-2">
              {mappings.map((col) => (
                <div key={col.sourceHeader} className="flex items-center gap-2 p-2 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{col.sourceHeader}</p>
                    <p className="text-[10px] text-muted-foreground truncate">Sample: {col.sampleValue || '—'}</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <select
                    value={col.targetField}
                    onChange={(e) => updateMapping(col.sourceHeader, e.target.value)}
                    className="h-8 text-xs border rounded-md px-2 flex-1 max-w-[160px]"
                  >
                    <option value="">— Skip —</option>
                    {targetFields.map((f) => (
                      <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>
                    ))}
                  </select>
                  {col.targetField ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Preview (first 5 rows)</p>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    {mappings.filter((m) => m.targetField).map((m) => (
                      <th key={m.sourceHeader} className="px-2 py-1.5 text-left font-medium">{targetFields.find((f) => f.key === m.targetField)?.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t">
                      {mappings.filter((m) => m.targetField).map((m) => (
                        <td key={m.sourceHeader} className="px-2 py-1.5 truncate max-w-[120px]">{row[m.sourceHeader]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">Showing 5 of {rawData.length} rows. All {rawData.length} will be imported.</p>
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && (
          <div className="space-y-4">
            {importing ? (
              <div className="flex flex-col items-center py-12">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Importing {rawData.length} records...</p>
              </div>
            ) : result ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold tabular-nums">{result.total}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center bg-emerald-500/5 border-emerald-500/20">
                    <p className="text-2xl font-bold tabular-nums text-emerald-600">{result.success}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Success</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center bg-rose-500/5 border-rose-500/20">
                    <p className="text-2xl font-bold tabular-nums text-rose-600">{result.failed}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Failed</p>
                  </div>
                </div>
                {result.errors.length > 0 && (
                  <div className="rounded-lg border max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 border-b bg-muted/40 text-xs font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" /> Errors ({result.errors.length})
                    </div>
                    <div className="divide-y">
                      {result.errors.slice(0, 20).map((err, i) => (
                        <div key={i} className="px-3 py-1.5 text-xs">
                          <span className="font-medium text-rose-600">Row {err.row}</span>
                          <span className="text-muted-foreground"> · {err.field}: </span>
                          <span>{err.message}</span>
                        </div>
                      ))}
                      {result.errors.length > 20 && <div className="px-3 py-1.5 text-xs text-muted-foreground">...and {result.errors.length - 20} more</div>}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </FormDrawer>
  )
}
