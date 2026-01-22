import { Suspense, useMemo } from 'react'
import { dialogRegistry, DialogType } from './dialogRegistry'

// Loading fallback component
const DialogLoading = () => (
  <div className="flex items-center justify-center p-4">
    <div className="text-sm text-gray-500">Loading...</div>
  </div>
)

interface DynamicDialogProps {
  type: DialogType
  isOpen: boolean
}

function DynamicDialog({ type, isOpen }: DynamicDialogProps) {
  const DialogComponent = useMemo(() => {
    if (isOpen) {
      return dialogRegistry[type]
    }
    return null
  }, [type, isOpen])

  if (!isOpen || !DialogComponent) {
    return null
  }

  return (
    <Suspense fallback={<DialogLoading />}>
      <DialogComponent />
    </Suspense>
  )
}

export default DynamicDialog
