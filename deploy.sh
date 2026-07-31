#!/usr/bin/env bash
#
# deploy.sh — Deployment des statischen Frontends (Dashboard + tracker.js)
#
# Was dieses Skript tut:
#   * Laedt das neueste GitHub-Release (dashboard-release.zip) des Projekts
#     herunter und entpackt es nach "$DEPLOY_DIR/dashboard".
#   * Kopiert den darin gebauten tracker.js nach "$DEPLOY_DIR/tracker.js".
#   * Die Dateien sind sofort unter /srv/websites/analytics/... erreichbar,
#     weil Caddy /home/webadmin/websites als /srv/websites (read-only) mountet.
#
# Was dieses Skript NICHT tut:
#   * Es aktualisiert KEIN Backend-Docker-Image. Das uebernimmt Watchtower
#     (automatisch) bzw. Portainer (manuell: Stack -> "Update").
#   * Es veraendert keine Caddyfile-Konfiguration.
#
# Das Skript ist idempotent und kann gefahrlos mehrfach ausgefuehrt werden.

set -euo pipefail

DEPLOY_DIR="/home/webadmin/websites/analytics"
REPO="reisi007/analytics"
RELEASE_URL="https://github.com/${REPO}/releases/latest/download/dashboard-release.zip"

TAG=$(curl -fLs -o /dev/null -w '%{url_effective}' "$RELEASE_URL" \
    | sed -E 's#.*/download/([^/]+)/.*#\1#')

TMP_ZIP=$(mktemp)
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_ZIP" "$TMP_DIR"' EXIT

mkdir -p "$DEPLOY_DIR"

echo "Lade Release herunter: $RELEASE_URL"
curl -fL -o "$TMP_ZIP" "$RELEASE_URL"

echo "Entpacke nach: $TMP_DIR"
unzip -q "$TMP_ZIP" -d "$TMP_DIR"

echo "Ersetze: $DEPLOY_DIR/dashboard"
rm -rf "$DEPLOY_DIR/dashboard"
mv "$TMP_DIR/dist" "$DEPLOY_DIR/dashboard"

echo "Kopiere: tracker.js"
cp "$DEPLOY_DIR/dashboard/tracker.js" "$DEPLOY_DIR/tracker.js"

echo
echo "Deployment abgeschlossen (Version: ${TAG:-unbekannt})"
echo "  Dashboard: /srv/websites/analytics/dashboard"
echo "  Tracker:   /srv/websites/analytics/tracker.js"
