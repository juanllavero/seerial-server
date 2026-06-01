import { type DialogType, dialogRegistry } from './dialog-registry';

interface DynamicDialogProps {
  type: DialogType;
  isOpen: boolean;
}

function DynamicDialog({ type, isOpen }: DynamicDialogProps) {
  const DialogComponent = isOpen ? dialogRegistry[type] : null;

  if (!isOpen || !DialogComponent) return null;

  return <DialogComponent />;
}

export default DynamicDialog;
