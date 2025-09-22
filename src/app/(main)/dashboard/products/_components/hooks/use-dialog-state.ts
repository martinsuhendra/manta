import { useState } from "react";

interface UseDialogStateProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function useDialogState({ open: controlledOpen, onOpenChange: controlledOnOpenChange }: UseDialogStateProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;
  return { open, onOpenChange };
}
