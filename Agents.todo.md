# Agents.todo.md — Taskliste

> Der Build Agent arbeitet diese Liste ab. Verifikation ausgelagerter Ergebnisse ist Pflicht (bevorzugt parallel).
> Fortschritt wird in `Agents.md` unter *Status / Fortschritt* gepflegt.
> Gelöste Todos werden **entfernt**, sobald sie **verifiziert** sind (Implementierer ≠ Verifizierer). Nicht verifizierte,
> aber umgesetzte Todos werden **abgehakt** (`[x]`).

## 0. Doku-Neustrukturierung
- [x] **Doku-Neustrukturierung:** AGENTS.md geschlankt; Wissen ausgelagert in `ARCHITECTURE.md` (Architektur, Infra,
  Deployment, Code-Landkarte) und `TESTING.md` (Test-Stack, Verifikations-Playbook, Fallstricke). Diese Dateien sind
  Teil des Agenten-Kontexts und dürfen vom Build Agent direkt gelesen/bearbeitet werden (wie AGENTS.md/Agents.todo.md).
  *Umgesetzt, noch nicht durch separaten Verifier geprüft → abgehakt.*

## 0. Status / Fortschritt (Historie)
> Frühere Status-Tabelle aus `Agents.md`, hierher verschoben. Verifizierte Todos werden aus der Taskliste **entfernt**;
> die Historie bleibt als Referenz erhalten.

