"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, ApiException } from "../lib/api";
import Button from "./Button";
import FormMessage from "./FormMessage";
import TextField from "./TextField";

export default function RegisterForm() {
  const router = useRouter();
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
      await api.register({
        full_name: String(form.get("full_name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
        confirm_password: String(form.get("confirm_password")),
      });
      router.push("/registration-success");
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
        setFields(err.fields);
      } else {
        setError("Something went wrong.");
      }
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormMessage message={error} />
      <TextField name="full_name" label="Full Name" autoComplete="name" required error={fields.full_name} />
      <TextField name="email" label="Email" type="email" autoComplete="email" required error={fields.email} />
      <TextField
        name="password"
        label="Password (at least 8 characters)"
        type="password"
        autoComplete="new-password"
        required
        error={fields.password}
      />
      <TextField
        name="confirm_password"
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        required
        error={fields.confirm_password}
      />
      <Button type="submit" disabled={busy}>
        Register
      </Button>
    </form>
  );
}
