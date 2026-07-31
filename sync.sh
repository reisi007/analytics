#!/usr/bin/env bash
set -euo pipefail

REMOTE="reisinger.pictures:/analytics"
RELEASE_URL="https://github.com/reisi007/analytics/releases/latest/download/dashboard-release.zip"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Lade neuestes Release herunter..."
curl -fL -o "$TMP/dashboard-release.zip" "$RELEASE_URL"
VERSION="$(curl -sIL "$RELEASE_URL" | grep -i '^location:' | sed -E 's#.*/download/(v[^/]+)/.*#\1#' | tr -d '\r' | tail -1)"
echo "Release: ${VERSION:-unbekannt}"

unzip -q "$TMP/dashboard-release.zip" -d "$TMP/release"

# Ziel-Layout: <remote>/tracker.js + <remote>/dashboard/*
STAGE="$TMP/stage/analytics"
mkdir -p "$STAGE/dashboard"
cp "$TMP/release/dist/tracker.js" "$STAGE/tracker.js"
cp -r "$TMP/release/dist/"* "$STAGE/dashboard/"
rm -f "$STAGE/dashboard/track-test.html"

echo "Synchronisiere Dashboard via rclone..."
rclone sync "$STAGE" "$REMOTE" --transfers=50 --track-renames --progress

echo "Deploy abgeschlossen: /srv/websites/analytics (tracker.js + dashboard/)"
