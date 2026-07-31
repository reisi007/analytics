#!/usr/bin/env bash
set -euo pipefail

REMOTE="reisinger.pictures:/analytics"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Lade neuestes Release herunter..."
VERSION="$(gh release view --repo reisi007/analytics --json tagName --jq .tagName)"
echo "Release: ${VERSION:-unbekannt}"
gh release download --repo reisi007/analytics --pattern dashboard-release.zip --dir "$TMP" --clobber

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
