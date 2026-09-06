import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";

export interface RenameProjectDialogProps {
  projectName: string;
  title: string;
  fieldLabel: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (name: string) => void;
}

export function useBehavior({
  projectName,
  onCancel,
  onConfirm,
  ...copy
}: RenameProjectDialogProps) {
  const [name, setName] = useState(projectName);
  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!name.trim()) return;
      onConfirm(name.trim());
    },
    [name, onConfirm]
  );
  const onNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setName(event.target.value),
    []
  );

  return { ...copy, name, onSubmit, onNameChange, onCancel };
}
