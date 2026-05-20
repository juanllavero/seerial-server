import { useMemo } from 'react';
import { type DialogType, dialogRegistry } from './dialog-registry';

interface DynamicDialogProps {
  type: DialogType;
  isOpen: boolean;
}

function DynamicDialog({ type, isOpen }: DynamicDialogProps) {
  const DialogComponent = useMemo(() => {
    if (isOpen) return dialogRegistry[type];
    return null;
  }, [type, isOpen]);

  if (!isOpen || !DialogComponent) return null;

  return <DialogComponent />;
}

export default DynamicDialog;
