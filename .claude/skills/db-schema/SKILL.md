---
name: db-schema
description: Design or change the MySQL schema and SQLAlchemy models for users, messages, documents and shares. Use when asked to create tables, add a column, or change relationships.
---

# MySQL schema and models

Tables (from `docs/wireframe-map.md`):

| Table | Columns | Rules |
|---|---|---|
| `users` | id, full_name, email, password_hash, created_at | `email` unique, never store plain passwords |
| `messages` | id, user_id, body, created_at | FK to users, index on `created_at` |
| `documents` | id, owner_id, description, original_name, stored_name, mime_type, size_bytes, created_at | FK to users, `stored_name` is random and unique |
| `document_shares` | id, document_id, user_id, created_at | FK to documents and users, unique pair (`document_id`, `user_id`) |

Steps:
1. Update `backend/app/models.py` (SQLAlchemy). Use `utf8mb4`, InnoDB, explicit `ondelete` rules (deleting a user deletes their messages and shares; deleting a document deletes its shares).
2. Update `backend/schema.sql` so the plain SQL matches the models.
3. Update `backend/seed.py` with three sample users matching the wireframe (Text User, Anne Hunter, Jale Boser). Passwords in seed data are hashed, and the readable test password is documented in the README, not in code comments.
4. Update `.env.example` if a new setting is needed (for example `DATABASE_URL=mysql+pymysql://user:password@localhost/comm_app`).
5. Never run `DROP`, `TRUNCATE` or `DELETE` against a database without asking the user first.
6. Run `python -m pytest`. Tell the user what you could not test, such as running against a real MySQL server.
