#!/usr/bin/env zsh
set -euo pipefail

cd "$(cd "$(dirname "$0")" && pwd)"

echo "==================================================="
echo "🚀 Starte E2E-Stack (on-demand)..."
echo "==================================================="

# 1. Dev-Stack (Postgres :5433 + Mailpit :1027/:8027) sicherstellen.
#    PHPUnit-Mail-Tests nutzen den Dev-Mailpit; der E2E-Stack bleibt in sich geschlossen.
DEV_ALREADY="false"
if docker compose -f docker-compose.local.yml ps --status running 2>/dev/null | grep -q "Up"; then
  echo "✅ Dev-Stack läuft bereits (Postgres :5433, Mailpit :1027/:8027)."
  DEV_ALREADY="true"
else
  echo "⏳ Starte Dev-Stack (Postgres :5433, Mailpit :1027/:8027)..."
  docker compose -f docker-compose.local.yml up -d
fi

# 2. E2E-Stack (Web :8081) sicherstellen — nur on-demand starten.
E2E_ALREADY="false"
if curl -sf --retry 2 --retry-delay 2 http://localhost:8081/ >/dev/null; then
  echo "✅ E2E-Stack ist erreichbar (:8081)."
  E2E_ALREADY="true"
else
  echo "⏳ Starte E2E-Stack (docker-compose.test.yml)..."
  IMAGE_TAG=test docker compose -f docker-compose.test.yml up -d --build
  echo "⏳ Migrate + Seed auf dem E2E-Backend..."
  docker compose -f docker-compose.test.yml exec -T php php artisan migrate --seed --force
fi

echo ""
echo "==================================================="
echo "✅ Zusammenfassung:"
if [ "$DEV_ALREADY" = "true" ]; then
  echo "  - Dev-Stack:  bereits gestartet"
else
  echo "  - Dev-Stack:  neu gestartet"
fi
if [ "$E2E_ALREADY" = "true" ]; then
  echo "  - E2E-Stack:  bereits erreichbar"
else
  echo "  - E2E-Stack:  neu gestartet"
fi
echo "  → Tests starten: cd e2e && npx playwright test"
echo "==================================================="
