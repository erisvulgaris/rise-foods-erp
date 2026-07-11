'use client'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { FileText, Printer, Download, Mail, MessageCircle, Share2, Copy, Archive, QrCode, ChevronDown, Eye } from 'lucide-react'
import { toast } from 'sonner'

export type DocumentType = 'invoice' | 'estimate' | 'quotation' | 'purchase_order' | 'grn' | 'delivery_challan' | 'receipt' | 'payment_voucher' | 'production_report' | 'qc_report' | 'stock_transfer' | 'material_issue' | 'work_order' | 'customer_statement'

interface DocumentActionsProps {
  type: DocumentType
  entityId: string
  entityNo: string
  previewUrl?: string
  printUrl?: string
  email?: string
  whatsapp?: string
  onDuplicate?: () => void
  onArchive?: () => void
  size?: 'sm' | 'default'
}

export function DocumentActions({ type, entityId, entityNo, previewUrl, printUrl, email, whatsapp, onDuplicate, onArchive, size = 'sm' }: DocumentActionsProps) {
  const handlePrint = () => {
    if (printUrl) window.open(printUrl, '_blank')
    else toast.info('Print preview opening...')
  }
  const handleEmail = () => {
    if (email) {
      const subject = encodeURIComponent(`${type.replace('_', ' ').toUpperCase()} ${entityNo}`)
      const body = encodeURIComponent(`Please find attached ${type.replace('_', ' ')} ${entityNo}.\n\nRegards,\nRise Foods`)
      window.open(`mailto:${email}?subject=${subject}&body=${body}`)
    } else {
      toast.info('Email dialog opening...')
    }
  }
  const handleWhatsApp = () => {
    if (whatsapp) {
      const phone = whatsapp.replace(/[^0-9]/g, '')
      const msg = encodeURIComponent(`Hello, here is your ${type.replace('_', ' ')} ${entityNo} from Rise Foods.`)
      window.open(`https://wa.me/${phone}?text=${msg}`)
    } else {
      toast.info('WhatsApp dialog opening...')
    }
  }
  const handleShare = async () => {
    const url = previewUrl ?? window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: `${type} ${entityNo}`, url }) } catch {}
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    }
  }
  const handleQR = () => {
    toast.info('QR Code generating...')
  }
  const handleDuplicate = () => {
    onDuplicate?.()
    toast.success('Document duplicated')
  }
  const handleDownload = () => {
    if (previewUrl) window.open(previewUrl, '_blank')
    else toast.info('Downloading PDF...')
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size={size} onClick={handlePrint}>
        <Printer className="h-3.5 w-3.5" /> Print
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size}>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Document Actions</DropdownMenuLabel>
          {previewUrl && (
            <DropdownMenuItem onClick={() => window.open(previewUrl, '_blank')}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Preview
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="h-3.5 w-3.5 mr-2" /> Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEmail}>
            <Mail className="h-3.5 w-3.5 mr-2" /> Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleWhatsApp}>
            <MessageCircle className="h-3.5 w-3.5 mr-2" /> WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5 mr-2" /> Share Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleQR}>
            <QrCode className="h-3.5 w-3.5 mr-2" /> QR Code
          </DropdownMenuItem>
          {onDuplicate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
            </>
          )}
          {onArchive && (
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="h-3.5 w-3.5 mr-2" /> Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
