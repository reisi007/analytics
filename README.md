# Analytics

DSGVO-konformes Webanalyse-System für die Domains `reisinger.pictures` und `all-the.rest`.
Privates Monorepo: Laravel-Backend (API), React-SPA (Dashboard), komprimierter Tracker und E2E-Tests.

## Überblick

- **DSGVO-konform:** Es werden weder IP-Adressen noch Cookies gespeichert. Unique Visits werden über einen
  `session_hash = sha256(ip + user_agent + datum)` ermittelt — die IP ist damit nur Eingabe in einen
  Einweg-Hash und wird nirgends persistiert.
- **Zwei Zieldomains:** `stats.reisinger.pictures` und `stats.all-the.rest`.
- **Domain-Detection:** Die Site wird nicht im Tracker konfiguriert. Der Server erkennt die Ziel-Domain über den
  HTTP `Referer` des Track-Requests.
- **Subdomains eigenständig:** Subdomains (z. B. `dev.reisinger.pictures`) sind eigene Sites mit eigenen Stats
  und Report-Mails. Nur `www.*` wird auf die Apex-Domain zusammengeführt.
- **Realtime:** Live-Daten via SSE (`GET /ingest/stream`).

## Architektur

- **Backend:** Laravel 13, PHP 8.5, Postgres 18. Reine API ohne Laravel-UI. Läuft als Docker-Image
  `ghcr.io/reisi007/analytics` (php:8.5-fpm-alpine).
- **Frontend:** React 19 + Vite 8 + TypeScript 7 + daisyUI 5. Wird **statisch** von Caddy aus
  `/srv/websites/analytics/` ausgeliefert (Server-Mount `/home/webadmin/websites`), `/ingest/*` wird von Caddy an
  `analytics_php:9000` durchgereicht. `tracker.js` entsteht als Teil des Frontend-Builds.
- **CI/CD:** GitHub Actions baut, testet und releast (siehe Abschnitt CI/CD). **Watchtower** hält das
  Backend-Image automatisch aktuell; Frontend-Updates laufen über `./sync.sh`.
- **Auth:** JWT (`tymon/jwt-auth`); `/ingest/stats/*` und `/ingest/stream` sind geschützt, `/ingest/track` bleibt öffentlich.

```
Browser ── tracker.js ──► stats.*/ingest/track ──► Caddy ──► analytics_php:9000 (PHP-FPM)
                                                        └────────► Postgres (analytics_db)
Dashboard (SPA, statisch) ──► stats.*/ingest/stats/* ──► Caddy ──► analytics_php:9000
```

## Struktur

```
.
├── laravel/                  # Backend (Laravel 13 API)
├── dashboard/                # Frontend (React SPA + tracker.js-Build)
├── e2e/                      # Playwright-E2E-Tests
├── docker/
│   └── Dockerfile            # Backend-Image (php:8.5-fpm-alpine, pdo_pgsql)
├── docker-compose.local.yml  # Lokale Infra: Postgres :5433, Mailpit :1027/:8027
├── docker-compose.test.yml   # E2E-Stack: Postgres :5434, Mailpit :1028/:8028, Web :8081
├── deployment/
│   └── docker-compose.prod.yml  # Portainer-Stack für Produktion (webnet)
├── Caddyfile.e2e             # Caddy-Konfiguration für den E2E-Stack
├── .github/workflows/ci.yml  # CI/CD-Pipeline
├── sync.sh                   # Frontend-Deployment via rclone auf den Produktionsserver
└── .git-cliff.toml           # Changelog-Konfiguration
```

## Lokale Entwicklung

### Infra

Postgres und Mailpit als Docker-Container starten:

```bash
docker compose -f docker-compose.local.yml up -d
```

- Postgres: `localhost:5433` (DB `analytics`, User `analytics`, Passwort `analytics`)
- Mailpit: SMTP `localhost:1027`, Web-UI `http://localhost:8027`

### Backend (Laravel Herd)

Das Backend läuft lokal via Herd unter `http://tracking.test` (nur `/ingest/*`, keine UI).

```bash
cd laravel
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
```

