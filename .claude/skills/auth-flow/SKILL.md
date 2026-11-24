---
name: auth-flow
description: Build registration, login, logout and the "who am I" check across Flask and Next.js. Use for screens Home, Login, Register, Registration Success, Login Success and Logged Out.
---

# Authentication flow

Backend (`backend/app/auth.py`, Blueprint `auth`):
- `POST /api/auth/register`: validate full name, email format, email not already used, password at least 8 characters, `confirm_password` equals `password`. Hash with `generate_password_hash`. Return 201 with the user (no hash).
- `POST /api/auth/login`: check with `check_password_hash`. Same error text for unknown email and wrong password. On success store only `user_id` in the Flask session.
- `POST /api/auth/logout`: clear the session, return 204.
- `GET /api/auth/me`: return the current user or 401.
- A `login_required` decorator in `backend/app/utils.py` used by every other Blueprint.
- Session cookie: `HttpOnly`, `SameSite=Lax`, `Secure` when not in debug. `SECRET_KEY` comes from the environment.
- Add basic rate limiting or a delay on repeated failed logins, or tell the user it is not done.

Frontend:
- Pages: `/`, `/login`, `/register`, `/registration-success`, `/dashboard` (see `docs/wireframe-map.md`).
- Login and Register are small client form components with a visible label for every field and server errors shown per field.
- Protect logged-in routes (middleware or a layout check that calls `/api/auth/me`). Unauthenticated users go to `/login`.
- Logout button posts to `/api/auth/logout`, then shows the Home page with "You have been logged out".

Test: register, duplicate email, wrong password, correct login, `me` with and without a session, logout. Report anything you could not test.
