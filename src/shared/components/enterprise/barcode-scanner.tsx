'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Camera, Scan, X, Search, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BarcodeScannerProps {
  open: boolean
  onOpenChange: (b: boolean) => void
  onScan: (code: string) => void
  title?: string
  placeholder?: string
}

export function BarcodeScanner({ open, onOpenChange, onScan, title = 'Scan Barcode', placeholder = 'Scan or type barcode...' }: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  // Camera scanning using BarcodeDetector API (Chrome/Edge) or manual input
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraActive(true)

      // Try BarcodeDetector API (available in Chrome/Edge)
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e'] })
        const detect = async () => {
          if (!cameraActive || !videoRef.current) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue
              onScan(code)
              toast.success(`Scanned: ${code}`)
              stopCamera()
              onOpenChange(false)
              return
            }
          } catch {}
          if (cameraActive) requestAnimationFrame(detect)
        }
        detect()
      }
    } catch (e: any) {
      setCameraError(e.message)
      toast.error('Camera not available. Use manual input.')
    }
  }, [cameraActive, onScan, onOpenChange, stopCamera])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    // Cleanup camera on unmount or close
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [open])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScan(manualCode.trim())
      toast.success(`Code entered: ${manualCode.trim()}`)
      setManualCode('')
      onOpenChange(false)
    }
  }

  // USB scanner support — keyboard wedge scanners type fast + Enter
  useEffect(() => {
    if (!open) return
    let buffer = ''
    let timeout: NodeJS.Timeout
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return // don't interfere with manual input
      if (e.key === 'Enter' && buffer.length > 2) {
        onScan(buffer)
        toast.success(`Scanned: ${buffer}`)
        buffer = ''
        onOpenChange(false)
        return
      }
      if (e.key.length === 1) {
        buffer += e.key
        clearTimeout(timeout)
        timeout = setTimeout(() => { buffer = '' }, 100) // reset after 100ms gap
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onScan, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-4 w-4" /> {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Camera view */}
          {cameraActive ? (
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/2 border-2 border-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
                </div>
              </div>
              <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={stopCamera}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={startCamera} className="w-full h-12" variant="outline">
                <Camera className="h-5 w-5 mr-2" /> Start Camera Scan
              </Button>
              {cameraError && <p className="text-xs text-rose-600 text-center">{cameraError}</p>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> OR TYPE MANUALLY <div className="h-px flex-1 bg-border" />
              </div>
            </div>
          )}

          {/* Manual input */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input ref={inputRef} value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder={placeholder} className="flex-1" autoFocus />
            <Button type="submit" disabled={!manualCode.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <div className="rounded-lg bg-muted/40 p-2.5 text-[10px] text-muted-foreground space-y-1">
            <p className="flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /> USB/Bluetooth scanners work automatically</p>
            <p>• Point camera at barcode/QR code</p>
            <p>• Or scan with USB scanner (auto-detects)</p>
            <p>• Or type code manually and press Enter</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
