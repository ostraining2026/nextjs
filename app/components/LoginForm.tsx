"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, ApiException } from "../lib/api";
import Button from "./Button";
import FormMessage from "./FormMessage";
import TextField from "./TextField";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api.login({ email: String(form.get("email")), password: String(form.get("password")) });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiException ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormMessage message={error} />
      <TextField name="email" label="Email" type="email" autoComplete="email" required />
      <TextField name="password" label="Password" type="password" autoComplete="current-password" required />
      <Button type="submit" disabled={busy}>
        Login
      </Button>
    </form>
  );
}
