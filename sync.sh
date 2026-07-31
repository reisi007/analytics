#!/usr/bin/env bash
set -euo pipefail

REMOTE="reisinger.pictures:/analytics"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

MODE="${1:-}"
case "$MODE" in
  "")
    DIST="$SCRIPT_DIR/dashboard/dist"
    if [ ! -d "$DIST" ]; then
      echo "Fehler: dist nicht gefunden — bitte vorher pnpm build im dashboard/ ausführen ($DIST)" >&2
      exit 1
    fi
    ;;
  release)
    DIST="$TMP/release/dist"
    echo "Lade neuestes Release herunter..."
    gh release download --repo reisi007/analytics --pattern dashboard-release.zip --dir "$TMP" --clobber
    VERSION="$(gh release view --repo reisi007/analytics --json tagName --jq .tagName)"
    echo "Release: ${VERSION:-unbekannt}"
    unzip -q "$TMP/dashboard-release.zip" -d "$TMP/release"
    ;;
  *)
    echo "usage: $0 [release]" >&2
    exit 1
    ;;
esac

# Ziel-Layout: <remote>/tracker.js + <remote>/dashboard/*
STAGE="$TMP/stage/analytics"
mkdir -p "$STAGE/dashboard"
cp "$DIST/tracker.js" "$STAGE/tracker.js"
cp -r "$DIST/"* "$STAGE/dashboard/"
rm -f "$STAGE/dashboard/track-test.html"

echo "Synchronisiere Dashboard via rclone..."
rclone sync "$STAGE" "$REMOTE" --transfers=50 --track-renames --progress

echo "Deploy abgeschlossen: /srv/websites/analytics (tracker.js + dashboard/)"
