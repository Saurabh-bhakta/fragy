#!/usr/bin/env bash
# Start portable MongoDB for NotesHub (no system install needed)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MONGOD="$ROOT/.tools/mongodb/bin/mongod"
DATA="$ROOT/.tools/data"
LOG="$ROOT/.tools/logs/mongod.log"

mkdir -p "$DATA" "$(dirname "$LOG")"

if ! [ -x "$MONGOD" ]; then
  echo "mongod not found at $MONGOD"
  echo "See README for setup."
  exit 1
fi

if pgrep -f "$MONGOD" >/dev/null 2>&1; then
  echo "MongoDB already running."
  exit 0
fi

"$MONGOD" --dbpath "$DATA" --bind_ip 127.0.0.1 --port 27017 --logpath "$LOG" --fork
echo "MongoDB started on 127.0.0.1:27017"
