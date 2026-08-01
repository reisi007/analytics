<p align="center">
  <img src="dashboard/public/favicon.svg" alt="Analytics Logo" width="120" />
</p>

# Analytics

DSGVO-konformes Webanalyse-System für die Domains `reisinger.pictures` und `all-the.rest`.
Monorepo (öffentliches GitHub-Repo `reisi007/analytics`): Laravel-Backend (API), React-SPA (Dashboard), komprimierter Tracker und E2E-Tests.

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
  Backend-Image automatisch aktuell (Variante A); Backend- und Frontend-Updates laufen über `./sync.sh`
  (Variante B).
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
│   ├── docker-compose.prod.yml        # Variante A: Portainer-Stack mit Image (öffentlich)
│   └── docker-compose.prod.files.yml  # Variante B: Files-Upload-Deploy ohne eigenes Image
├── Caddyfile.e2e             # Caddy-Konfiguration für den E2E-Stack
├── .github/workflows/ci.yml  # CI/CD-Pipeline
├── sync.sh                   # Backend+Frontend-Deployment via rclone (portal-Modell)
├── rclone-backend-filter.txt # Filter für den Backend-Sync (kein vendor/.env/tests)
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

# Backend-Tests mit Mailpit (E-Mail-Tests, Test-Mailpit auf :1028/:8028) — vom Repo-Root aus
cd ..
docker compose -f docker-compose.test.yml up -d mailpit

# Frontend
cd dashboard
pnpm install
pnpm typecheck
pnpm test:coverage
pnpm build

