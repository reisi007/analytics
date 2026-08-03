# TESTING.md — Testaufbau & Verifikations-Playbook

> Referenz zu `Agents.md`. Enthält Test-Stack, Playbook, E2E-Setup und bekannte Fallstricke.
> Zero-Failures-Policy: **Auch vorbestehende Fehler sind nicht zulässig** — Implementierer ≠ Verifizierer.

## Test-Stack

| Ebene | Framework | Basis | Besonderheit |
|---|---|---|---|
| Backend | PHPUnit 12 + paratest | SQLite **in-memory** (`DB_DATABASE=:memory:`) | E-Mail-Tests via Mailpit (:1027/:8027) |
| Frontend | Vitest 4 | jsdom (`vite.config.ts`, `src/test/setup.ts`) | `globals: true` |
| E2E | Playwright 1.62 | Docker-Stack auf `:8081` | `Caddyfile.e2e`, Postgres :5434 |

## Backend-Tests (`laravel/tests/`)

- `Feature/`-Tests: `AuthTest`, `StatsTest`, `TrackTest`, `StreamTest`, `SitesApiTest`, `ConfigTest`,
  `TimezoneTest`, `WeeklyReportTest`, `SiteSeederTest`, `SiteCommandTest`, `GmailRestTransportTest`.
- `Unit/ExampleTest`, `Support/MailpitAssertions` (Mailpit-API-Assertions).
- `phpunit.xml`: `CACHE_STORE=array`, `JWT_SECRET` fest (Tests), Mailpit :1027/:8027.
- RefreshDatabase + `SiteDetector::flush()` in `setUp` (SiteDetector cached Map statisch).
- `phpunit.xml` definiert Test-Konfig via `<env>`; `config('analytics.stream.max_runtime')` in Stream-Tests klein setzen.

## Frontend-Tests (`dashboard/src/`)

- Tests liegen **neben** den Quell-Dateien: `lib/api.test.ts`, `lib/auth.test.ts`,
  `components/ApiErrorAlert.test.tsx`, `components/SiteFavicon.test.tsx`, `context/SiteContext.test.tsx`,
  `context/ToastContext.test.tsx`, `pages/{Overview,Realtime,Events,Sites,Login}Page.test.tsx`, `tracker.test.ts`.
- Muster: `vi.stubGlobal('fetch', …)` für API-Mocks, `MemoryRouter` für Routing, `localStorage.clear()` im `beforeEach`.
- Befehle: `pnpm typecheck`, `pnpm test:unit`, `pnpm build` (build:app + build:tracker).

## E2E (`e2e/`)

- Stack: `docker-compose.test.yml` **im Repo-Root** (nicht in `laravel/`!). Services: `db` (:5434 intern), `php`
  (Image `ghcr.io/reisi007/analytics:${IMAGE_TAG:-test}`, APP_ENV=testing), `mailpit` (**nur intern**, kein Host-Port),
  `web` (Caddy :8081, mountet `dashboard/dist`).
- **On-demand:** Der E2E-Stack wird **nur bei Bedarf** über `./e2e-up.sh` gestartet (Dev-Stack Postgres :5433 +
  Mailpit :1027/:8027 wird ebenfalls sichergestellt). Default: **kein E2E-Stack gestartet** — PHPUnit läuft mit SQLite
  in-memory + Dev-Mailpit, ohne E2E-Docker.
- `php`-Service läuft **migrations/seed nicht automatisch** → `./e2e-up.sh` führt bei einem frischen Start
  `docker compose -f docker-compose.test.yml exec -T php php artisan migrate --seed --force` aus.
- Playwright: `npx playwright install --with-deps` dann `npx playwright test`. baseURL `http://localhost:8081`.
- **Projekte:** `chromium` (Full HD **1920×1080**) und `mobile` (`devices['Pixel 7']`) — die **komplette Suite** läuft auf beiden Viewports.
  `mobile.spec.ts` läuft nur im `mobile`-Projekt (Header-Hamburger, kein Horizontal-Scroll, Overlay-Close, Switcher/Logout).
