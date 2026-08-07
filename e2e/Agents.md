# Agents.md — E2E (Playwright)

> **Rolle:** Modul-spezifisches Agent-Dokument für die E2E-Tests `e2e/`.
> Globale Workflow-Regeln: Root `Agents.md` · Architektur `ARCHITECTURE.md` · Tests `TESTING.md`

## Ausführen (nur on-demand)

- Der E2E-Stack wird **nur bei Bedarf** über `./e2e-up.sh` gestartet (Dev-Stack Postgres :5433 + Mailpit :1027/:8027
  wird ebenfalls sichergestellt). Default: **kein E2E-Stack gestartet** — PHPUnit läuft mit SQLite in-memory + Dev-Mailpit.
- `retries` nur in CI; Specs nutzen `e2e/helpers/` statt eigenem Setup/Cleanup.
- `php`-Service läuft **migrations/seed nicht automatisch** → `./e2e-up.sh` führt bei einem frischen Start
  `docker compose -f docker-compose.test.yml exec -T php php artisan migrate --seed --force` aus.
- Stack (Repo-Root): `docker-compose.test.yml` — `db` (:5434 intern), `php`
  (Image `ghcr.io/reisi007/analytics:${IMAGE_TAG:-test}`, APP_ENV=testing), `mailpit` (**nur intern**, kein Host-Port),
  `web` (Caddy :8081, mountet `dashboard/dist`).

```bash
# Stack starten (Repo-Root):
./e2e-up.sh
# Tests laufen lassen (Arbeitsdir e2e/):
npx playwright install --with-deps
npx playwright test
```

## Code-Landkarte

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
| `tests/sites.spec.ts` | Site-Switcher + „Alle Webseiten" (eigene Site) |
| `tests/sites-management.spec.ts` | Sites-CRUD über UI (Add/Edit/Delete, mit/ohne Daten, eigene Sites) |
| `tests/security.spec.ts` | 403/401, Stream-JWT-403, Mehr-Site-Aggregation (www→Apex), Events-Seite |
| `Caddyfile.e2e` (Repo-Root) | Caddy für E2E (fastcgi → `php:9000`, `/x7k2p.js`, SPA-Fallback) |

**E2E-Isolation:** Jede Spec legt ihre eigenen eindeutigen Sites an (`SiteHelper.uniqueSite`) und räumt sie im
`afterAll`-Teardown ab → Tests brauchen **keine leere DB** mehr und sind **parallel-sicher** (`workers` > 1).
