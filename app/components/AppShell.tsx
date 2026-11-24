"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api, ApiException } from "../lib/api";
import type { User } from "../lib/types";
import { UserContext } from "../lib/user-context";
import FormMessage from "./FormMessage";
import NavBar from "./NavBar";

// Wraps every logged-in screen: checks the session, shows the top nav.
export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch((e: unknown) => {
        if (e instanceof ApiException && e.status === 401) router.replace("/login");
        else setError(e instanceof Error ? e.message : "Something went wrong.");
      });
  }, [router]);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4">
        <FormMessage message={error} />
      </main>
    );
  }
  if (!user) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4">
        <p role="status">Loading…</p>
      </main>
    );
  }

  return (
    <UserContext.Provider value={user}>
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 p-4">{children}</main>
    </UserContext.Provider>
  );
}