| Todo | Status | Notiz |
|---|---|---|
| 1 Agents-Dateien | ✅ | – |
| 2 Library-Versionen | ✅ | Laravel 13.23, PHP 8.5, Postgres 18, React 19.2, Vite 8, TS 7, Vitest 4, Tailwind 4, daisyUI 5, Playwright 1.62, pnpm 11, Composer 2.10 |
| 3 Laravel-Backend | ✅ | API, SSE, Report, Tests grün (12 passed) |
| 4 Dashboard + tracker.js | ✅ | React 19 + Vite 8 + Router 7 + daisyUI, tracker.js im Build |
| 5 Referrer-Detection | ✅ | Site aus HTTP Referer, www→Apex, Subdomains eigenständig |
| 6 Docker/Compose | ✅ | Dockerfile + local/test/prod-Stacks, Gatekeeper, webnet |
| 7 Caddyfile | ✅ | Block in caddyfile-Repo (83ca7b6), validiert, nicht gesynct |
| 8 CI/CD | ✅ | ci.yml, actionlint clean, **Lauf grün** (php/frontend/build-image/e2e/release) |
| 9 E2E | ✅ | Playwright 6 Tests grün (tracking, auth, realtime, sites) |
| 10 Verifikation | ✅ | Finaler Lauf A–D grün (Backend 34, Frontend 39, Docker, Caddyfile, E2E) |
| 11 README | ✅ | Setup, Tests, Portainer-Deploy (ENV), Watchtower, sites-Verwaltung |
| 12 Webseiten-Integration | ✅ | tracker.js in reisinger.pictures (BaseHead/MinimalPage), portal (index.html + Caddyfile-CSP), all-the.rest, countdown, mat-extended, optimus eingebunden; Edits + Syncs parallel per Subagenten, verifiziert |
| 13 Combined Overview + Cache | ✅ | Alle-Sites-Übersicht + Site-Switcher + API-Caching |
| 14 Auth (JWT-Login) | ✅ | tymon/jwt-auth, Login + geschützte Stats/Stream, Seeder |
| 15 Dynamische Sites (UI) | ✅ | Sites-Definition aus Backend, keine hardcoded SITE_ALIASES im Frontend |
| 16 Email 100 % | ✅ | 99,74 % (Unsupported 0,00; Partial 0,26 = css-width Outlook) |
| 17 Sites in DB (CORS-Whitelist) | ✅ | DB-Tabelle `sites`, Track-403 bei unbekanntem Referrer, `sites:add/list` |
| 18 GitHub-Repo + deploy/sync | ✅ | Repo `reisi007/analytics` (privat), Release **v0.1.0** (zip+Changelog), **sync.sh** (rclone) |
| 19 Toast-System + Login-Fehler | ✅ | Eigener ToastProvider (daisyUI `toast toast-top toast-end`, Auto-Dismiss 5s, `useToast()`), Login-Fehler als Toast statt Inline-Alert; 4 neue Tests, 43 grün |
| 20 UI-Fixes (Proxy/Abstand) | ✅ | Vite-Proxy wie Portal-Projekt: `VITE_API_PROXY || 'https://tracking.test'`, `changeOrigin`, `secure:false`, `cookieDomainRewrite`; Login-Button-Abstand erhöht (`mt-6`) |
| 21 sync.sh + CI-Tag-Fix | ✅ | sync.sh auf `gh` umgestellt (Release-Download war 404 im privaten Repo, VERSION-Extraktion leer); ci.yml: Version normalisiert (`v$(… | sed 's/^v*//')`) gegen `vv0.1.1`/`vvv0.2.0`-Verschmutzung; Prod-Compose validiert (`docker compose config` exit 0) |
| 22 Sites-Verwaltung (UI) | ✅ | Backend `SitesController` + `GET/POST/PUT/DELETE /sites` (auth, `/ingest/`-Prefix), Delete optional `?delete_data=1`; Frontend `SitesPage` (Tabelle, Add-/Edit-/Delete-Modal, nur Aliases editierbar), `SiteContext.refresh()`, Route `/sites`; `SitesApiTest` (8), `SitesPage.test` (7), E2E `sites-management.spec`; Verifikation grün (Backend 47, Frontend 57, E2E 11) |
| 23 Logo Startseite | ✅ | Logo + Name „Analytics" auf der Login-Seite (daisyUI), LoginPage-Test ergänzt |
| 24 Release nur via v*-Tags | ✅ | ci.yml: `tags: v*`-Trigger, Release-Job `if: startsWith(github.ref,'refs/tags/v')`, git-cliff `--latest`, `tag_name: github.ref_name`, kein Auto-Tag-Push mehr; actionlint clean |
| 25 Feste Report-Zeitzone | ✅ | `ANALYTICS_TIMEZONE` (Default `Europe/Berlin`), `App\Support\ReportTime`, `StatsController`/`StatsAggregator` (Tages-Gruppierung in Report-TZ, Query-Bounds UTC), Scheduler-`->timezone()`, ENV in allen Compose-Dateien (2× prod, test) + README; `TimezoneTest` (4); 51 Backend-Tests grün |
| 26 Base-Images php-mysql/php-postgres | ✅ | docker-base-images-Repo: `Dockerfile` parametrisiert (`ARG DB_EXT=mysql\|pgsql`, bedingt `libpq-dev`), Workflow-Matrix baut `php-mysql` + `php-postgres` (8.5/8.6-rc, latest/next), `php-base` bleibt Alias für `php-mysql`; beide Varianten lokal gebaut+verifiziert (pdo_pgsql/–pdo_mysql korrekt) |
| 27 Files-Upload-Deploy (Variante B) | ✅ | `deployment/docker-compose.prod.files.yml`: Backend aus `ghcr.io/reisi007/php-postgres:8.5`, Laravel-Files als Bind-Mount `/home/webadmin/websites/api-analytics.reisinger.pictures`, `composer_init` (einmalig), Gatekeeper + `mkdir`/`chown` + migrate/seed/cache; `sync.sh` neu (portal-Modell, ohne Modes): Backend `laravel/` + Frontend `dist` via rclone, `rclone-backend-filter.txt`; README „Variante B"; Verifikation 6/6 grün |
| 28 Doku-Neustrukturierung | ✅ | AGENTS.md geschlankt (Rolle, Toolchain, Regeln, Status); Wissen ausgelagert in **ARCHITECTURE.md** (Architektur, Infra, Deployment, Code-Landkarte) + **TESTING.md** (Test-Stack, Playbook, Fallstricke); AGENTS.md verweist auf beide; offene Audit-Punkte → Agents.todo.md |

## 1. Produktions-Deployment (Server, manuell)
- [ ] Portainer Stack `analytics` anlegen (`deployment/docker-compose.prod.yml` + ENV-Variablen laut README), Container auf `webnet`
- [ ] Caddyfile-Block nach Stack-Deploy per `./sync.sh` (Caddyfile-Repo) aktivieren
- [ ] Nach jedem Release lokal `./sync.sh` (rclone: lokales `dashboard/dist` → `/home/webadmin/websites/analytics`; `./sync.sh release` nutzt stattdessen das letzte GitHub-Release)

## 2. Audit: Security / Code Quality / Testabdeckung (2026-08-01)
> Ergebnisse aus 4 parallelen Audit-Subagenten (Backend, Frontend, E2E/Pipeline, Testabdeckung).
> Nur dokumentiert — **Umsetzung noch nicht gestartet**. Kritische Findings vor Umsetzung durch separaten Verifier bestätigen lassen (Zero-Failures-Policy).
> Hinweis zu Referenzen: Der Produktions-Caddyfile-Block liegt im separaten **Caddyfile-Repo `reisi007/caddyfile`** (nicht in diesem Repo) — hier nur als Hinweis geführt.

