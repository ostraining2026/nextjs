# Project rules for Claude

## About this project
- Next.js 16 (App Router) with React 19, TypeScript and Tailwind CSS 4. The package name is `dashboard`.
- Pages and layouts live in `app/`. Static files live in `public/`.

## Before you write code
- This is not the Next.js you may remember. Read `AGENTS.md`, then read the relevant guide in `node_modules/next/dist/docs/` before changing routing, data fetching, caching or config. Run `npm install` first if `node_modules` is missing.
- Look at the existing files in `app/` and follow their patterns before adding new ones.

## Commands
- `npm run dev` starts the dev server.
- `npm run lint` must pass before you commit.
- `npm run build` must pass before you open a pull request.

## Code conventions
- Use TypeScript with explicit types for props and data. Do not use `any`.
- Use Server Components by default. Add `"use client"` only to components that need state, effects or browser APIs, and keep those components small.
- Name components in PascalCase, one component per file. Put shared components in `app/components/`.
- Style with Tailwind classes. Do not add a second styling system.
- Do not add a dependency without a clear reason. Say why in the commit message.

## UI and accessibility
- Use semantic HTML (`main`, `nav`, `button`, `table`, headings in order).
- Give every image alt text and every form field a visible label.
- Keep visible focus styles. Text must meet WCAG AA contrast (4.5:1).
- Build mobile first and check the layout at 360px, 768px and 1280px.

## Data and security
- Never commit secrets. Keep keys and passwords in `.env.local`, which is git-ignored, and update `.env.example` when you add a variable.
- Validate user input on the server, not only in the browser.
- Use mock data from a clearly named file, such as `app/data/users.ts`, until a real API exists.

## Git and pull requests
- Work on a branch, never directly on `main`.
- Make small commits with clear messages in the imperative mood, such as "Add user list table".
- Do not commit `node_modules`, `.next` or build output.
- Before finishing, say what you changed and what you did not test.
