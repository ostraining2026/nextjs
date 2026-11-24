import { Suspense, type ReactNode } from "react";
import AppShell from "../components/AppShell";

// Every logged-in screen (nav bar + session check) lives in this route group.
// The content only renders after the browser confirms the session, so it cannot be
// part of an instant static shell. Opt out of the dev-only instant-navigation check.
export const instant = false;

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p role="status" className="p-4">Loading…</p>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
