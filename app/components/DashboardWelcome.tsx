"use client";

import { useCurrentUser } from "../lib/user-context";

export default function DashboardWelcome() {
  const user = useCurrentUser();
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">Login Successful</h1>
      <p>Welcome ! {user.email}</p>
    </>
  );
}
