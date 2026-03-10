import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface AddServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (host: string, port: number) => Promise<boolean>
}

function AddServerDialog({ open, onOpenChange, onAdd }: AddServerDialogProps) {
  const [host, setHost] = useState('')
  const [port, setPort] = useState('34200')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!host.trim()) return
    setIsLoading(true)
    setError('')

    const portNum = parseInt(port, 10)
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setError('Puerto inválido')
      setIsLoading(false)
      return
    }

    const ok = await onAdd(host.trim(), portNum)
    setIsLoading(false)

    if (ok) {
      setHost('')
      setPort('34200')
      setError('')
      onOpenChange(false)
    } else {
      setError('No se pudo conectar al servidor')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Añadir servidor</DialogTitle>
        </DialogHeader>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">Dirección IP</label>
            <Input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isLoading}
              placeholder="192.168.1.100"
              className="w-full rounded-md bg-black/40 px-4 py-3 text-white placeholder:text-white/30"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">Puerto</label>
            <Input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isLoading}
              placeholder="34200"
              className="w-full rounded-md bg-black/40 px-4 py-3 text-white placeholder:text-white/30"
            />
          </div>

          {error && <p className="animate-pulse text-sm font-medium text-red-400">{error}</p>}
        </div>

        <DialogFooter className="mt-6 flex gap-3 sm:gap-3">
          <Button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            variant="ghost"
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !host.trim()}
            className="bg-app-color hover:bg-app-color/90 flex items-center gap-2 rounded-xl text-black"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : (
              <>
                <Plus size={16} />
                Conectar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddServerDialog
