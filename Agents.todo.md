# Agents.todo.md — Taskliste

> Der Build Agent arbeitet diese Liste ab. Verifikation ausgelagerter Ergebnisse ist Pflicht (bevorzugt parallel).
> Fortschritt wird in `Agents.md` unter *Status / Fortschritt* gepflegt.
> Gelöste Todos werden **entfernt** (nicht abgehakt).

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
