import { useToast } from '@/components/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import React, { createContext, useContext, useState } from 'react'

type ConfirmOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  showToastAfter?: boolean
  toastType?: 'success' | 'error' | 'info' | 'warning'
  toastMessage?: string
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null)
  const { showToast } = useToast()

  const confirm: ConfirmFn = (opts) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts)
      setResolver(() => resolve)
      setOpen(true)
    })
  }

  const handleClose = (result: boolean) => {
    setOpen(false)
    if (resolver) resolver(result)
    if (result && options?.showToastAfter && options.toastMessage) {
      showToast(options.toastType ?? 'success', options.toastMessage)
    }
    setOptions(null)
    setResolver(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{options?.title ?? 'Confirmation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">{options?.message}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                {options?.cancelText ?? 'Cancel'}
              </Button>
              <Button onClick={() => handleClose(true)}>
                {options?.confirmText ?? 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export default ConfirmProvider
