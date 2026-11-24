"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api, ApiException } from "../lib/api";
import type { User } from "../lib/types";
import Button from "./Button";
import FormMessage from "./FormMessage";
import TextField from "./TextField";

export default function EditUserForm() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getUser(id)
      .then(setUser)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load the user."));
  }, [id]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});
    try {
      await api.updateUser(id, { full_name: String(form.get("full_name")), email: String(form.get("email")) });
      router.push("/users");
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
        setFields(err.fields);
      } else setError("Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md">
      <FormMessage message={error} />
      {user ? (
        <form onSubmit={onSubmit} noValidate>
          <TextField name="full_name" label="Full Name" defaultValue={user.full_name} required error={fields.full_name} />
          <TextField name="email" label="Email" type="email" defaultValue={user.email} required error={fields.email} />
          <Button type="submit" disabled={busy}>
            Save
          </Button>
        </form>
      ) : error ? null : (
        <p role="status">Loading…</p>
      )}
    </div>
  );
}
