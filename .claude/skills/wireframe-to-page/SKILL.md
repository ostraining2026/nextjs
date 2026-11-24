---
name: wireframe-to-page
description: Turn one screen from docs/wireframe-map.md into a Next.js page (route, components, API calls). Use when asked to build or rebuild a screen such as Login, Register, Users, Chat or Documents.
---

# Wireframe screen to Next.js page

Build ONE screen at a time.

1. Read `docs/wireframe-map.md` and find the screen's row (route, contents, API calls). Read `docs/api-contract.md` for the endpoints it uses.
2. Look at existing files in `frontend/app/` and copy their patterns (layout, components, `lib/api.ts`).
3. Create the route in `frontend/app/<route>/page.tsx`. Use a Server Component unless the screen needs state or events.
   - Forms, dialogs and buttons with click handlers go in small `"use client"` components in `frontend/app/components/`.
4. Put the shared top nav (`Group Chat | Manage Users | Manage Documents | Logout`) in a layout used by logged-in routes only. Mark the current page with `aria-current="page"`.
5. Add types to `frontend/app/lib/types.ts` and call the backend only through `frontend/app/lib/api.ts`.
6. Cover every state: loading, empty list, error message, success. Show server validation errors next to the field.
7. Accessibility: semantic HTML, visible labels, visible focus, 4.5:1 contrast, usable at 360px, 768px and 1280px.
8. Run `npm run lint`, then `npm run build`.
9. Finish by listing: what you built, which assumptions you made, what you did not test.

Do not invent features the wireframe does not show. Do not add dependencies without saying why.