Die `.env`-Defaults passen bereits zur lokalen Infra (`DB_PORT=5433`, Mailpit `1027`). Sollte der Wert
`JWT_SECRET` ungesetzt sein, setzt `php artisan jwt:secret` ihn.

### Dashboard (Vite-Dev)

```bash
cd dashboard
pnpm install
pnpm dev
```

Vite läuft auf `http://localhost:5173` und proxyt `/ingest` an `https://tracking.test`. Das Proxy-Ziel lässt sich per `VITE_API_PROXY`-Umgebungsvariable überschreiben und fällt sonst auf `https://tracking.test` zurück.

### Sites seeden

```bash
cd laravel
php artisan migrate --seed
```

legt die Admin-User und die Sites `reisinger.pictures` und `all-the.rest` (plus `localhost`) an.

## Tests

```bash
# Backend (SQLite in-memory)
cd laravel
composer install && cp .env.example .env && php artisan key:generate
php artisan test
php artisan test --parallel --processes=4

# Backend-Tests mit Mailpit (E-Mail-Tests, Test-Mailpit auf :1028/:8028)
docker compose -f docker-compose.test.yml up -d mailpit

# Frontend
cd dashboard
pnpm install
pnpm typecheck
pnpm test:unit
pnpm build

# E2E (Playwright, Stack auf :8081)
cd laravel && docker compose -f docker-compose.test.yml up -d
docker compose -f docker-compose.test.yml exec -T php php artisan migrate --seed --force
cd ../e2e && npx playwright install --with-deps && npx playwright test
```

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) auf jedem Push/PR:

| Job | Aufgabe |
|---|---|
| `php-tests` | PHPUnit (parallel, `--processes=4`), Mailpit-Service auf :1028/:8028 |
| `frontend-tests` | Typecheck, Vitest-Unit-Tests, Produktions-Build |
| `build-image` | Baut das Laravel-Image nach `ghcr.io/reisi007/analytics` (main → `latest`/`test`, PR → `pr-N`/`test`, sonst Branch-Name) |
| `e2e-tests` | Playwright gegen den `test`-Stack (hängt an `build-image`) |
| `release` | Nur main: git-cliff-Changelog, Tag `v<version>`, GitHub-Release mit `dashboard-release.zip` |

## Deployment (Portainer)

Das Backend läuft als Portainer-Stack im Docker-Environment; das Frontend wird statisch von Caddy serviert.

1. **Stack anlegen:** Portainer → Stacks → Add stack. Namen `analytics` verwenden und `deployment/docker-compose.prod.yml`
   hochladen (oder die Git-URL des Repos hinterlegen). Das externe Netz `webnet` muss existieren.
