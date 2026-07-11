'use client'
import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/shared/components/status-badge'
import { Upload, File, Image, X, Paperclip, Eye, Download, Trash2 } from 'lucide-react'
import { cn, fmtRelative } from '@/shared/lib/format'
import { toast } from 'sonner'

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  uploadedAt: string
  uploadedBy?: string
  category?: string
}

interface AttachmentZoneProps {
  entityId: string
  entityType: string
  attachments: Attachment[]
  onUpload: (files: File[]) => void
  onDelete: (id: string) => void
  onPreview?: (attachment: Attachment) => void
  categories?: string[]
  compact?: boolean
}

export function AttachmentZone({ entityId, entityType, attachments, onUpload, onDelete, onPreview, categories = ['Document', 'Image', 'Invoice', 'Other'], compact }: AttachmentZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [showList, setShowList] = useState(!compact)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onUpload(files)
      toast.success(`${files.length} file(s) uploaded`)
    }
  }, [onUpload])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const files: File[] = []
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }
    if (files.length > 0) {
      onUpload(files)
      toast.success(`${files.length} image(s) pasted`)
    }
  }, [onUpload])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    return File
  }

  return (
    <div className="space-y-2" onPaste={handlePaste}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all',
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length > 0) { onUpload(files); toast.success(`${files.length} file(s) uploaded`) }
            e.target.value = ''
          }}
        />
        <Upload className={cn('h-6 w-6 mx-auto mb-1.5', dragOver ? 'text-primary' : 'text-muted-foreground')} />
        <p className="text-xs font-medium">{dragOver ? 'Drop files here' : 'Drag & drop, paste, or click to upload'}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Images, PDFs, Documents · Max 10MB each</p>
      </div>

      {/* Attachment count + toggle */}
      {compact && attachments.length > 0 && (
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowList(!showList)}>
          <Paperclip className="h-3 w-3" /> {attachments.length} attachment(s) {showList ? '▲' : '▼'}
        </Button>
      )}

      {/* List */}
      {showList && attachments.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.type)
            return (
              <div key={att.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/30 transition-colors group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{att.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{formatSize(att.size)}</span>
                    <span>·</span>
                    <span>{fmtRelative(att.uploadedAt)}</span>
                    {att.category && <><span>·</span><Badge variant="outline" className="text-[9px] h-4">{att.category}</Badge></>}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {att.type.startsWith('image/') || att.type === 'application/pdf' ? (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onPreview?.(att)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toast.info('Downloading...')}>
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500" onClick={() => onDelete(att.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
