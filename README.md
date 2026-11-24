# Communications Application

Register and log in, manage users, chat in a group chat, and upload and share documents.
Built from `wireframe/Project wireframe.pdf` (16 screens).

| Part | Tech | Folder |
|---|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS | project root (`app/`) |
| Backend | Python 3, Flask, SQLAlchemy, PyMySQL | `backend/` |
| Database | MySQL 8 | `backend/schema.sql` |
| Frontend tests | Vitest + React Testing Library | `app/**/*.test.ts(x)` |
| Backend tests | pytest | `backend/tests/` |

```
Browser ─► Next.js :3000 ──/api/* proxy──► Flask :5000 ─► MySQL :3306
```

More detail: [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) (how it is built),
[docs/HOW_TO_RUN.md](docs/HOW_TO_RUN.md) (run + troubleshooting),
[docs/api-contract.md](docs/api-contract.md), [docs/wireframe-map.md](docs/wireframe-map.md).

### URLs (after you start both servers)

| What | URL |
|---|---|
| App (frontend) | http://localhost:3000 |
| **Swagger UI (API docs)** | **http://127.0.0.1:5000/api/docs** (also at http://localhost:3000/api/docs through the proxy) |
| OpenAPI spec (JSON) | http://127.0.0.1:5000/api/openapi.json |
| Backend health check | http://127.0.0.1:5000/api/health |

---

## Run the project

Prerequisites: Node.js 20+, Python 3.10+, MySQL 8+. Windows PowerShell shown; run all commands from the project root unless stated.

### 1. Database (once)
```powershell
mysql -u root -p < backend/schema.sql
```
Creates database `communications_app`, four tables and the MySQL user `comms_user`
(change its password in `schema.sql` outside your own machine).

