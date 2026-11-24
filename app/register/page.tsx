import Link from "next/link";
import RegisterForm from "../components/RegisterForm";
import { linkClasses } from "../lib/ui";

export const metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <h1 className="mb-6 text-2xl font-semibold">Register</h1>
      <RegisterForm />
      <p className="mt-6 text-sm">
        Already registered?{" "}
        <Link href="/login" className={linkClasses}>
          Login
        </Link>
      </p>
    </main>
  );
}
