#!/bin/bash
# Dev-server watchdog: keeps `bun run dev` alive on port 3000.
# - Probes BOTH /api/health AND the landing page document: a server can pass
#   health while a route compile is hung (seen in practice — Turbopack
#   deadlock after a crash-restart cycle).
# - Requires 3 consecutive failed checks (~30s) before restarting, so slow
#   on-demand route compiles are never mistaken for a dead server.
# - Restart without touching the cache first (fast path).
# - If the server does not come back within ~60s, clear the Turbopack cache
#   (`.next/`) and retry — the documented fix for the corrupted-cache crash.
cd /home/z/my-project

HEALTH_URL=http://localhost:3000/api/health
DOC_URL=http://localhost:3000/
FAILS=0

health() {
  curl -s -o /dev/null --max-time 15 "$HEALTH_URL" &&
    curl -s -o /dev/null --max-time 20 "$DOC_URL"
}

start_server() {
  (setsid nohup bun run dev > /dev/null 2>&1 &)
}

wait_up() {
  local deadline=$((SECONDS + $1))
  while [ $SECONDS -lt $deadline ]; do
    if health; then return 0; fi
    sleep 2
  done
  return 1
}

kill_port() {
  lsof -ti:3000 2>/dev/null | xargs -r kill -9
  pkill -9 -f "next dev" 2>/dev/null
  pkill -9 -f "next-server" 2>/dev/null
  sleep 1
}

while true; do
  if health; then
    FAILS=0
  else
    FAILS=$((FAILS + 1))
    echo "$(date '+%H:%M:%S') watchdog: health miss #$FAILS" >> /tmp/dev-watchdog.log
    if [ "$FAILS" -ge 3 ]; then
      echo "$(date '+%H:%M:%S') watchdog: restarting dev server" >> /tmp/dev-watchdog.log
      kill_port
      start_server
      if ! wait_up 60; then
        echo "$(date '+%H:%M:%S') watchdog: cold start failed — clearing .next" >> /tmp/dev-watchdog.log
        kill_port
        rm -rf /home/z/my-project/.next 2>/dev/null
        start_server
        wait_up 90
      fi
      FAILS=0
    fi
  fi
  sleep 10
done
