# API contract (Flask, JSON)

The frontend and backend both follow this file. If an endpoint changes, change it here first.
All routes are under `/api`. The browser talks only to Next.js; Next.js proxies `/api/*`
to Flask (see `frontend/next.config.ts` rewrites), so there is no CORS setup.

Auth: Flask session cookie (`HttpOnly`, `SameSite=Lax`, `Secure` in production).
Every route except `register` and `login` needs a logged-in user, otherwise `401`.

Interactive docs: Swagger UI at `/api/docs`, spec at `/api/openapi.json`
(source: `backend/app/openapi.py`, keep it in step with this file).

## Error shape (all errors)

```json
{ "error": { "code": "validation_error", "message": "Please fix the highlighted fields.", "fields": { "email": "Email is already registered." } } }
```

`fields` is optional. Status codes: 400 validation, 401 not logged in, 403 not allowed, 404 not found, 409 conflict, 413 file too large.

## Endpoints

| Method | Path | Body | Success | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | `full_name, email, password, confirm_password` | 201 `{id, full_name, email}` | Validate on server: email format, unique, password ≥ 8, passwords match |
| POST | `/auth/login` | `email, password` | 200 `{id, full_name, email}` | Same message for unknown email and wrong password |
| POST | `/auth/logout` | — | 204 | Clears the session |
| GET | `/auth/me` | — | 200 `{id, full_name, email}` | 401 if not logged in |
| GET | `/users` | — | 200 `[{id, full_name, email}]` | Never include password hash |
| GET | `/users/<id>` | — | 200 user | |
| PUT | `/users/<id>` | `full_name, email` | 200 user | 409 if email taken |
| DELETE | `/users/<id>` | — | 204 | Also removes the user's messages/shares per DB rules |
| GET | `/messages?after_id=` | — | 200 `[{id, user_id, full_name, body, created_at}]` | Oldest first, max 100 |
| POST | `/messages` | `body` | 201 message | 1–1000 characters |
| GET | `/documents` | — | 200 `{mine: [...], shared: [...]}` | `shared` items include `shared_by` (name + email) |
| POST | `/documents` | multipart: `description`, `file` | 201 document | Check size, extension, store with a random file name |
| PUT | `/documents/<id>` | `description` | 200 document | Owner only |
| DELETE | `/documents/<id>` | — | 204 | Owner only; also deletes the stored file |
| GET | `/documents/<id>/download` | — | file | Owner or shared-with user only |
| GET | `/documents/<id>/shares` | — | 200 `{shared_with: [...], candidates: [...]}` | Owner only; `candidates` = users not yet shared |
| POST | `/documents/<id>/shares` | `user_id` | 201 | Owner only; 409 if already shared |
| DELETE | `/documents/<id>/shares/<user_id>` | — | 204 | Owner only |

## Document item shape

```json
{ "id": 7, "description": "Sales Report", "file_name": "sales-Sep2014.xls", "size": 20480, "created_at": "2026-11-24T07:30:00Z" }
```
