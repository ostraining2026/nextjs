---
name: api-endpoint
description: Add or change one Flask API endpoint and keep docs/api-contract.md, the TypeScript types and the tests in step. Use when adding a route that is not covered by another skill.
---

# Add an API endpoint

1. Update `docs/api-contract.md` first (method, path, body, success status, errors).
2. Implement the route in the right Blueprint in `backend/app/`:
   - `login_required` unless it is public,
   - validate every input on the server,
   - use the SQLAlchemy ORM or bound parameters only,
   - return the standard error shape,
   - check the user is allowed to touch this record.
3. Add or update the TypeScript type in `frontend/app/lib/types.ts` and a function in `frontend/app/lib/api.ts`.
4. Add pytest tests: success, invalid input, not logged in, not allowed.
5. Run `python -m pytest` and `npm run lint`.
6. Say what you changed and what you did not test.