- **Nav-Klicks** laufen viewport-agnostisch über `helpers/SidebarHelper.ts` (Desktop: Direktklick; Mobile: Hamburger öffnen, dann klicken).
- Specs: `00-tracking`, `auth`, `realtime`, `sites`, `sites-management`, `security`, `mobile`.
- **Isolation:** Jede Spec legt eigene eindeutige Sites über `SiteHelper` an (`uniqueSite`, `*.e2e.local`) und räumt sie im
  `afterAll`-Teardown ab → **keine leere DB nötig**, Tests laufen parallel-sicher (`workers` 4 in CI / 2 lokal).
  Chromium nutzt `--host-resolver-rules=MAP *.e2e.local 127.0.0.1`, damit die Track-Seite unter der Test-Site
  erreichbar ist (Caddy bedient jeden Host).

## Verifikations-Playbook

```bash
# Backend (Arbeitsdir laravel/)
composer install && cp .env.example .env && php artisan key:generate
php artisan test --parallel --processes=4
# mit Mailpit-Tests:
docker compose -f docker-compose.local.yml up -d mailpit

# Frontend (Arbeitsdir dashboard/)
pnpm install
pnpm typecheck
pnpm test:unit
pnpm build

# E2E (Stack auf :8081)
docker compose -f docker-compose.test.yml up -d --build   # Repo-Root
docker compose -f docker-compose.test.yml exec -T php php artisan migrate --seed --force
cd e2e && npx playwright install --with-deps && npx playwright test

# Caddyfile validieren (Arbeitsdir caddyfile/)
docker run --rm -v "$(pwd)/Caddyfile:/etc/caddy/Caddyfile" caddy:latest caddy validate --config /etc/caddy/Caddyfile

# Compose validieren
docker compose -f deployment/docker-compose.prod.yml config
docker compose -f deployment/docker-compose.prod.files.yml config
```

## Bekannte Fallstricke

- **Zeitzonen-Range:** `from`/`to` werden im Backend als **UTC-Kalendertage** interpretiert
  (`ReportTime::parseUtc`, `StatsController::summary/events`), das Dashboard berechnet sie ebenfalls in UTC
  (`OverviewPage.tsx`) → konsistent, kein Tag-Versatz mehr.
- **Persistentes Volume `db_data_test`:** E2E-Specs sind durch eigene Sites isoliert (kein leeres DB nötig). Für einen
  frischen Start trotzdem möglich: `docker compose -f docker-compose.test.yml down -v`.
- **`CACHE_STORE=array` in Tests:** Cache lebt nur pro Test → `Cache::flush()` wirkt, TTL-Asserts teils flaky.
- **SiteDetector statisch cached:** Nach Seeder/DB-Änderungen in Tests `SiteDetector::flush()` nötig.
- **`postJson` vs. text/plain:** Die produktiven Track-Requests kommen mit `Content-Type: text/plain` (Tracker,
  Simple CORS). Viele Tests nutzen `postJson` (application/json) → Produktionspfad separat testen
  (`$this->post('/ingest/track', [], ['Referer' => …])` + Raw-Body).
- **Stream-Tests:** `config(['analytics.stream.max_runtime' => 0.2, 'poll_seconds' => 0.1])` setzen, sonst Endlos-SSE.
- **E2E-Login:** Seeder mit `ANALYTICS_ADMIN_EMAIL=admin@e2e.local` / `ANALYTICS_ADMIN_PASSWORD=password`; Playwright
  Login-Overlay via `helpers/AuthHelper.ts`.
- **E2E-Hosts `*.e2e.local`:** Brauchen den `--host-resolver-rules`-Launch-Arg (playwright.config.ts), sonst 404 beim
  Laden der Track-Seite unter der Test-Site.
- **Cache-TTL-Asserts (Backend):** Mit `$this->travel(61)->seconds()` bzw. `(16)` die Events-/Realtime-TTL überprüfen
  (Array-Store nutzt `Carbon::now()` → `travel()` altert Caches).