# E2E (Playwright, Stack auf :8081) — docker-compose.test.yml liegt im Repo-Root
# Die Tests legen eigene eindeutige Sites an und räumen sie auf → kein leeres DB nötig,
# Stack ist wiederholbar ohne down -v (optional: docker compose -f docker-compose.test.yml down -v).
cd ..
docker compose -f docker-compose.test.yml up -d
docker compose -f docker-compose.test.yml exec -T php php artisan migrate --seed --force
cd e2e && npx playwright install --with-deps && npx playwright test
```

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) auf jedem Push/PR:

| Job | Aufgabe |
|---|---|
| `php-tests` | PHPUnit (parallel, `--processes=4`) inkl. Coverage (`--coverage`), Mailpit-Service auf :1028/:8028 |
| `frontend-tests` | Typecheck, Vitest-Unit-Tests inkl. Coverage (`pnpm test:coverage`), Produktions-Build |
| `build-image` | Baut das Laravel-Image nach `ghcr.io/reisi007/analytics` und gibt den `image-tag`-Output aus (main → `latest`/`test`, PR → `pr-N-test`, Tag/Branch → `<ref>`/`test`) |
| `e2e-tests` | Playwright gegen den vom `build-image` gebauten `image-tag`-Stack (hängt an `build-image`), Report-Upload bei Fehlern |
| `release` | Nur bei `v*`-Tag-Push: git-cliff-Changelog (`--latest`), GitHub-Release mit `dashboard-release.zip` |

**Empfohlen (Branch-Protection):** Für `main` sollte im Repo eine Branch-Protection mit den required status checks
`php-tests`, `frontend-tests` und `e2e-tests` eingerichtet werden, damit Merges nur mit grüner Pipeline möglich sind.

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
    | `STREAM_POLL_SECONDS` | Poll-Intervall des SSE-Realtime-Streams (Default `2`, Prod `5`) |
    | `STREAM_MAX_RUNTIME` | Maximale Laufzeit des SSE-Streams in Sekunden, danach Reconnect (Default `300`) |
    | `FPM_MAX_CHILDREN` | PHP-FPM-Pool: max. gleichzeitige Worker (Default `10`) — wird beim Start in `zz-analytics.conf` gesetzt |

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
4. **Backend & Frontend aktualisieren:** Lokal `./sync.sh` ausführen — rclone-synct das Backend (`laravel/`,
   ohne `vendor/`, `.env`, Tests und Storage-Caches) nach `/home/webadmin/websites/api-analytics.reisinger.pictures`
   und das Frontend (`tracker.js` + `dashboard/`) nach `/home/webadmin/websites/analytics` (auf dem Server
   erreichbar unter `/srv/websites/…`). `vendor/` erzeugt der `composer_init`-Service beim Stack-Start.
5. **Watchtower (optional):** Ein Watchtower-Container hält das Backend-Image automatisch aktuell, z. B.:

   ```
   docker run -d --name watchtower \
     -v /var/run/docker.sock:/var/run/docker.sock \
     ghcr.io/containrrr/watchtower --interval 86400 --cleanup
   ```

   Watchtower aktualisiert nur das Image (Variante A) — Backend- und Frontend-Updates bleiben bei `./sync.sh`.

### Variante B: Files-Upload-Deploy (ohne eigenes Image)

Wer kein eigenes Backend-Image bauen/releasen möchte (Variante A), nutzt das gemeinsame Basis-Image
`ghcr.io/reisi007/php-postgres:8.5` (PHP-FPM + `pdo_pgsql`) und legt die Laravel-Dateien direkt auf dem Server ab.
Ein Dockerfile wird nur für Variante A benötigt — hier nicht.

1. **Backend & Frontend hochladen:** Lokal `./sync.sh` ausführen — rclone-synct das Backend (`laravel/`, ohne
   `vendor/`, `.env`, Tests und Storage-Caches) nach `/home/webadmin/websites/api-analytics.reisinger.pictures`
   und das Frontend (`tracker.js` + `dashboard/`) nach `/home/webadmin/websites/analytics`. `.env` wird bewusst
   nicht hochgeladen — alle Secrets kommen über die Stack-ENV-Variablen (siehe unten); `vendor/` erzeugt der
   `composer_init`-Service beim Stack-Start.
2. **Stack starten:** `deployment/docker-compose.prod.files.yml` als Portainer-Stack anlegen (oder
   `docker compose -f deployment/docker-compose.prod.files.yml up -d`). Der einmalige Service `composer_init`
   führt `composer install` im gemounteten Verzeichnis aus; erst danach startet `analytics_php`, wendet beim
   Start Migrationen/Seeds/Caches an und startet PHP-FPM. Der Bind-Mount-Pfad
   `/home/webadmin/websites/api-analytics.reisinger.pictures` ist fest im Compose-File verdrahtet (wie bei
   `form.reisinger.pictures`).
3. **ENV-Variablen:** identisch zu Variante A (Tabelle oben). Ohne `APP_KEY`/`JWT_SECRET` verweigert der
   Gatekeeper den Start im `production`-Modus.
4. **Caddyfile:** keine Änderung nötig — der Block für `stats.reisinger.pictures, stats.all-the.rest` proxyed
   weiterhin an `analytics_php:9000` (`SCRIPT_FILENAME /var/www/html/public/index.php`).
5. **Update:** erneut `./sync.sh` ausführen und `analytics_php` neu starten (Migrationen laufen beim Start
   erneut). Bei neuen Composer-Abhängigkeiten `composer_init` einmalig re-starten
   (`docker compose -f deployment/docker-compose.prod.files.yml up composer_init`).

## Sites verwalten

Welche Domains Analytics aufzeichnen darf, steht in der DB-Tabelle `sites` (CORS-Whitelist). `/ingest/track`
akzeptiert nur Referrer-Origins, deren Host unter den `aliases` einer Site eingetragen ist (sonst 403).
Der `site`-Name ist ein frei wählbares Label (z. B. „Mein Blog"); die tatsächlichen Hosts/Domains stehen in
`aliases` — jede Track-Domain muss dort gelistet sein (der Apex inklusive).

```bash
# Site hinzufügen (Label + Host-Aliases)
php artisan sites:add "Mein Blog" --aliases=blog.example.de,www.example.de

# Liste aller Sites
php artisan sites:list
```

## Wöchentlicher Report

`report:weekly` erstellt den Wochenbericht per E-Mail und läuft via `analytics_scheduler` jeden **Montag um 9:00**
(`REPORT_SCHEDULE`). Empfänger ist `REPORT_EMAIL`. Es werden alle Sites mit Daten ausgewertet (inkl. Subdomains)
sowie die konfigurierten Sites. Das HTML-Template ist mailclient-kompatibel gebaut (nur Inline-Styles,
Tabellen-Layout, Ziel ≥ 90 % Mailpit-Compatibility-Score).
