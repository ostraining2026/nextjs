import Link from "next/link";
import { Suspense } from "react";
import LoggedOutNotice from "./components/LoggedOutNotice";
import { buttonClasses } from "./lib/ui";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <h1 className="mb-6 text-2xl font-semibold">Welcome to Users Module</h1>
      <Suspense>
        <LoggedOutNotice />
      </Suspense>
      <p className="mb-2">Existing users</p>
      <p className="mb-6">
        <Link href="/login" className={buttonClasses("primary")}>
          Login
        </Link>
      </p>
      <p className="mb-2">New users</p>
      <p>
        <Link href="/register" className={buttonClasses("secondary")}>
          Register
        </Link>
      </p>
    </main>
  );
}
