# Project rules for Claude

## About this project
- "Communications Application": users register and log in, manage users, chat in a group chat, and upload and share documents.
- Screens and routes: `docs/wireframe-map.md`. API: `docs/api-contract.md`. Read both before building a feature.
- Monorepo:
  - `frontend/` — Next.js (App Router), React, TypeScript, Tailwind CSS.
  - `backend/` — Python 3 + Flask, SQLAlchemy, PyMySQL, MySQL database.
  - `docs/` — wireframe map and API contract.

## Before you write code
- Next.js changes often between versions. Before changing routing, data fetching, caching or config, read the matching guide in `frontend/node_modules/next/dist/docs/` (run `npm install` in `frontend/` first if `node_modules` is missing).
- Look at the existing files and follow their patterns before adding new ones.
- If the wireframe does not show something, check "Assumptions" in `docs/wireframe-map.md`, do not guess silently. Say what you assumed.

## Commands
- Frontend (run in `frontend/`): `npm run dev`, `npm run lint`, `npm run build`.
- Backend (run in `backend/`): `flask --app app run --debug`, `python -m pytest`.
- `npm run lint` and `python -m pytest` must pass before you commit. `npm run build` must pass before a pull request.

## Frontend conventions
- TypeScript with explicit types for props and API data. Do not use `any`.
- Server Components by default. Add `"use client"` only for state, effects or browser APIs, and keep those components small.
- One component per file, PascalCase names. Shared components go in `frontend/app/components/`.
- API types live in `frontend/app/lib/types.ts`. All fetch calls go through `frontend/app/lib/api.ts`.
- Style with Tailwind only. Do not add a second styling system.
- Do not add a dependency without a clear reason. Say why in the commit message.

## Backend conventions
- Application factory in `backend/app/__init__.py`. One Flask Blueprint per module: `auth`, `users`, `messages`, `documents`.
- Models in `backend/app/models.py` (SQLAlchemy). Use the ORM or bound parameters. Never build SQL with string formatting.
- Validate all input on the server. Return the error shape from `docs/api-contract.md`.
- Hash passwords with `werkzeug.security.generate_password_hash`. Never log or return passwords or hashes.
- Uploads: allow-list file extensions, limit size (default 10 MB), save under a random file name outside the web root, use `secure_filename` only for the display name.
- Every document and share route must check that the logged-in user owns the document (or, for download, has it shared).
- Schema changes go through `backend/schema.sql` (or migrations) and are documented in the commit message.

## UI and accessibility
- Semantic HTML: `main`, `nav`, `button`, `table`, headings in order. The top nav is `Group Chat | Manage Users | Manage Documents | Logout`.
- Every form field has a visible label. Every image has alt text.
- Confirmation dialogs (delete user, delete file, remove share) use a real dialog with focus trapped, Escape to close, focus returned to the trigger.
- Keep visible focus styles. Text contrast at least 4.5:1 (WCAG AA).
- Mobile first. Check layouts at 360px, 768px and 1280px.

## Data and security
- Never commit secrets. Keys, DB passwords and `SECRET_KEY` live in `.env` files that are git-ignored. Update `.env.example` when you add a variable.
- Do not read or print `.env` files.
- Use mock or seed data from a clearly named file (`backend/seed.py`) for local development only.
- Do not run destructive commands (dropping tables, deleting folders) without asking first.

## Git and pull requests
- Work on a branch, never directly on `main`. Do not push or commit unless asked.
- Small commits, imperative mood: "Add user list table".
- Do not commit `node_modules`, `.next`, `__pycache__`, `.venv`, `uploads/` or build output.
- When you finish, say what you changed and what you did not test.
