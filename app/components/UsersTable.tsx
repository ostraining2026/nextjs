"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiException } from "../lib/api";
import type { User } from "../lib/types";
import { linkClasses, tableClasses, tdClasses, thClasses } from "../lib/ui";
import ConfirmDialog from "./ConfirmDialog";
import FormMessage from "./FormMessage";

export default function UsersTable() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await api.listUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load users.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    setDialogError(null);
    try {
      await api.deleteUser(toDelete.id);
      setToDelete(null);
      await load();
    } catch (e) {
      setDialogError(e instanceof ApiException ? e.message : "Could not delete the user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FormMessage message={error} />
      {users === null && !error ? <p role="status">Loading…</p> : null}
      {users ? (
        <table className={tableClasses}>
          <caption className="sr-only">Registered users</caption>
          <thead>
            <tr>
              <th scope="col" className={thClasses}>
                Name
              </th>
              <th scope="col" className={thClasses}>
                User Email ID
              </th>
              <th scope="col" className={thClasses}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className={tdClasses}>{u.full_name}</td>
                <td className={tdClasses}>{u.email}</td>
                <td className={tdClasses}>
                  <Link href={`/users/${u.id}/edit`} className={linkClasses} aria-label={`Edit ${u.full_name}`}>
                    Edit
                  </Link>
                  {" | "}
                  <button
                    type="button"
                    className={linkClasses}
                    aria-label={`Delete ${u.full_name}`}
                    onClick={() => {
                      setDialogError(null);
                      setToDelete(u);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <ConfirmDialog
        open={toDelete !== null}
        title="Confirm User Deletion"
        message={`Are you sure you want to delete ${toDelete?.full_name ?? "this user"}?`}
        error={dialogError}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
