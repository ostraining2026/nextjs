---
name: documents-module
description: Build Manage Documents: My Uploads, Shared Uploads, upload dialog, edit description, share page and delete confirmations. Use for all document screens in docs/wireframe-map.md.
---

# Manage Documents module

Backend (`backend/app/documents.py`) follows `docs/api-contract.md`.

Security rules (do not skip any):
- Upload: allow-list extensions (for example pdf, doc, docx, xls, xlsx, ppt, pptx, txt, png, jpg), limit size to 10 MB, reject others with 400/413.
- Save under a random name (for example `uuid4().hex` plus extension) in a folder outside the public web root, set by `UPLOAD_DIR` in the environment. Keep the original name only as display text (`secure_filename`).
- Owner-only: edit, delete, list shares, add share, remove share. Return 403 or 404 for other users, never leak that a document exists.
- Download: owner or a user it is shared with. Send with `send_from_directory` and `as_attachment=True`.
- Deleting a document also deletes the stored file and its shares.

Frontend:
- `/documents`: two tables. **My Uploads** (Label, File Name, `Edit | Delete | Share`) and **Shared Uploads** (Label, File Name, Shared by). A **+ Add Upload** button opens the upload dialog.
- Upload dialog: File Description, file input with a visible label, **Upload Now**, **Cancel**. Send as `multipart/form-data`. Show progress or a disabled button while uploading and show server errors.
- Edit dialog: only the description. **Save** and **Cancel**.
- Delete: "Confirm File Deletion. Are you sure?" with OK and Cancel.
- `/documents/[id]/share`: title "Upload Sharing : {file name}". Table of Shared User with **Remove** (with confirmation). "Add Sharing" with a **Choose User** select (a visible label) and **Add Share**. Only list users who do not already have access.
- All dialogs accessible: focus trap, Escape closes, focus returns to the trigger.

Test: upload a good file, a too-large file and a blocked type; edit; share and unshare; another user trying to open an owner-only route; delete. Report what you could not test.
