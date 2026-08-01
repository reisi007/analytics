# ARCHITECTURE.md — Projektwissen & Architektur

> Wissensbasis für den Build Agent (Referenz zu `Agents.md`). Enthält Architektur-Entscheidungen, Infrastruktur-Fakten,
> Deployment, Datenmodell, Code-Landkarte und Konventionen. Bei Änderungen hier aktualisieren.

## Projekt & Tech-Stack

DSGVO-konformes Webanalyse-System für `reisinger.pictures` und `all-the.rest`. Monorepo `reisi007/analytics`
(real **public** laut GitHub-API). Arbeitet von `/Users/florianreisinger/dev/tracking`.

| Schicht | Technologie |
|---|---|
| Backend | Laravel 13.23, PHP 8.5, Postgres 18, Docker `php:8.5-fpm-alpine`, Image `ghcr.io/reisi007/analytics` |
| Frontend | React 19.2 + Vite 8 + TypeScript 7 + daisyUI 5, pnpm 11, Vitest 4, Tailwind 4 |
| Tests | PHPUnit 12 + paratest, Playwright 1.62 |
| Auth | `tymon/jwt-auth` 2.3 (JWT_SECRET, Prod-Pflicht) |
| Deploy | Portainer Stack + ENV-Variablen; rclone-Files-Sync; Caddy (`webnet`) |

Struktur:
```
laravel/                  # Backend (reine API, kein Laravel-View)
dashboard/                # React SPA + x7k2p.js-Tracker-Build
e2e/                      # Playwright-E2E-Tests
docker/Dockerfile         # Backend-Image (pdo_pgsql)
docker-compose.local.yml  # Lokale Infra: Postgres :5433, Mailpit :1027/:8027
docker-compose.test.yml   # E2E-Stack: Postgres :5434, Mailpit :1028/:8028, Web :8081
deployment/               # docker-compose.prod.yml (A) + prod.files.yml (B)
Caddyfile.e2e             # Caddy für E2E-Stack
.github/workflows/ci.yml  # CI/CD
sync.sh                   # rclone-Deploy (portal-Modell)
```

## Architektur-Entscheidungen (fix)

- **API-Prefix `/ingest`:** alle Routen unter `/ingest/*` (`routes/api.php`, `apiPrefix: 'ingest'` in `bootstrap/app.php`). Nicht `/api`.
- **CORS (korrigiert):** Eingebettete Cross-Origin-Skripte laufen im Page-Origin → Track-Request an stats.* ist cross-origin.
  `/ingest/track` antwortet mit `Access-Control-Allow-Origin` = Referer-Origin (kein `*`). Tracker sendet
  `Content-Type: text/plain` (Simple Request, kein Preflight). Dashboard-Reads (same-origin) brauchen kein CORS;
  `HandleCors`-Middleware ist entfernt. Unbekannter Referrer → **403 ohne** `Access-Control-Allow-Origin`.
- **Domain-Detection:** Site wird **nicht** im JS konfiguriert. Server erkennt die Ziel-Domain über den **HTTP Referer**
  des Track-Requests (`SiteDetector::fromRequest`). Site-Liste aus DB-Tabelle `sites` (CORS-Whitelist).
