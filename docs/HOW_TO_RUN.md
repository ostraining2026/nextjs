# How to run the project

You need three things running: **MySQL**, the **Flask backend**, and the **Next.js frontend**.
Commands below are for Windows (PowerShell). All paths are from the project root (`dashboard/`).

## 0. Prerequisites

- Node.js 20+ and npm
- Python 3.10+
- MySQL Server 8+ (or MariaDB) with the `mysql` command available

## 1. Create the database (once)

```powershell
mysql -u root -p < backend/schema.sql
```

This creates the database `communications_app`, the four tables, and a MySQL user
`comms_user` (password `comms_password`). **Change that password** in `schema.sql` before
running it if this is anything other than your own laptop.

## 2. Start the backend (Flask)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Open `backend/.env` and set `SECRET_KEY` to a long random string. If you changed the MySQL
password, update `DATABASE_URL` too:
`mysql+pymysql://comms_user:YOUR_PASSWORD@localhost:3306/communications_app`

Optional demo data (alice@example.com / bob@example.com, password `password123`):

```powershell
python seed.py
```

Run the server:

```powershell
flask --app app run --debug
```

Check it: open http://127.0.0.1:5000/api/health → `{"status":"ok"}`.

API docs (Swagger UI): http://127.0.0.1:5000/api/docs. Log in with `POST /auth/login` first, then try the other endpoints.

## 3. Start the frontend (Next.js)

In a **second** terminal, from the project root:

```powershell
npm install
npm run dev
```

Open http://localhost:3000.

If Flask is not on `http://127.0.0.1:5000`, set `FLASK_URL` (for example in a `.env.local`
file in the project root: `FLASK_URL=http://127.0.0.1:5001`) and restart `npm run dev`.

## 4. Try it

1. Home → **Register** → create an account → "Registration Successful".
2. **Login** → "Login Successful, Welcome ! your@email".
3. **Manage Users**: edit or delete users. Register a second account to have someone to share with.
4. **Group Chat**: send a message, press Refresh.
5. **Manage Documents** → **+ Add Upload** → pick a file. Use **Share** to share it with another
   user, then log in as that user to see it under "Shared Uploads".

## Tests and checks

```powershell
# Backend (from backend/, venv active): 30 tests. In-memory SQLite, no MySQL needed.
python -m pytest

# Frontend (from project root): 26 tests with Vitest. No Flask needed.
npm test
npm run lint
npm run build
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Cannot reach the server" in the UI | Flask is not running, or `FLASK_URL` is wrong |
| `Access denied for user 'comms_user'` | `DATABASE_URL` password does not match the MySQL user |
| `Unknown database 'communications_app'` | Run step 1 |
| `ModuleNotFoundError` in Flask | Activate the venv and run `pip install -r requirements.txt` |
| Script blocked when activating venv | `Set-ExecutionPolicy -Scope Process Bypass`, then activate again |
| File upload rejected | Type not in the allow-list, or larger than 10 MB (`MAX_UPLOAD_MB` in `.env`) |
| Port 3000 or 5000 in use | Stop the other program, or run on another port (`npm run dev -- -p 3001`, `flask ... run --port 5001`) |
