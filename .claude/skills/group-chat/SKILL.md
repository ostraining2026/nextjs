---
name: group-chat
description: Build the Group Chat screen: message log, send box, Refresh button and the messages API. Use for the Group Chat page.
---

# Group Chat

Backend (`backend/app/messages.py`):
- `GET /api/messages?after_id=<n>`: return up to 100 messages, oldest first, each with `id, user_id, full_name, body, created_at`. `after_id` returns only newer messages.
- `POST /api/messages`: body must be 1 to 1000 characters after trimming. Save with the logged-in user.
- Return plain text only. The frontend must show it as text, never as HTML (prevents XSS).

Frontend (`/chat`):
- A scrollable log region (`role="log"`, `aria-live="polite"`) showing `[date time] Name : message`.
- Input with a visible label, **Send** and **Refresh** buttons. Send on Enter and by button. Clear the box after a successful send.
- Refresh loads new messages. Optional: poll every 5 seconds only while the tab is visible, and stop on unmount.
- Keep the log scrolled to the newest message unless the user scrolled up.

Test: empty message, very long message, a message containing `<script>`, two users sending messages. Say that real-time sockets were not used (polling only) unless you add them.
