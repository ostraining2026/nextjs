#!/usr/bin/env python3
"""PostToolUse hook: quick check after every file edit.

- .py files  -> byte-compile to catch syntax errors straight away.
- .ts/.tsx   -> run ESLint on that one file (only if frontend/node_modules exists).

Exit code 2 sends the problem back to Claude so it fixes it in the same turn.
Everything else exits 0 and stays silent.
"""
import json
import os
import subprocess
import sys

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

path = (data.get("tool_input") or {}).get("file_path", "")
project = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())


def fail(title: str, output: str) -> None:
    sys.stderr.write(f"{title}\n{output.strip()[:2000]}\n")
    sys.exit(2)


if path.endswith(".py"):
    result = subprocess.run(
        [sys.executable, "-m", "py_compile", path], capture_output=True, text=True
    )
    if result.returncode != 0:
        fail(f"Python syntax error in {path}:", result.stderr)

elif path.endswith((".ts", ".tsx")):
    frontend = os.path.join(project, "frontend")
    if os.path.isdir(os.path.join(frontend, "node_modules")):
        result = subprocess.run(
            ["npx", "--no-install", "eslint", path],
            cwd=frontend, capture_output=True, text=True, timeout=120,
        )
        if result.returncode != 0:
            fail(f"ESLint problems in {path}:", result.stdout + result.stderr)

sys.exit(0)
