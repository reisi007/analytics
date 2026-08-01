#!/usr/bin/env bash
set -euo pipefail

echo "==================================================="
echo "🔄 Starte reinen Rclone Sync zum Server..."
echo "==================================================="

# 1. Backend (Laravel) — ohne vendor/.env/Tests/Storage-Caches
echo "📦 Sync: Backend (laravel)..."
rclone sync ./laravel reisinger.pictures:/api-analytics.reisinger.pictures \
  --filter-from rclone-backend-filter.txt \
  --transfers=50 --track-renames --progress

# 2. Frontend (Dashboard dist: tracker.js + dashboard/)
echo "🎨 Sync: Frontend (dist)..."
DIST="./dashboard/dist"
if [ ! -d "$DIST" ]; then
  echo "Fehler: dist nicht gefunden — bitte vorher pnpm build im dashboard/ ausführen ($DIST)" >&2
  exit 1
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/dashboard"
cp "$DIST/x7k2p.js" "$STAGE/x7k2p.js"
cp -r "$DIST/"* "$STAGE/dashboard/"
rm -f "$STAGE/dashboard/track-test.html"

rclone sync "$STAGE" reisinger.pictures:/analytics \
  --transfers=50 --track-renames --progress

echo ""
echo "✅ Sync abgeschlossen!"
