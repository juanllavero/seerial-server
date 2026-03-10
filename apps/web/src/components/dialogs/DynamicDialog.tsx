import { Suspense, useMemo } from 'react'
import Loading from '../Loading'
import { type DialogType, dialogRegistry } from './dialogRegistry'

const DialogLoading = () => (
  <div className="flex items-center justify-center p-4">
    <Loading />
  </div>
)

interface DynamicDialogProps {
  type: DialogType
  isOpen: boolean
}

function DynamicDialog({ type, isOpen }: DynamicDialogProps) {
  const DialogComponent = useMemo(() => {
    if (isOpen) return dialogRegistry[type]
    return null
  }, [type, isOpen])

  if (!isOpen || !DialogComponent) return null

  return (
    <Suspense fallback={<DialogLoading />}>
      <DialogComponent />
    </Suspense>
  )
}

export default DynamicDialog
