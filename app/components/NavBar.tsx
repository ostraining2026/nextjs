"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../lib/api";

const links = [
  { href: "/chat", label: "Group Chat" },
  { href: "/users", label: "Manage Users" },
  { href: "/documents", label: "Manage Documents" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      await api.logout();
    } finally {
      router.push("/?loggedout=1");
    }
  }

  const item =
    "block px-3 py-2 text-sm font-medium text-white hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white";

  return (
    <nav aria-label="Main" className="bg-blue-800">
      <ul className="mx-auto flex max-w-5xl flex-wrap items-center">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={pathname.startsWith(l.href) ? "page" : undefined}
              className={`${item} ${pathname.startsWith(l.href) ? "bg-blue-950 underline" : ""}`}
            >
              {l.label}
            </Link>
          </li>
        ))}
        <li>
          <button type="button" onClick={logout} className={item}>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}
