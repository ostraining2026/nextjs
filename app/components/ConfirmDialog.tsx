"use client";

import Button from "./Button";
import Dialog from "./Dialog";
import FormMessage from "./FormMessage";

type Props = {
  open: boolean;
  title: string;
  message: string;
  error: string | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title, message, error, busy, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} title={title} onClose={onCancel}>
      <FormMessage message={error} />
      <p className="mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          OK
        </Button>
      </div>
    </Dialog>
  );
}
