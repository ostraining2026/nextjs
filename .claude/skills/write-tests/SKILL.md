---
name: write-tests
description: Write pytest tests for the Flask backend (auth, users, messages, documents). Use when asked to add tests or raise coverage.
---

# Write backend tests

- Put tests in `backend/tests/`. Use an app factory with a test config: SQLite in memory is fine for fast tests (note in your summary that MySQL-specific behaviour is not covered).
- Create fixtures: `app`, `client`, `user` and `logged_in_client`.
- For each module cover: success, validation errors, not logged in (401), not allowed (403/404), duplicates (409).
- Documents: upload, blocked extension, too large, download by owner, download by shared user, download by stranger (must fail), delete removes the file.
- Never use real secrets. Use temporary folders for uploads (`tmp_path`).
- Run `python -m pytest -q`. Report passing and failing tests honestly and list the areas not covered.
