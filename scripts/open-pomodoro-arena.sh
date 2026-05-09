#!/usr/bin/env bash
set -euo pipefail

SITE_URL="${CODEX_POMODORO_ARENA_URL:-https://codex-pomodoro-arena.vercel.app/}"

if command -v open >/dev/null 2>&1; then
  open -a "Google Chrome" "$SITE_URL" >/dev/null 2>&1 || open "$SITE_URL" >/dev/null 2>&1 || true
elif command -v google-chrome >/dev/null 2>&1; then
  google-chrome "$SITE_URL" >/dev/null 2>&1 || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$SITE_URL" >/dev/null 2>&1 || true
fi

echo "Codex Pomodoro Arena opened at $SITE_URL"
