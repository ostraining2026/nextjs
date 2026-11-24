import Link from "next/link";
import { buttonClasses } from "../lib/ui";

export const metadata = { title: "Registration Successful" };

export default function RegistrationSuccessPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <h1 className="mb-4 text-2xl font-semibold">Registration Successful</h1>
      <p className="mb-6">Thank you for registering. You can now log in with your email and password.</p>
      <Link href="/" className={buttonClasses("secondary")}>
        Back to Home
      </Link>
    </main>
  );
}