### P0 — Pipeline-Rot & Sicherheit
- [ ] **Zeitzonen-Bug (macht CI nachts rot):** `from`/`to` werden im Backend in `Europe/Berlin` interpretiert (`ReportTime::parse`), das Dashboard berechnet sie in Browser-TZ → zwischen 22:00–24:00 UTC fällt `to` einen Tag zurück, Pageviews werden ausgeschlossen. Betroffene Tests (aktuell rot): `AuthTest::test_stats_with_token_returns_200`, `StatsTest::test_summary_is_cached`, E2E `00-tracking.spec`. Empfehlung: `from`/`to` als UTC-Kalendertage interpretieren oder Server liefert TZ. [Backend `StatsController.php`/`ReportTime.php` + Frontend `OverviewPage.tsx`]
- [ ] **Rate-Limit für `POST /ingest/auth/login`** (und `/ingest/track`): `throttle` (z. B. `throttle:5,1` bzw. `120,1`), inkl. Test (6. Versuch → 429). Aktuell keinerlei Brute-Force-/Abuse-Schutz. [Backend `routes/api.php`]
- [ ] **Admin-Seeder-Härtung:** bei fehlendem/leerem `ANALYTICS_ADMIN_PASSWORD` abbrechen (exit non-zero) statt Default `'password'`/leer; Gatekeeper-Startskript um Admin-Keys erweitern. [Backend `database/seeders/AdminUserSeeder.php` + `deployment/docker-compose.prod.yml`]
- [ ] **`db:seed --force` bei jedem Deploy** setzt Admin-Passwort aus ENV zurück → `updateOrCreate` auf Mail statt Passwort-Neugenerierung. [Deployment-Stack `deployment/docker-compose.prod.yml`]

### P1 — Security Backend
- [ ] **`session_hash` härten:** `hash_hmac('sha256', …, app.key)` (Pepper) + Site in den Hash aufnehmen (sonst Cross-Site-Korrelation zwischen Sites, Offline-Bruteforce möglich). [Backend `TrackController.php`]
- [ ] **SSE-Token aus URL:** vollmächtiges JWT (inkl. Sites-CRUD) liegt im Query-String von `/ingest/stream?token=…` (Leak in Logs/Proxies) → kurzlebiges, auf `/stream` gescopetes Token oder Cookie-basierte SSE-Auth. [Backend `routes/api.php` + Frontend `dashboard/src/pages/RealtimePage.tsx`]
- [ ] `from`/`to`-Parameter validieren (`date_format:Y-m-d`) → 422 statt 500. [Backend `StatsController.php`]
- [ ] `site`-Parameter validieren (Array-Typo-DoS: `?site[]=…` → 500) in Stream/Stats. [Backend `StreamController.php`, `StatsController.php`]
- [ ] `trustProxies(at:'*')` auf Webnet/Caddy-Subnetz einschränken (IP-Spoofing für `session_hash`). [Backend `bootstrap/app.php`]
- [ ] Event-`payload`-Größen-/Tiefenlimit. [Backend `TrackController.php`]
- [ ] **CORS-Kontrakt:** ACAO-Echo inkl. Port (Dev-Fall `localhost:5173`); ACAO fehlt auf 422/500-Antworten. [Backend `TrackController.php`]
- [ ] **`recentActivity` bei `site=null`:** `where('site', null)` matcht nichts → Events fehlen im „Alle Sites"-Realtime-Feed (realer Korrektheitsbug). `when($site, …)` verwenden. [Backend `StatsAggregator.php`]
- [ ] Duplizierte Make-Webhook-Config-Keys zusammenführen. [Backend `CheckOAuthToken.php` vs. `GmailRestTransport.php`]

