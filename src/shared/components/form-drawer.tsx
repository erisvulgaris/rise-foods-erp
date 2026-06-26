'use client'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface FormDrawerProps {
  open: boolean
  onOpenChange: (b: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  width?: 'sm' | 'md' | 'lg' | 'xl'
}

export function FormDrawer({ open, onOpenChange, title, description, children, footer, width = 'md' }: FormDrawerProps) {
  const widthClass = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[width]
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={cn(widthClass, 'max-h-[92vh]')}>
        <DrawerHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle className="text-base">{title}</DrawerTitle>
              {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>
        <ScrollArea className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </ScrollArea>
        {footer && (
          <DrawerFooter className="border-t pt-4 flex-row justify-end gap-2">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}

export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function FormGrid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  const gridClass = { 1: 'grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' }[cols]
  return <div className={cn('grid gap-3', gridClass)}>{children}</div>
}
