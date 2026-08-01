# TESTING.md — Testaufbau & Verifikations-Playbook

> Referenz zu `Agents.md`. Enthält Test-Stack, Playbook, E2E-Setup und bekannte Fallstricke.
> Zero-Failures-Policy: **Auch vorbestehende Fehler sind nicht zulässig** — Implementierer ≠ Verifizierer.

## Test-Stack

| Ebene | Framework | Basis | Besonderheit |
|---|---|---|---|
| Backend | PHPUnit 12 + paratest | SQLite **in-memory** (`DB_DATABASE=:memory:`) | E-Mail-Tests via Mailpit (:1028/:8028) |
| Frontend | Vitest 4 | jsdom (`vite.config.ts`, `src/test/setup.ts`) | `globals: true` |
| E2E | Playwright 1.62 | Docker-Stack auf `:8081` | `Caddyfile.e2e`, Postgres :5434 |

## Backend-Tests (`laravel/tests/`)

- `Feature/`-Tests: `AuthTest`, `StatsTest`, `TrackTest`, `StreamTest`, `SitesApiTest`, `ConfigTest`,
  `TimezoneTest`, `WeeklyReportTest`, `SiteSeederTest`, `SiteCommandTest`, `GmailRestTransportTest`.
- `Unit/ExampleTest`, `Support/MailpitAssertions` (Mailpit-API-Assertions).
- `phpunit.xml`: `CACHE_STORE=array`, `JWT_SECRET` fest (Tests), Mailpit :1028/:8028.
- RefreshDatabase + `SiteDetector::flush()` in `setUp` (SiteDetector cached Map statisch).
- `phpunit.xml` definiert Test-Konfig via `<env>`; `config('analytics.stream.max_runtime')` in Stream-Tests klein setzen.

**Aktuell rote Tests (Audit 2026-08-01, noch offen):** `AuthTest::test_stats_with_token_returns_200`,
`StatsTest::test_summary_is_cached`, E2E `00-tracking.spec` — verursacht durch den **Zeitzonen-Bug** (siehe Fallstricke).

## Frontend-Tests (`dashboard/src/`)

- Tests liegen **neben** den Quell-Dateien: `lib/api.test.ts`, `lib/auth.test.ts`, `lib/site.test.ts`,
  `components/ApiErrorAlert.test.tsx`, `context/ToastContext.test.tsx`, `pages/{Overview,Realtime,Events,Sites,Login}Page.test.tsx`, `tracker.test.ts`.
- Muster: `vi.stubGlobal('fetch', …)` für API-Mocks, `MemoryRouter` für Routing, `localStorage.clear()` im `beforeEach`.
- Befehle: `pnpm typecheck`, `pnpm test:unit`, `pnpm build` (build:app + build:tracker).

## E2E (`e2e/`)

- Stack: `docker-compose.test.yml` **im Repo-Root** (nicht in `laravel/`!). Services: `db` (:5434 intern), `php`
  (Image `ghcr.io/reisi007/analytics:${IMAGE_TAG:-test}`, APP_ENV=testing), `mailpit` (:1028/:8028), `web`
  (Caddy :8081, mountet `dashboard/dist`).
- `php`-Service läuft **migrations/seed nicht automatisch** → manuell: `docker compose -f docker-compose.test.yml exec -T php php artisan migrate --seed --force`.
- Playwright: `npx playwright install --with-deps` dann `npx playwright test`. baseURL `http://localhost:8081`.
- Specs: `00-tracking`, `auth`, `realtime`, `sites`, `sites-management`.

## Verifikations-Playbook

```bash
# Backend (Arbeitsdir laravel/)
composer install && cp .env.example .env && php artisan key:generate
php artisan test --parallel --processes=4
# mit Mailpit-Tests:
docker compose -f docker-compose.test.yml up -d mailpit

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

- **Zeitzonen-Range (rot machend):** `from`/`to` werden im Backend in `Europe/Berlin` interpretiert
  (`ReportTime::parse`), das Dashboard berechnet sie in Browser-TZ → zwischen 22:00–24:00 UTC fällt `to` einen Tag
  zurück, Pageviews werden ausgeschlossen (`AuthTest::test_stats_with_token_returns_200`, `StatsTest::test_summary_is_cached`,
  E2E `00-tracking.spec`). Beim Fix beachten: `StatsController::summary/events` + `OverviewPage.tsx`.
- **Persistentes Volume `db_data_test`:** verdeckt Regressionen — für deterministische lokale E2E vorher
  `docker compose -f docker-compose.test.yml down -v` (Volume löschen), sonst alter Datenstand bleibt.
- **`CACHE_STORE=array` in Tests:** Cache lebt nur pro Test → `Cache::flush()` wirkt, TTL-Asserts teils flaky.
- **SiteDetector statisch cached:** Nach Seeder/DB-Änderungen in Tests `SiteDetector::flush()` nötig.
- **`postJson` vs. text/plain:** Die produktiven Track-Requests kommen mit `Content-Type: text/plain` (Tracker,
  Simple CORS). Viele Tests nutzen `postJson` (application/json) → Produktionspfad separat testen
  (`$this->post('/ingest/track', [], ['Referer' => …])` + Raw-Body).
- **Stream-Tests:** `config(['analytics.stream.max_runtime' => 0.2, 'poll_seconds' => 0.1])` setzen, sonst Endlos-SSE.
- **E2E-Login:** Seeder mit `ANALYTICS_ADMIN_EMAIL=admin@e2e.local` / `ANALYTICS_ADMIN_PASSWORD=password`; Playwright
  Login-Overlay via `helpers/login.ts`.
