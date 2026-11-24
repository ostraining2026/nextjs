"use client";

import { useState, type FormEvent } from "react";
import { api, ApiException } from "../lib/api";
import Button from "./Button";
import Dialog from "./Dialog";
import FormMessage from "./FormMessage";
import TextField from "./TextField";

type Props = { open: boolean; onClose: () => void; onUploaded: () => void };

export default function UploadDialog({ open, onClose, onUploaded }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});
    try {
      await api.uploadDocument(form);
      onUploaded();
      onClose();
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
        setFields(err.fields);
      } else setError("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} title="Upload a File" onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <FormMessage message={error} />
        <TextField name="description" label="File Description" required maxLength={255} error={fields.description} />
        <div className="mb-4">
          <label htmlFor="field-file" className="mb-1 block text-sm font-medium">
            Choose File (max 10 MB)
          </label>
          <input
            id="field-file"
            name="file"
            type="file"
            required
            aria-describedby={fields.file ? "field-file-error" : undefined}
            aria-invalid={fields.file ? true : undefined}
            className="block w-full text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          />
          {fields.file ? (
            <p id="field-file-error" className="mt-1 text-sm text-red-700">
              {fields.file}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            Upload Now
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