- **Site-Modell (Label + Aliases):** `site` ist ein **frei wählbares Label** (Anzeige-/Gruppierungsname, z. B. „Reisinger
  Pictures"), `aliases` enthält die **Hosts** (Domains/Subdomains). Nur Hosts aus `aliases` werden als Track-Domains
  erkannt — der `site`-Name selbst ist **kein** Host (Apex muss explizit in `aliases` stehen). `SiteDetector` mappt nur
  Alias→Label; das Dashboard matcht in `detectSite()` ebenfalls nur Aliases.
- **Unique Visitor:** `session_hash = sha256(ip + user_agent + datum)` — IP nur Eingabe in Einweg-Hash, wird nirgends
  persistiert (keine `ip`-Spalte im Schema).
- **Subdomains eigenständig:** Subdomains (z. B. `dev.reisinger.pictures`) sind eigene Sites. Nur `www.*` → Apex
  zusammengeführt (`SiteDetector::normalize`). `GenerateWeeklyReport` iteriert **alle Sites mit Daten** + konfigurierte.
- **Combined Overview + Caching:** `site`-Parameter in Stats-APIs optional → ohne `site` Aggregate über alle Sites.
  `GET /ingest/stats/sites` liefert alle Sites (Daten + konfiguriert). Read-APIs via `Cache::remember`
  (summary 300s, events 60s, realtime 15s); SSE bleibt live (ungecacht).
- **Auth (JWT):** `POST /ingest/auth/login` → Bearer-Token. `/ingest/stats/*`, `/ingest/stream`, `/ingest/sites`,
  `/ingest/config/sites` sind `auth:api`-geschützt (Token per Header, SSE via `?token=`). `/ingest/track` bleibt öffentlich.
  Admin-User via Seeder aus `ANALYTICS_ADMIN_EMAIL`/`ANALYTICS_ADMIN_PASSWORD`.
- **Realtime:** SSE (`GET /ingest/stream`), Polling DB alle 2s, `flush_interval -1` im Caddy-Proxy, `X-Accel-Buffering: no`.
- **Report:** wöchentlich (Montag 9:00, `REPORT_SCHEDULE`), Command `GenerateWeeklyReport`. HTML-Template nur Inline-Styles
  (Mailclient-Kompatibilität, Ziel ≥ 90 % Mailpit-Score).
- **Feste Report-Zeitzone:** `ANALYTICS_TIMEZONE` (Default `Europe/Berlin`). `App\Support\ReportTime` für
  Tages-Gruppierung + Wochenbericht (Query-Bounds UTC, Gruppierung in Report-TZ). Scheduler `->timezone()`.
- **Laravel liefert keine UI:** Backend = reine API. Lokal `tracking.test` (Herd) bedient nur `/ingest/*`;
  React via Vite-Dev (`pnpm dev`, Proxy `/ingest` → `https://tracking.test`, `changeOrigin`, `secure:false`).
- **Keine Inline-Styles in React:** In JSX/TSX ausschließlich Tailwind-/daisyUI-Klassen; `style={{...}}` verboten.
- **Frontend-Deploy:** SPA wird statisch von Caddy aus `/srv/websites/analytics/` ausgeliefert (Mount
  `/home/webadmin/websites`). `x7k2p.js` (Tracker-Skript, bewusst unauffälliger Name gegen Adblocker) entsteht als Teil des Frontend-Builds (`vite build` + `vite.tracker.config.ts`),
  kein separates Repo-File. Im CI wird `dashboard/dist` als `dashboard-release.zip` ins GitHub-Release gepackt.
- **Gatekeeper:** Ohne `APP_KEY`/`JWT_SECRET` verweigert der Container im `production`-Modus den Start
  (`FATAL: APP_KEY/JWT_SECRET fehlt`; shell-check im Compose-`command`).

## Infrastruktur-Fakten (verifiziert)

- Caddy läuft als Container, externes Netz **`webnet`**, mountet `/home/webadmin/websites` → `/srv/websites` (ro).
  Statische Files unter `/home/webadmin/websites/analytics/…` legen → dann `/srv/websites/analytics/…` erreichbar.
- Caddyfile-Repo: `/Users/florianreisinger/dev/caddyfile` (Repo `reisi007/caddyfile`), Deploy via `./sync.sh`.
- Muster FastCGI-Proxy (siehe `portal.reisinger.pictures`):
  `reverse_proxy analytics_php:9000 { transport fastcgi { env SCRIPT_FILENAME …/public/index.php resolve_root_symlink } }`
  + `flush_interval -1` für SSE.
- Compose-Service-Name = DNS-Name im Netz. Caddyfile referenziert `analytics_php:9000` → Service `analytics_php`.
- Produktives `.env` wird über **Portainer Stack ENV-Variablen** injiziert (keine Secrets im Repo). Referenz:
  `.env.production` im Repo-Root (gitignored) mit generierten `APP_KEY`/`JWT_SECRET`.
- Portainer-Stacks mit `webnet` (extern) + internem `analytics_internal`-Netz; `analytics_php` hat statische IP
  `172.18.0.40` auf `webnet`. DB/Worker bleiben ohne Host-Ports erreichbar.
- Docker-Kollisionen mit Portal-Stack (3306/3307, 7700/7701, 1025/8025+1026/8026):
  | Service | Local | Test/E2E |
  |---|---|---|
  | Postgres | 5433 | 5434 |
  | Mailpit SMTP | 1027 | 1028 |
  | Mailpit Web/API | 8027 | 8028 |
  | E2E-Web | – | 8081 |

## Deployment

**Variante A — Image (`deployment/docker-compose.prod.yml`):**
- `analytics_db` (postgres:18-alpine) + `analytics_php` (`ghcr.io/reisi007/analytics:latest`).
- ENV aus Portainer-Stack: `APP_ENV`, `APP_DEBUG`, `APP_URL`, `APP_KEY`, `JWT_SECRET`, `DB_PASSWORD`, `MAIL_*`,
  `REPORT_EMAIL`, `STREAM_POLL_SECONDS`, `LOG_CHANNEL=stderr`, `ANALYTICS_ADMIN_EMAIL/PASSWORD`, `ANALYTICS_TIMEZONE`,
  `OAUTH_*`, `MAKE_WEBHOOK_URL`, `MAKE_API_KEY`.
- Start: Gatekeeper → `migrate --force` → `seed:if-empty` → `config:cache` → `route:cache` → `optimize` →
  Scheduler-Loop (`schedule:run` alle 60s) → `php-fpm`. Watchtower hält Image aktuell (Variante A).
- Alte Doku erwähnte `analytics_worker`/`analytics_scheduler` — heute laufen Queue/Scheduler **im `analytics_php`**-Container
  (konsolidiert, siehe Commit 6de14e5).

**Variante B — Files-Upload (`deployment/docker-compose.prod.files.yml`):**
- Backend aus `ghcr.io/reisi007/php-postgres:8.5`, Laravel-Files als Bind-Mount
  `/home/webadmin/websites/api-analytics.reisinger.pictures`. `composer_init` (einmalig, `composer install --no-dev`),
  Gatekeeper + `mkdir`/`chown` + migrate/seed/cache. Kein eigenes Image nötig.
- `sync.sh` (rclone, portal-Modell): Backend `laravel/` → `reisinger.pictures:/api-analytics.reisinger.pictures`
  (Filter `rclone-backend-filter.txt`, ohne vendor/.env/tests) und Frontend `dashboard/dist` →
  `reisinger.pictures:/analytics`. Secrets kommen aus Stack-ENV, `.env` wird bewusst nicht hochgeladen.

**Release-Workflow:** Tag `v*`-Push → CI-Job `release` (git-cliff `--latest`, GitHub-Release mit `dashboard-release.zip`).
Changelog-Konfig: `.git-cliff.toml`.

## Datenmodell (Postgres)

- `pageviews`: `id`, `site` (index), `url`, `title`, `referrer`, `screen_width/height`, `language`, `session_hash` (64, index), `created_at` (index). **Keine `ip`-Spalte.**
- `events`: `id`, `site` (index), `name` (index), `url`, `payload` (json), `session_hash` (index), `created_at` (index).
- `sites`: `id`, `site` (unique, **Label**), `aliases` (json-array, **Hosts**), `created_at`. CORS-Whitelist + Site-Definition.
- `users`: Admin-Login (Seeder).

## Code-Landkarte

### Backend (`laravel/`)
| Datei | Aufgabe |
|---|---|
| `routes/api.php` | Alle Routen unter `/ingest/*`. Öffentlich: `POST /auth/login`, `POST /track`. `auth:api`-Gruppe: `/auth/logout`, `/auth/me`, `/config/sites`, `/stream`, `/stats/*`, `/sites` CRUD |
| `app/Http/Controllers/Api/TrackController.php` | `POST /ingest/track`: Site aus Referer, text/plain- oder JSON-Body, validiert, `sessionHash()`, schreibt PageView/Event, antwortet 204 + ACAO |
| `app/Http/Controllers/Api/AuthController.php` | JWT-Login/Logout/Me |
| `app/Http/Controllers/Api/StatsController.php` | `summary` (300s-Cache), `events` (60s), `realtime` (15s), `sites`. `from`/`to` via `ReportTime::parse` |
| `app/Http/Controllers/Api/StreamController.php` | SSE-Endpoint `GET /ingest/stream` (Polling alle 2s, `fetchSince`, `snapshot`-Events) |
| `app/Http/Controllers/Api/SitesController.php` | CRUD `/ingest/sites` (auth), Delete optional `?delete_data=1` |
| `app/Http/Controllers/Api/ConfigController.php` | `GET /ingest/config/sites` → `{site: [aliases]}` |
| `app/Services/StatsAggregator.php` | Summary/Events/Realtime + Series-Gruppierung in Report-TZ, `recentActivity` |
| `app/Support/SiteDetector.php` | Alias→Label-Map aus `sites`-Tabelle (nur `aliases` = Hosts), www→Apex, Referer-Detection, `flush()` nach Seeds/Edits |
| `app/Support/ReportTime.php` | `timezone()`, `now()`, `today()`, `parse()` in Report-TZ |
| `app/Console/Commands/GenerateWeeklyReport.php` | `report:weekly`, iteriert alle Sites mit Daten |
| `app/Console/Commands/CheckOAuthToken.php` | `oauth:check-token` (Make-Webhook-Alert) |
| `app/Console/Commands/SitesAddCommand.php` / `SitesListCommand.php` | `sites:add`/`sites:list` |
| `app/Mail/Transports/GmailRestTransport.php` | `gmail_rest` Mailer (OAuth2-REST, multipart/related), Make-Webhook-Fallback |
| `app/Mail/WeeklyReportMail.php` | Wochenbericht-Template (Inline-Styles) |
| `app/Models/PageView.php`/`Event.php`/`Site.php`/`User.php` | Eloquent-Modelle |
| `database/seeders/` | `DatabaseSeeder` → `AdminUserSeeder` + `SiteSeeder` (2 Sites `Reisinger Pictures`/`All The Rest` + `localhost` non-prod) |
| `config/analytics.php` | stream/report/timezone/oauth/make-Konfig (ENV-gesteuert) |
| `bootstrap/app.php` | `apiPrefix: 'ingest'`, `trustProxies(at:'*')`, `HandleCors` entfernt, JSON-Fehler für `/ingest/*` |

### Frontend (`dashboard/src/`)
| Datei | Aufgabe |
|---|---|
| `main.tsx`, `App.tsx` | React-Bootstrap, Routing (`/login`, ProtectedRoute, `/`, `/realtime`, `/events`, `/sites`), Layout mit Logo im Header + SiteSwitcher als Favicon-Dropdown |
| `lib/api.ts` | `fetchJson` (Bearer-Auth, 401→Login-Redirect), Typen, URL-Builder, alle API-Calls, `ApiError` |
| `lib/auth.ts` | Token/User in localStorage (`analytics_token`, `analytics_user`), `login`/`logout`, `onAuthChange` |
| `lib/site.ts` | `SitesConfig`-Typ (Site → Aliases) |
| `context/SiteContext.tsx` | Default `site=''` = „Alle Sites" (keine Auto-Detection mehr), lädt `config/sites` + `stats/sites`, Site-Switcher-State, `refresh()` |
| `context/ToastContext.tsx` | ToastProvider (daisyUI `toast toast-top toast-end`, Auto-Dismiss 5s), `useToast()` |
| `tracker.ts` | `sendTrack` (text/plain, sendBeacon→fetch keepalive), `pageviewData`, `trackEvent`, globales `window.trackEvent` |
| `components/ApiErrorAlert.tsx` | Fehler-UI (Badge + Message) |
| `components/SiteFavicon.tsx` | Favicon für fremde Sites: probiert `favicon.ico` → `.svg` → `.png` → `apple-touch-icon.png` nacheinander (onError + 4s-Timeout), Fallback: Globus für „Alle Sites", Initiale wenn alle fehlschlagen |
| `components/SeriesChart.tsx`, `StatCard.tsx` | Chart + Stat-Karten |
| `pages/OverviewPage.tsx` | Summary-Übersicht (7/30/90 Tage), Top-Listen, `rangeParams` in Browser-TZ |
| `pages/RealtimePage.tsx` | SSE-Client (`EventSource` mit `?token=`, Reconnect 3s, Feed) |
| `pages/EventsPage.tsx`, `SitesPage.tsx`, `LoginPage.tsx` | Events-Liste, Sites-Verwaltung (Modals), Login |
| `vite.config.ts` | Vite + Proxy `/ingest` + Vitest (jsdom) |
| `vite.tracker.config.ts` | Eigener Build für `x7k2p.js` (Tracker, Anti-Adblock-Name) |

### E2E (`e2e/`)
| Datei | Aufgabe |
|---|---|
| `playwright.config.ts` | baseURL `http://localhost:8081`, chromium, retries (CI 1), `workers` 4/2, `fullyParallel: false`, `--host-resolver-rules=MAP *.e2e.local 127.0.0.1` |
| `helpers/AuthHelper.ts` | Login/Logout-Helper (Formular, warten auf Redirect) |
| `helpers/NetworkHelper.ts` | Warten auf API-Antworten (track, login, summary, …) |
| `helpers/ToastHelper.ts` | Toast-Assertions (daisyUI `.toast .alert`) |
| `helpers/SiteSwitcherHelper.ts` | Site-Switcher-Dropdown steuern: `select`, `expectMenuContains/Excludes`, `trigger` |
| `helpers/SiteHelper.ts` | Zentrales Site-Management über API: `ensureSite`, `track`, `summary`, `deleteSite`, `teardown`, `uniqueSite(prefix)` |
| `tests/00-tracking.spec.ts` | Track-Seite unter eigener `*.e2e.local`-Site → Pageview/Event in Stats (1/1/1) |
| `tests/auth.spec.ts` | Redirect unauthentifiziert, falsches/wahres Passwort |
| `tests/realtime.spec.ts` | Realtime-Seite (Counter + Feed) + echter SSE-Push-Test (Track → Feed) |
| `tests/sites.spec.ts` | Site-Switcher + „Alle Sites" (eigene Site) |
| `tests/sites-management.spec.ts` | Sites-CRUD über UI (Add/Edit/Delete, mit/ohne Daten, eigene Sites) |
| `tests/security.spec.ts` | 403/401, Stream-JWT-403, Mehr-Site-Aggregation (www→Apex), Events-Seite |
| `Caddyfile.e2e` (Repo-Root) | Caddy für E2E (fastcgi → `php:9000`, `/x7k2p.js`, SPA-Fallback) |

**E2E-Isolation:** Jede Spec legt ihre eigenen eindeutigen Sites an (`SiteHelper.uniqueSite`) und räumt sie im
`afterAll`-Teardown ab → Tests brauchen **keine leere DB** mehr und sind **parallel-sicher** (`workers` > 1).

### CI (`ci.yml`)
| Job | Aufgabe |
|---|---|
| `php-tests` | PHPUnit parallel (`--processes=4`), Mailpit-Service auf :1028/:8028 |
| `frontend-tests` | Typecheck, Vitest, Build, Upload `x7k2p.js` |
| `build-image` | Docker-Image nach GHCR (main→`latest`/`test`, PR→`pr-N`/`test`, sonst Branch) |
| `e2e-tests` | Playwright gegen `test`-Stack (hängt an `build-image`, zieht `:test`) |
| `release` | nur `v*`-Tags: git-cliff + GitHub-Release (`dashboard-release.zip`) |

## Konventionen
- Commits: Conventional Commits, Imperativ, häufig.
- Releases: git-cliff aus Conventional Commits, Tag `v<version>`.
- Backend: Pint/PHPStan-Konventionen, Laravel-Stil.
- Frontend: Tailwind/daisyUI-Klassen, keine Inline-Styles, TypeScript strikt.
- Tests: Zero-Failures-Policy (auch vorbestehende Fehler beheben); Implementierer ≠ Verifizierer.
