"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiException } from "../lib/api";
import type { DocumentItem, SharesResponse, User } from "../lib/types";
import { linkClasses, tableClasses, tdClasses, thClasses } from "../lib/ui";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import FormMessage from "./FormMessage";

export default function ShareView() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [shares, setShares] = useState<SharesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<User | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [docs, s] = await Promise.all([api.listDocuments(), api.listShares(id)]);
      setDoc(docs.mine.find((d) => d.id === id) ?? null);
      setShares(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load sharing details.");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void load();
  }, [load]);

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const userId = Number(new FormData(e.currentTarget).get("user_id"));
    if (!userId) {
      setAddError("Choose a user.");
      return;
    }
    setAddError(null);
    try {
      await api.addShare(id, userId);
      await load();
    } catch (err) {
      setAddError(err instanceof ApiException ? err.message : "Could not add the share.");
    }
  }

  async function confirmRemove() {
    if (!toRemove) return;
    setBusy(true);
    setRemoveError(null);
    try {
      await api.removeShare(id, toRemove.id);
      setToRemove(null);
      await load();
    } catch (err) {
      setRemoveError(err instanceof ApiException ? err.message : "Could not remove the share.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Upload Sharing : {doc?.file_name ?? ""}</h1>
      <FormMessage message={error} />
      {shares ? (
        <>
          <table className={`${tableClasses} mb-8`}>
            <thead>
              <tr>
                <th scope="col" className={thClasses}>Shared User</th>
                <th scope="col" className={thClasses}>Action</th>
              </tr>
            </thead>
            <tbody>
              {shares.shared_with.length === 0 ? (
                <tr>
                  <td colSpan={2} className={tdClasses}>Not shared with anyone yet.</td>
                </tr>
              ) : null}
              {shares.shared_with.map((u) => (
                <tr key={u.id}>
                  <td className={tdClasses}>{u.full_name} ({u.email})</td>
                  <td className={tdClasses}>
                    <button
                      type="button"
                      className={linkClasses}
                      aria-label={`Remove sharing with ${u.full_name}`}
                      onClick={() => {
                        setRemoveError(null);
                        setToRemove(u);
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <section aria-labelledby="add-sharing">
            <h2 id="add-sharing" className="mb-2 text-lg font-semibold">Add Sharing</h2>
            <FormMessage message={addError} />
            <form onSubmit={onAdd} className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="share-user" className="mb-1 block text-sm font-medium">
                  Choose User
                </label>
                <select
                  id="share-user"
                  name="user_id"
                  defaultValue=""
                  className="block min-w-56 rounded-md border border-slate-500 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <option value="">Select a user…</option>
                  {shares.candidates.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">Add Share</Button>
            </form>
          </section>
        </>
      ) : error ? null : (
        <p role="status">Loading…</p>
      )}
      <p className="mt-8">
        <Link href="/documents" className={linkClasses}>
          Back to Manage Documents
        </Link>
      </p>
      <ConfirmDialog
        open={toRemove !== null}
        title="Remove Sharing"
        message={`Are you sure you want to stop sharing with ${toRemove?.full_name ?? "this user"}?`}
        error={removeError}
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </>
  );
}
