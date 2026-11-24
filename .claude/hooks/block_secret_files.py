#!/usr/bin/env python3
"""PreToolUse hook: stop Claude from writing real secret files.

Claude Code sends the tool call as JSON on stdin. Exit code 2 blocks the call
and the message on stderr is shown to Claude so it can correct itself.
"""
import json
import os
import sys

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)  # never break the session because of a hook problem

path = (data.get("tool_input") or {}).get("file_path", "")
name = os.path.basename(path)

# .env.example is allowed. Real env files and key files are not.
blocked_names = {".env", ".env.local", ".env.production"}
blocked_suffixes = (".pem", ".key")

if name in blocked_names or name.endswith(blocked_suffixes):
    sys.stderr.write(
        f"Blocked: {name} may contain secrets. Put variable NAMES in .env.example "
        "and ask the user to fill in real values themselves.\n"
    )
    sys.exit(2)

sys.exit(0)
