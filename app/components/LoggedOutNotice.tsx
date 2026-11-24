"use client";

import { useSearchParams } from "next/navigation";
import FormMessage from "./FormMessage";

export default function LoggedOutNotice() {
  const params = useSearchParams();
  return params.get("loggedout") ? <FormMessage tone="success" message="You have been logged out." /> : null;
}
