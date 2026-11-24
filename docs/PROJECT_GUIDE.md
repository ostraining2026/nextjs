# Project guide: how this app is built

A plain-words tour of the "Communications Application". Read this first, then
`wireframe-map.md` (screens) and `api-contract.md` (API).

## The big picture

```
Browser ──► Next.js (port 3000)  ──/api/* proxy──►  Flask (port 5000) ──► MySQL (port 3306)
            pages, forms, nav                        rules, login, files      users, messages,
                                                                              documents, shares
```

- The browser only ever talks to **Next.js**. Any URL starting with `/api` is forwarded
  by Next.js to Flask (`rewrites` in `next.config.ts`). That means no CORS setup and the
  login cookie belongs to one site.
- **Flask** checks every rule (is the user logged in, do they own this file, is the
  password long enough). The browser is never trusted.
- **MySQL** stores the data. Uploaded files are stored on disk in `backend/uploads/`
  under random names; MySQL stores the original name and who owns it.

## Folder map

```
dashboard/
├── app/                      ← FRONTEND (Next.js App Router)
│   ├── page.tsx                 Home (/)
│   ├── login/ register/ registration-success/
│   ├── (app)/                   Screens that need login (share one layout + nav bar)
│   │   ├── layout.tsx             wraps pages in AppShell
│   │   ├── dashboard/ chat/ users/ users/[id]/edit/
│   │   └── documents/ documents/[id]/share/
│   ├── components/              One component per file (forms, tables, dialogs, NavBar…)
│   └── lib/
│       ├── api.ts                 ALL calls to the backend live here
│       ├── types.ts               TypeScript shapes of API data
│       ├── ui.ts                  shared Tailwind class strings
│       └── user-context.tsx       "who is logged in" for client components
├── next.config.ts            ← /api proxy to Flask
├── backend/                  ← BACKEND (Python + Flask + MySQL)
│   ├── app/
│   │   ├── __init__.py          create_app(): builds the Flask app
│   │   ├── config.py            reads settings from backend/.env
│   │   ├── models.py            tables as Python classes (User, Message, Document, Share)
│   │   ├── auth.py              register, login, logout, me
│   │   ├── users.py             list / edit / delete users
│   │   ├── messages.py          group chat
│   │   ├── documents.py         upload, edit, delete, download, share
│   │   ├── security.py          @login_required
│   │   └── errors.py            one JSON error shape for every failure
│   ├── schema.sql             creates the MySQL database + tables
│   ├── seed.py                optional demo users (development only)
│   ├── tests/test_api.py      pytest tests
│   ├── requirements.txt       Python packages
│   └── .env.example           copy to .env and fill in
└── docs/                     ← wireframe-map.md, api-contract.md, this guide, HOW_TO_RUN.md
```

> Note: `CLAUDE.md` mentions a `frontend/` folder. Because you asked for the app to live
> inside the existing Next.js project, the frontend is the project root (`app/`), and only
> the backend has its own folder.

## Wireframe screen → file

| Wireframe screen | URL | Page file | Main component |
|---|---|---|---|
| Home | `/` | `app/page.tsx` | – |
| Login | `/login` | `app/login/page.tsx` | `LoginForm` |
| Register | `/register` | `app/register/page.tsx` | `RegisterForm` |
| Registration success | `/registration-success` | `app/registration-success/page.tsx` | – |
| Login success | `/dashboard` | `app/(app)/dashboard/page.tsx` | `DashboardWelcome` |
| User list + delete confirm | `/users` | `app/(app)/users/page.tsx` | `UsersTable`, `ConfirmDialog` |
| Edit user | `/users/1/edit` | `app/(app)/users/[id]/edit/page.tsx` | `EditUserForm` |
| Group chat | `/chat` | `app/(app)/chat/page.tsx` | `ChatView` |
| Documents (my + shared), upload / edit / delete dialogs | `/documents` | `app/(app)/documents/page.tsx` | `DocumentsView`, `UploadDialog`, `EditDocumentDialog` |
| Share page + remove confirm | `/documents/1/share` | `app/(app)/documents/[id]/share/page.tsx` | `ShareView` |
| Logged out | `/?loggedout=1` | `app/page.tsx` | `LoggedOutNotice` |

## How the important flows work

**Login.** `LoginForm` → `api.login()` → `POST /api/auth/login` → Flask checks the
password hash and sets a signed session cookie → browser goes to `/dashboard`.

**Staying protected.** Every page in `app/(app)/` is wrapped by `AppShell`. It calls
`GET /api/auth/me`; if Flask answers 401 the user is sent to `/login`. Even if someone
skipped this check, Flask rejects every protected API call with 401 anyway.

**Group chat.** `ChatView` loads the latest messages, refreshes every 5 seconds and on
the Refresh button, and posts new ones with Send.

**Documents.** Upload sends a multipart form. Flask checks the extension (allow-list) and
size (10 MB), saves the file under a random name, and records it in MySQL. Download is
allowed only for the owner or a user the file was shared with. Edit, delete and share
are owner-only (403 for anyone else).

**Dialogs.** `Dialog` uses the browser's native `<dialog>` element: focus stays inside,
Escape closes it, and focus returns to the button that opened it.

## Rules worth remembering

- Passwords are hashed (`generate_password_hash`) and never returned by the API.
- All SQL goes through SQLAlchemy (no string-built SQL).
- Secrets live in `backend/.env` (git-ignored). Only `.env.example` is committed.
- If you change an endpoint, change `docs/api-contract.md`, `app/lib/api.ts`,
  `app/lib/types.ts` and the Flask route together.

## Assumptions (not in the wireframe)

See "Assumptions" in `wireframe-map.md`. In addition:
- Any logged-in user can edit or delete any user (the wireframe shows no roles). Deleting
  yourself logs you out. Deleting a user also deletes their messages, files and shares.
- The "Share" dropdown lists every other registered user not already shared with.
- Allowed upload types: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, png, jpg, jpeg.
