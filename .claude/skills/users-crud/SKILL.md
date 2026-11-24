---
name: users-crud
description: Build the Manage Users module: user list table, edit user form and delete confirmation. Use for the Users, Edit User and Confirm User Deletion screens.
---

# Manage Users module

Backend (`backend/app/users.py`): `GET /api/users`, `GET /api/users/<id>`, `PUT /api/users/<id>` (full_name, email), `DELETE /api/users/<id>`. All need login. Return 409 if the new email belongs to another user. Never return `password_hash`.

Frontend:
- `/users`: a real `<table>` with columns Name, User Email ID, Actions (`Edit | Delete`). Show an empty state when there are no users.
- `/users/[id]/edit`: Full Name and Email fields with visible labels, **Save** button, server errors per field, redirect back to `/users` on success.
- Delete: a confirmation dialog "Confirm User Deletion. Are you sure?" with **OK** and **Cancel**. Use the `<dialog>` element or an accessible modal: focus moves into it, Escape cancels, focus returns to the Delete link. Only call the API after OK.
- After a change, refresh the list.

Open question to raise with the user: should someone be allowed to delete their own account? Default: block it with a clear message, and say you did that.

Check: `npm run lint`, `npm run build`, `python -m pytest`. List what you did not test.
