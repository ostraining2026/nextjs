import Link from "next/link";
import LoginForm from "../components/LoginForm";
import { linkClasses } from "../lib/ui";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <h1 className="mb-6 text-2xl font-semibold">Login</h1>
      <LoginForm />
      <p className="mt-6 text-sm">
        New here?{" "}
        <Link href="/register" className={linkClasses}>
          Register
        </Link>
      </p>
    </main>
  );
}
