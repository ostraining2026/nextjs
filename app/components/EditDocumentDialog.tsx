"use client";

import { useState, type FormEvent } from "react";
import { api, ApiException } from "../lib/api";
import type { DocumentItem } from "../lib/types";
import Button from "./Button";
import Dialog from "./Dialog";
import FormMessage from "./FormMessage";
import TextField from "./TextField";

type Props = { doc: DocumentItem | null; onClose: () => void; onSaved: () => void };

export default function EditDocumentDialog({ doc, onClose, onSaved }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!doc) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});
    try {
      await api.updateDocument(doc.id, String(form.get("description")));
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
        setFields(err.fields);
      } else setError("Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={doc !== null} title="Edit File Description" onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <FormMessage message={error} />
        <TextField
          name="description"
          label="File Description"
          defaultValue={doc?.description ?? ""}
          required
          maxLength={255}
          error={fields.description}
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