2. **ENV-Variablen setzen** (Stack → Edit → Environment Variables). Ohne `APP_KEY`/`JWT_SECRET` verweigert der
   Gatekeeper den Start im `production`-Modus (Container beendet sich mit `FATAL: APP_KEY/JWT_SECRET fehlt`):

   | Variable | Wert (Beispiel) |
   |---|---|
   | `APP_ENV` | `production` |
   | `APP_DEBUG` | `false` |
   | `APP_URL` | `https://stats.reisinger.pictures` |
   | `APP_KEY` | `base64:...` (via `php artisan key:generate`) |
   | `JWT_SECRET` | geheimer Wert (via `php artisan jwt:secret`) |
   | `DB_PASSWORD` | Datenbank-Passwort |
   | `MAIL_MAILER` | `gmail_rest` (Gmail OAuth2 REST) |
   | `MAIL_HOST` | nur bei SMTP-Mode nötig (z. B. `smtp.gmail.com`) |
   | `MAIL_PORT` | nur bei SMTP-Mode nötig (z. B. `587`) |
   | `MAIL_FROM_ADDRESS` | z. B. `stats@reisinger.pictures` |
   | `REPORT_EMAIL` | Empfänger des Weekly Reports |
   | `OAUTH_CLIENT_ID` | Google OAuth Client ID (Gmail REST) |
   | `OAUTH_CLIENT_SECRET` | Google OAuth Client Secret |
   | `OAUTH_REFRESH_TOKEN` | Google OAuth Refresh Token |
   | `MAKE_WEBHOOK_URL` | Make.com-Webhook für Mail-/Token-Fehler-Alerts |
   | `MAKE_API_KEY` | Make.com-API-Key für den Webhook |
   | `CHECK_INTERVAL` | Sekunden zwischen Token-Checks (Default `86400`) |
    | `ANALYTICS_ADMIN_EMAIL` | Admin-Login (JWT) |
    | `ANALYTICS_ADMIN_PASSWORD` | Admin-Passwort |
    | `ANALYTICS_TIMEZONE` | Report-Zeitzone für Tages-Aggregation/Wochenbericht (z. B. `Europe/Berlin`) |

   Beim Start führt der Stack `php artisan migrate --force` **und** `php artisan db:seed --force` aus:
   Migrationen werden automatisch angewendet, und die idempotenten Seeder legen den Admin-User (aus
   `ANALYTICS_ADMIN_EMAIL`/`ANALYTICS_ADMIN_PASSWORD`) sowie die CORS-Whitelist (`reisinger.pictures`,
   `all-the.rest`) an. Weitere Sites lassen sich via `sites:add` verwalten (siehe unten).

   Als Referenz für die Portainer-ENV-Variablen liegt `.env.production` im Projekt-Root (gitignored) mit den
   generierten Werten für `APP_KEY` und `JWT_SECRET` sowie Platzhaltern für die übrigen Secrets.

   Neben `analytics_php`/`analytics_worker`/`analytics_scheduler` läuft der Sidecar `analytics_token_checker`:
   Er prüft alle `CHECK_INTERVAL` Sekunden die Gültigkeit des Gmail-OAuth2-Refresh-Tokens (POST an
   `oauth2.googleapis.com`) und sendet bei einem Fehler einen Alert an den Make.com-Webhook
   (`MAKE_WEBHOOK_URL`). Das Netz `analytics_internal` hat dafür Internet-Egress (Gmail REST + Make.com); die
   DB bleibt über keine Host-Ports erreichbar.

3. **Caddyfile aktivieren:** Im caddyfile-Repo den Block für `stats.reisinger.pictures, stats.all-the.rest`
   prüfen (FastCGI-Proxy auf `analytics_php:9000`, `flush_interval -1` für SSE) und per `./sync.sh` deployen.
4. **Frontend aktualisieren:** Lokal `./sync.sh` ausführen — lädt das neueste `dashboard-release.zip` herunter
   und rclone-synct das statische Frontend (Dashboard + `tracker.js`) per SFTP nach
   `/home/webadmin/websites/analytics` (auf dem Server erreichbar unter `/srv/websites/analytics`).
5. **Watchtower (optional):** Ein Watchtower-Container hält das Backend-Image automatisch aktuell, z. B.:

   ```
   docker run -d --name watchtower \
     -v /var/run/docker.sock:/var/run/docker.sock \
     ghcr.io/containrrr/watchtower --interval 86400 --cleanup
   ```

   Watchtower aktualisiert nur das Image — Dashboard-Updates bleiben bei `./sync.sh`.

## Sites verwalten

Welche Domains Analytics aufzeichnen darf, steht in der DB-Tabelle `sites` (CORS-Whitelist). `/ingest/track`
akzeptiert nur Referrer-Origins, deren Host dort eingetragen ist (sonst 403).

```bash
# Site hinzufügen (inkl. Aliase)
php artisan sites:add example.de --aliases=blog.example.de,www.example.de

# Liste aller Sites
php artisan sites:list
```

## Wöchentlicher Report

`report:weekly` erstellt den Wochenbericht per E-Mail und läuft via `analytics_scheduler` jeden **Montag um 9:00**
(`REPORT_SCHEDULE`). Empfänger ist `REPORT_EMAIL`. Es werden alle Sites mit Daten ausgewertet (inkl. Subdomains)
sowie die konfigurierten Sites. Das HTML-Template ist mailclient-kompatibel gebaut (nur Inline-Styles,
Tabellen-Layout, Ziel ≥ 90 % Mailpit-Compatibility-Score).
