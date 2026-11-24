# Wireframe map — "Communications Application"

Source: `Project_wireframe.pdf` (16 screens). This file is the single source of truth
that CLAUDE.md, skills and agents point to. Update it when the wireframe changes.

Every logged-in screen shares one top navigation bar: **Group Chat | Manage Users | Manage Documents | Logout**.

## Screens → routes

| # | Wireframe screen (original URL) | Next.js route | What is on it | Backend calls |
|---|---|---|---|---|
| 1 | Home `/public/` | `/` | "Welcome to Users Module", **Login** button (existing users), **Register** button (new users) | none |
| 2 | Login `/users/login` | `/login` | Email, Password, **Login** button | `POST /api/auth/login` |
| 3 | Login success `/users/login-success` | `/dashboard` | Nav bar, "Login Successful", "Welcome ! {email}" | `GET /api/auth/me` |
| 4 | Register `/users/register` | `/register` | Full Name, Email, Password, Confirm Password, **Register** button | `POST /api/auth/register` |
| 5 | Registration success | `/registration-success` | "Registration Successful", thank-you text, link back to home | none |
| 6 | User list `/users/usermgt` | `/users` | Table: Name, User Email ID, actions **Edit \| Delete** | `GET /api/users` |
| 7 | Edit user `/users/edit` | `/users/[id]/edit` | Full Name, Email, **Save** | `GET/PUT /api/users/{id}` |
| 8 | Delete user `/users/delete` | modal on `/users` | "Confirm User Deletion — Are you sure?" **ok / Cancel** | `DELETE /api/users/{id}` |
| 9 | Group chat `/groupchat` | `/chat` | Message log `[timestamp] Name : text`, input box, **Send**, **Refresh** | `GET/POST /api/messages` |
| 10 | Documents `/docmgt` | `/documents` | **My Uploads** table (Label, File Name, Edit \| Delete \| Share) and **Shared Uploads** table (Label, File Name, Shared by), **+ Add Upload** | `GET /api/documents` |
| 11 | Upload dialog `/docmgt/upload` | modal on `/documents` | File Description, Choose File, **Upload Now**, Cancel | `POST /api/documents` |
| 12 | Edit dialog `/docmgt/edit` | modal on `/documents` | File Description, **Save**, Cancel | `PUT /api/documents/{id}` |
| 13 | Share page `/docmgt/share` | `/documents/[id]/share` | Title "Upload Sharing : {file}", table Shared User + **Remove**, "Add Sharing" dropdown **Choose User** + **Add Share** | `GET/POST /api/documents/{id}/shares` |
| 14 | Remove share confirm `/docmgt/share-remove` | modal on share page | "Are you sure?" ok / Cancel | `DELETE /api/documents/{id}/shares/{user_id}` |
| 15 | Delete file confirm `/docmgt/delete` | modal on `/documents` | "Confirm File Deletion — Are you sure?" ok / Cancel | `DELETE /api/documents/{id}` |
| 16 | Logged out | `/` with message | Home page plus "You have been logged out" | `POST /api/auth/logout` |

## Data entities (from the screens)

- **User**: full name, email (unique), password (stored hashed, never returned).
- **Message**: author, text, created time.
- **Document**: owner, description/label, file name, stored file.
- **Share**: which document is shared with which user (unique pair).

## Assumptions made (not shown in the wireframe — confirm with the team)

1. Chat refresh is manual (Refresh button) plus optional polling every ~5 seconds.
2. A file name in a table can be clicked to download it (only the owner or a user it is shared with).
3. "Label" in the document table = the File Description.
4. Any logged-in user can see the user list and edit/delete users (the wireframe shows no roles).
   Open question: should a user be blocked from deleting themselves?
5. Passwords need at least 8 characters (wireframe shows only masked fields).
6. Uploads are limited by size and file type (defaults in CLAUDE.md).
