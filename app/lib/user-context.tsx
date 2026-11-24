"use client";

import { createContext, useContext } from "react";
import type { User } from "./types";

export const UserContext = createContext<User | null>(null);

export function useCurrentUser(): User {
  const user = useContext(UserContext);
  if (!user) throw new Error("useCurrentUser must be used inside AppShell");
  return user;
}