### 2. Backend, Flask on http://127.0.0.1:5000
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env          # then edit .env: set SECRET_KEY (and DATABASE_URL if you changed the password)
python seed.py                  # optional demo users: alice@example.com / bob@example.com, password123
flask --app app run --debug
```
Check: http://127.0.0.1:5000/api/health returns `{"status":"ok"}`.

### Swagger (API documentation)
With Flask running, open **http://127.0.0.1:5000/api/docs**. It lists every endpoint grouped as Auth, Users, Messages, Documents and Sharing, with request and response shapes.

To call the protected endpoints from Swagger:
1. Expand `POST /auth/login`, click **Try it out**, enter an email and password (for example `alice@example.com` / `password123` after `python seed.py`), then **Execute**. The browser stores the session cookie.
2. Expand any other endpoint, click **Try it out**, then **Execute**. A `401` means you are not logged in yet.

Notes:
- The page loads the Swagger UI files from the jsDelivr CDN, so it needs internet access. The JSON spec (`/api/openapi.json`) works offline.
- The spec lives in `backend/app/openapi.py`. When you add or change an endpoint, update it together with `docs/api-contract.md`. A test (`tests/test_docs.py`) fails if a Flask route is missing from the spec.

### 3. Frontend, Next.js on http://localhost:3000
Open a **second** terminal in the project root:
```powershell
npm install
npm run dev
```
If Flask runs somewhere else, set `FLASK_URL` (for example in `.env.local`) and restart.

---

## Run the tests

### Backend tests (pytest)
```powershell
cd backend
.venv\Scripts\Activate.ps1      # if not already active
python -m pytest                # 30 tests
python -m pytest -v             # list every test
python -m pytest tests/test_edge_cases.py -k upload   # only matching tests
```
- Uses an in-memory SQLite database and a temporary upload folder, so **MySQL does not need to be running** and no real data is touched.
- `tests/test_api.py`: main flows (auth, users, chat, documents, sharing, permissions).
- `tests/test_edge_cases.py`: password hashing, case-insensitive email, 413 file too large, upload name safety, message limits, cascade deletes, share rules, access after unsharing.
- `tests/test_docs.py`: Swagger page, OpenAPI JSON, and a check that every API route is documented.
- `tests/conftest.py`: shared fixtures (`app`, `client`) and helpers (`register`, `login`, `upload`).

### Frontend tests (Vitest)
```powershell
npm test                        # run once (26 tests)
npm run test:watch              # re-run on file save
npx vitest run app/lib          # only one folder
```
- Runs in jsdom, no browser, **no Flask needed**: the API client is mocked.
- `app/lib/api.test.ts`: API client (JSON, 204, error shape, field errors, unreachable server).
- `app/components/*.test.tsx`: TextField labels and errors, ConfirmDialog, LoginForm, RegisterForm, NavBar (order, current page, logout), UsersTable (list, confirm-then-delete, cancel, load error).
- `vitest.config.mts` and `vitest.setup.ts` hold the setup (including a small `<dialog>` polyfill, because jsdom lacks `showModal()`).

### All checks before a commit or pull request
```powershell
npm run lint
npm test
npm run build                   # before a pull request
cd backend; python -m pytest
```

### Adding a test
- Backend: add a function named `test_...` to a file in `backend/tests/`; use the `client` fixture.
- Frontend: put `Name.test.tsx` next to the component; mock API calls with `vi.spyOn(api, "method")` and `next/navigation` with `vi.mock`.

### Not covered by automated tests yet
Chat, documents and share screens in the frontend, page-level routing, real MySQL, and end-to-end browser tests (for example Playwright).

---

# Claude Project Kit (instructions for Claude Code)

The rest of this file describes the Claude Code kit (rules, skills, agents, hooks) used to build this project.


Everything Claude Code needs to help you build the project in `Project_wireframe.pdf`:

- **Frontend:** Next.js (TypeScript, Tailwind)
- **Backend:** Python (Flask) + MySQL
- **Screens:** login, register, user management, group chat, document upload and sharing (16 wireframe screens)

This kit contains no application code. It contains the *instructions and guard rails* that make Claude build it correctly and consistently.

---

## 1. What is inside

```
claude-project-kit/
├── README.md                      ← you are here
├── docs/
│   └── PROMPTS.md                 ← copy-paste prompts for every step
└── copy-to-project/               ← copy EVERYTHING in here into your project root
    ├── CLAUDE.md                  ← project rules Claude reads every session
    ├── .mcp.json                  ← GitHub and Figma connections (MCP)
    ├── docs/
    │   ├── wireframe-map.md       ← 16 screens → routes → API calls (+ assumptions)
    │   └── api-contract.md        ← every API endpoint, request, response, errors
    └── .claude/
        ├── settings.json          ← permissions and hooks
        ├── hooks/
        │   ├── block_secret_files.py   ← stops Claude writing .env / key files
        │   └── check_after_edit.py     ← syntax / lint check after each edit
        ├── skills/                ← "recipes" Claude follows to BUILD things
        │   ├── wireframe-to-page/SKILL.md
        │   ├── db-schema/SKILL.md
        │   ├── auth-flow/SKILL.md
        │   ├── users-crud/SKILL.md
        │   ├── documents-module/SKILL.md
        │   ├── group-chat/SKILL.md
        │   ├── api-endpoint/SKILL.md
        │   ├── write-tests/SKILL.md
        │   └── explain-code/SKILL.md
        └── agents/                ← "specialists" Claude calls to CHECK things
            ├── security-auditor.md
            ├── code-reviewer.md
            ├── accessibility-checker.md
            ├── api-contract-checker.md
            ├── wireframe-compliance-checker.md
            └── test-runner.md
```

---

## 2. How to install (3 steps)

1. Create your project folder with `frontend/` and `backend/` inside (they can be empty for now).
2. Copy **everything inside `copy-to-project/`** into the project root. Keep the dot-folder `.claude` and the file `.mcp.json` (they are hidden on some systems, turn on "show hidden files").
3. Open a terminal in the project root, run `claude`, and ask: `Read CLAUDE.md and tell me the plan.`

Restart Claude Code once after copying, because a brand-new `.claude/agents/` folder is only picked up at startup.

Commit `CLAUDE.md`, `.claude/`, `.mcp.json` and `docs/` to Git so the whole team gets the same setup.

---

## 3. The Claude features, one by one

| Feature | What it is (simple) | File in this kit | When it works |
|---|---|---|---|
| **CLAUDE.md** | A rules file Claude reads at the start of every session. Like a team handbook. | `CLAUDE.md` | Automatically, always |
| **Skills** | Step-by-step recipes for *doing* a task. They run inside your main chat and can change files. | `.claude/skills/*/SKILL.md` | You type `/skill-name`, or Claude picks one that matches |
| **Agents (subagents)** | Specialists with their own limited tools. Best for *checking* work, because they can be read-only. | `.claude/agents/*.md` | You type `@agent-name`, or Claude hands work over |
| **Tools** | The actions Claude can take: Read, Grep, Glob (look), Edit, Write (change), Bash (run commands). The `tools:` line in an agent limits them. | `tools:` line in each agent | Always |
| **Hooks** | Small scripts that run automatically before or after Claude acts. | `.claude/hooks/*.py` + `settings.json` | Automatically |
| **Permissions** | Lists of what Claude may do without asking, must ask about, or never do. | `.claude/settings.json` | Automatically |
| **MCP connectors** | Connections to outside apps: GitHub (branches, pull requests) and Figma (read designs). | `.mcp.json` | Sign in once with `/mcp` |
| **Plan mode** | Claude writes a plan and waits for your approval before editing. | built in (Shift+Tab) | Use at the start of big tasks |
| **Reference docs** | The wireframe map and API contract keep Claude (and humans) aligned. | `docs/*.md` | Skills and agents read them |

### Skills vs agents in one line
**Skills build, agents review.** A skill runs in your chat and can edit code. An agent works on its own with a limited set of tools and sends back a report, so a read-only agent (`Read, Grep, Glob`) can never change your files. Exception: an agent given `Edit, Write, Bash` can build too.

### Which skill for which wireframe screens
| Wireframe screens | Skill |
|---|---|
| Home, Login, Register, Registration success, Login success, Logged out | `/auth-flow` |
| User list, Edit user, Delete user confirm | `/users-crud` |
| Group chat | `/group-chat` |
| Documents, Upload, Edit, Share, Remove share, Delete file | `/documents-module` |
| Database tables | `/db-schema` |
| Any single screen | `/wireframe-to-page` |
| Any extra endpoint | `/api-endpoint` |
| Tests | `/write-tests` |

### Which agent when
| Question | Agent |
|---|---|
| Is it secure? | `@agent-security-auditor` |
| Does it follow our rules? | `@agent-code-reviewer` |
| Is it accessible? | `@agent-accessibility-checker` |
| Do frontend, backend and the contract agree? | `@agent-api-contract-checker` |
| Which wireframe screens are finished? | `@agent-wireframe-compliance-checker` |
| Do tests, lint and build pass? | `@agent-test-runner` |

---

## 4. Recommended workflow

1. **Plan** — start Claude, switch to plan mode, ask for project skeletons. Approve.
2. **Database** — `/db-schema ...`
3. **Auth** — `/auth-flow ...`
4. **Users** — `/users-crud ...`
5. **Chat** — `/group-chat ...`
6. **Documents** — `/documents-module ...`
7. **Tests** — `/write-tests ...`
8. **Review** — run the six agents.
9. **Fix** what they report, run `@agent-test-runner`.
10. **Ship** — ask Claude to commit on a branch and open a pull request (it will ask before commit and push).

Exact prompts for each step are in `docs/PROMPTS.md`.

---

## 5. Connect GitHub and Figma (MCP)

`.mcp.json` lists the two servers. It holds **no secrets**.

1. Start `claude` in the project and type `/mcp`.
2. Pick `github`, choose Authenticate, sign in in the browser.
3. Do the same for `figma`.

Check the server addresses in `/mcp` against each vendor's current documentation, because they can change. Never paste tokens or client secrets into the chat or into this file.

---

## 6. Safety built in

- `.env` files and keys cannot be read or written by Claude (permissions and hook).
- `git commit` and `git push` always ask you first. Force-push, `rm -rf` and `git reset --hard` are denied.
- Direct `mysql` and `mysqldump` commands are denied. Run database changes yourself.
- After each Python or TypeScript edit, a hook checks syntax or lint and tells Claude to fix problems immediately.
- Review agents cannot edit files.

---

## 7. Things to decide with your team

The wireframe does not show these, so the kit makes a safe assumption (listed in `copy-to-project/docs/wireframe-map.md`):

- Can a user delete their own account? (default: blocked)
- Do users have roles (admin vs normal)? (default: all users equal, as drawn)
- Is chat manual refresh only, or live? (default: Refresh button plus optional polling)
- Allowed file types and maximum upload size (default: common office/image types, 10 MB)

---

## 8. What was not tested

- The hook scripts were run on their own with sample input (they block `.env`, allow `.env.example`, catch a Python syntax error) and `settings.json` is valid JSON, but nothing was run inside a live Claude Code session.
- The kit has not been used to build the application. Review the first results from each skill and adjust the `SKILL.md` text to your team's taste.
- MCP server URLs were not verified against live servers.

## 9. Customising

- Rules wrong or missing? Edit `CLAUDE.md`. Keep it short and specific.
- A skill produces something you do not like? Edit its `SKILL.md`, the steps are plain English.
- Want a stricter or looser agent? Change its `tools:` line. `Read, Grep, Glob` = read-only. Add `Edit, Write` to let it change files, `Bash` to let it run commands.
- Skills and agents are plain Markdown files. No programming needed.