### P1 — Security Frontend
- [ ] **Server-Details aus Fehler-UI entfernen:** Stacktraces/Dateipfade (`exception`, `file`, `line`, `trace`) werden aktuell im Dashboard gerendert → nur `status`+`message` anzeigen. [Frontend `dashboard/src/components/ApiErrorAlert.tsx`, `dashboard/src/lib/api.ts`]
- [ ] **SSE-Session-Ablauf:** 401 im SSE-`error`-Handler erkennen → Token clearen + `/login` (statt Endlos-Reconnect alle 3 s). [Frontend `dashboard/src/pages/RealtimePage.tsx`]
- [ ] **Requests mit Timeout/AbortController** in `fetchJson`; Logout nicht von Netzwerk-Antwort abhängig. [Frontend `dashboard/src/lib/api.ts`, `dashboard/src/lib/auth.ts`]
- [ ] **CSP für stats.\*-Domains** (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'`) — Hinweis: Caddyfile-Block liegt im Caddyfile-Repo; stats.*-Block dort hat aktuell weder CSP noch `log off`. [Caddyfile-Repo]
- [ ] `getUser(): any` → typisiertes `User`-Interface. [Frontend `dashboard/src/lib/auth.ts`]
- [ ] Client-Validierung Sites/Aliases (Hostname-Format, Normalisierung, Länge). [Frontend `dashboard/src/pages/SitesPage.tsx`]
- [ ] Optional: Tracker sendet vollen `document.referrer` (Query-Params/PII) → Query-String strippen. [Frontend `dashboard/src/tracker.ts`]
- [ ] **ESLint fehlt komplett** (kein Script/Config) → `eslint` + `eslint-plugin-react-hooks` ergänzen. [Frontend `dashboard/package.json`]
- [ ] `cache:'no-store'` bei authentifizierten GETs. [Frontend `dashboard/src/lib/api.ts`]

### P1 — Testabdeckung (Security/Datenschutz)
- [ ] **text/plain-Track-Pfad testen** (Raw-Body, `Content-Type: text/plain`, wie Tracker sendet) → 204 + DB-Zeile. Bisher testen alle Tests `postJson` (application/json) — Produktionspfad ungetestet. [Backend `TrackTest`]
- [ ] Fehlender/leerer Referrer → 403 testen (aktuell nur unbekannter Host getestet). [Backend `TrackTest`]
- [ ] **Datenschutz-Asserts:** Schema ohne `ip`-Spalte; gleiche IP+UA, anderer Tag → **anderer** `session_hash`; Token erscheint nicht in Fehler-Responses. [Backend-Tests]
- [ ] **Frontend-401-Intercept** unit-testen (`fetchJson`-Branch: clearToken + Redirect zu `/login`). [Frontend `dashboard/src/lib/api.test.ts`]
- [ ] Ungültiges JWT → 401 (Backend) testen. [Backend `AuthTest`]
- [ ] WeeklyReport ohne `REPORT_EMAIL` → Exit-Failure testen. [Backend `WeeklyReportTest`]
- [ ] Cache-TTL (events 60 s / realtime 15 s) assertieren (summary 300 s nur indirekt, flaky). [Backend `StatsTest`]
- [ ] E2E: echter SSE-Push (Track → Stream-Ereignis) statt nur Seiten-Render. [E2E `realtime.spec`]
- [ ] E2E: 403 unbekannter Referrer, 401 abgelaufenes Token, echte Mehr-Site-Aggregation (Werte), www→Apex, Event-UI-Anzeige. [E2E]

### P2 — Pipeline
- [ ] **Release-E2E testet evtl. falsches Image:** `build-image` pusht bei `v*`-Tag nur `:v*`, E2E zieht `:test` des letzten Main-Pushes → bei Tag-Push ebenfalls `:test` (oder `:tag-test`) mit-pushen bzw. E2E zieht `:v*`. [`.github/workflows/ci.yml`]
- [ ] **Kein `concurrency` + mutabler `:test`-Tag** → parallele Läufe racem; PR-spezifisches Image-Tag (z. B. `pr-N-test`) + `concurrency`-Group. [`.github/workflows/ci.yml`]
- [ ] **Failure-Artefakte:** Playwright `html`-Reporter + `trace: 'retain-on-failure'` + Upload des Reports bei `failure()` (aktuell nur `reporter:'list'`, keine Screenshots/Traces). [E2E `playwright.config.ts`, `.github/workflows/ci.yml`]
- [ ] **Coverage-Tracking:** PHPUnit `--coverage` + Vitest `coverage` + Untergrenzen (aktuell `coverage: none`). [`.github/workflows/ci.yml`, `vite.config.ts`]
- [ ] **Branch-Protection für main** (required status checks: `php-tests`, `frontend-tests`, `e2e-tests`) — aktuell keine Protection, rote Commits landen auf main. [GitHub-Repo-Einstellungen]
- [ ] README-E2E-Anleitung fixen: `docker-compose.test.yml` liegt im **Repo-Root**, nicht in `laravel/`. [README.md]
- [ ] Repo-Doku „privat" vs. real **public** klären (GitHub-API `visibility: public`; AGENTS.md/README sagen „privat") — Security-Posture prüfen. [Doku/Repo]
- [ ] Lokale E2E deterministisch: `down -v` in README + exakte Zähler-Assertions statt „≠ 0" (persistentes `db_data_test`-Volume maskiert Regressionen). [README.md, E2E `00-tracking.spec`]
- [ ] Actions auf **SHA pinnen** (Supply-Chain; aktuell nur Major-Tags). [`.github/workflows/ci.yml`]
- [ ] Stale TODO-Kommentar in `ci.yml` (E2E-Suite ist implementiert) entfernen. [`.github/workflows/ci.yml`]
