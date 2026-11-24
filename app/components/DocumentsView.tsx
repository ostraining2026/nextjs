"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiException } from "../lib/api";
import type { DocumentItem, DocumentsResponse } from "../lib/types";
import { linkClasses, tableClasses, tdClasses, thClasses } from "../lib/ui";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import EditDocumentDialog from "./EditDocumentDialog";
import FormMessage from "./FormMessage";
import UploadDialog from "./UploadDialog";

export default function DocumentsView() {
  const [data, setData] = useState<DocumentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState<DocumentItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.listDocuments());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load documents.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setDeleteError(null);
    try {
      await api.deleteDocument(deleting.id);
      setDeleting(null);
      await load();
    } catch (e) {
      setDeleteError(e instanceof ApiException ? e.message : "Could not delete the file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FormMessage message={error} />
      {data === null && !error ? <p role="status">Loading…</p> : null}
      {data ? (
        <>
          <section aria-labelledby="my-uploads" className="mb-8">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 id="my-uploads" className="text-lg font-semibold">
                My Uploads
              </h2>
              <Button onClick={() => setUploadOpen(true)}>+ Add Upload</Button>
            </div>
            <table className={tableClasses}>
              <thead>
                <tr>
                  <th scope="col" className={thClasses}>Label</th>
                  <th scope="col" className={thClasses}>File Name</th>
                  <th scope="col" className={thClasses}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.mine.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={tdClasses}>You have not uploaded any files.</td>
                  </tr>
                ) : null}
                {data.mine.map((d) => (
                  <tr key={d.id}>
                    <td className={tdClasses}>{d.description}</td>
                    <td className={tdClasses}>
                      <a href={api.downloadUrl(d.id)} className={linkClasses}>
                        {d.file_name}
                      </a>
                    </td>
                    <td className={tdClasses}>
                      <button type="button" className={linkClasses} aria-label={`Edit ${d.description}`} onClick={() => setEditing(d)}>
                        Edit
                      </button>
                      {" | "}
                      <button
                        type="button"
                        className={linkClasses}
                        aria-label={`Delete ${d.description}`}
                        onClick={() => {
                          setDeleteError(null);
                          setDeleting(d);
                        }}
                      >
                        Delete
                      </button>
                      {" | "}
                      <Link href={`/documents/${d.id}/share`} className={linkClasses} aria-label={`Share ${d.description}`}>
                        Share
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="shared-uploads">
            <h2 id="shared-uploads" className="mb-2 text-lg font-semibold">
              Shared Uploads
            </h2>
            <table className={tableClasses}>
              <thead>
                <tr>
                  <th scope="col" className={thClasses}>Label</th>
                  <th scope="col" className={thClasses}>File Name</th>
                  <th scope="col" className={thClasses}>Shared by</th>
                </tr>
              </thead>
              <tbody>
                {data.shared.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={tdClasses}>Nothing has been shared with you.</td>
                  </tr>
                ) : null}
                {data.shared.map((d) => (
                  <tr key={d.id}>
                    <td className={tdClasses}>{d.description}</td>
                    <td className={tdClasses}>
                      <a href={api.downloadUrl(d.id)} className={linkClasses}>
                        {d.file_name}
                      </a>
                    </td>
                    <td className={tdClasses}>
                      {d.shared_by.full_name} ({d.shared_by.email})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : null}

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={() => void load()} />
      <EditDocumentDialog doc={editing} onClose={() => setEditing(null)} onSaved={() => void load()} />
      <ConfirmDialog
        open={deleting !== null}
        title="Confirm File Deletion"
        message={`Are you sure you want to delete "${deleting?.description ?? "this file"}"?`}
        error={deleteError}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
