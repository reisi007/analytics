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
> **Umsetzung erfolgt** und am 2026-08-01 durch separaten Verifier bestätigt (Zero-Failures): Backend 71 Tests, Frontend 68 Tests + typecheck/lint/coverage/build, E2E 15 Tests, Compose config ×3, actionlint — alle grün.
> Hinweis zu Referenzen: Der Produktions-Caddyfile-Block liegt im separaten **Caddyfile-Repo `reisi007/caddyfile`** (nicht in diesem Repo) — hier nur als Hinweis geführt.

### P0 — Pipeline-Rot & Sicherheit (alle erledigt)
- [x] **Zeitzonen-Bug:** `from`/`to` werden jetzt als **UTC-Kalendertage** interpretiert (`ReportTime::parseUtc`, `StatsController`), Dashboard berechnet UTC (`OverviewPage`). Betroffene Tests grün. → entfernt nach Verifikation.
- [x] **Rate-Limit login/track:** `throttle` via Named Rate-Limiter (Config `analytics.rate_limit`, ENV `THROTTLE_LOGIN`/`THROTTLE_TRACK`). **Lokaler Default 99999** (deaktiviert), reale Limits (5/120) in `.env.production` + als Portainer-ENV. `RateLimitTest` (6. Versuch → 429). → entfernt nach Verifikation.
- [x] **Admin-Seeder-Härtung:** fehlende/leere `ANALYTICS_ADMIN_PASSWORD` → RuntimeException (exit non-zero); Gatekeeper in beiden prod-Compose-Files prüft zusätzlich `ANALYTICS_ADMIN_EMAIL/PASSWORD`. → entfernt nach Verifikation.
- [x] **`db:seed --force`:** `AdminUserSeeder` nutzt `firstOrCreate` → Passwort wird **nur beim Anlegen** gesetzt, nicht bei jedem Deploy überschrieben. → entfernt nach Verifikation.

### P1 — Security Backend (alle erledigt)
- [x] **`session_hash` gehärtet:** `hash_hmac('sha256', "site|ip|ua|datum", app.key)` (Pepper) + Site im Hash. → entfernt nach Verifikation.
- [x] **SSE-Token:** neuer Endpoint `POST /ingest/auth/stream-token` liefert kurzlebiges (TTL 1 min) Token mit Claim `scope=stream`; `/ingest/stream` akzeptiert nur noch Stream-Tokens (vollmächtiges JWT → 403). Frontend holt Token vor jedem Connect. → entfernt nach Verifikation.
- [x] `from`/`to` validiert (`date_format:Y-m-d`) → 422 statt 500. → entfernt nach Verifikation.
- [x] `site`-Parameter validiert (Array-Typo `?site[]=` → 422) in Stream/Stats. → entfernt nach Verifikation.
- [x] `trustProxies` auf Webnet/Caddy-Subnetz + localhost eingeschränkt (ENV `TRUSTED_PROXIES`). → entfernt nach Verifikation.
- [x] Event-`payload`-Limit: Tiefe ≤ 5, JSON ≤ 64 KiB → 422. → entfernt nach Verifikation.
- [x] **CORS-Kontrakt:** ACAO-Echo inkl. Port (`TrackCors`-Middleware), ACAO auch auf 422; 403 weiterhin ohne ACAO. → entfernt nach Verifikation.
- [x] **`recentActivity` bei `site=null`:** `when($site, …)` — Events erscheinen im „Alle Sites"-Realtime-Feed. → entfernt nach Verifikation.
- [x] Make-Webhook-Config-Keys zusammengeführt auf `config('analytics.make.webhook_url/api_key')`. → entfernt nach Verifikation.

### P1 — Security Frontend (bis auf CSP erledigt)
- [x] **Server-Details aus Fehler-UI entfernt:** `ApiErrorDetails` nur `{ message }`; `ApiErrorAlert` zeigt nur Status+Message (keine Stacktraces/Dateipfade). → entfernt nach Verifikation.
- [x] **SSE-Session-Ablauf:** 401 beim Stream-Token-Fetch → `fetchJson` cleart Token + Redirect `/login`; kein Endlos-Reconnect. → entfernt nach Verifikation.
- [x] **Requests mit Timeout/AbortController** in `fetchJson` (15s) + `logout` (5s). → entfernt nach Verifikation.
- [ ] **CSP für stats.\*-Domains** (`default-src 'self'; …`) — **im separaten Caddyfile-Repo** umsetzen (stats.*-Block hat dort weder CSP noch `log off`). Nicht in diesem Repo umsetzbar. [Caddyfile-Repo]
- [x] `getUser()` typisiert (`User`-Interface), `App.tsx` ohne Cast. → entfernt nach Verifikation.
- [x] Client-Validierung Sites/Aliases (Hostname-Format, Normalisierung, Länge). → entfernt nach Verifikation.
- [x] Tracker sendet `document.referrer` nur `origin+pathname` (Query-Params/PII gestrippt). → entfernt nach Verifikation.
- [x] **ESLint ergänzt** (`eslint.config.js`, `pnpm lint`, react-hooks; Babel-Parser-Stack wegen TS-7-Kompatibilität). → entfernt nach Verifikation.
- [x] `cache: 'no-store'` bei authentifizierten GETs. → entfernt nach Verifikation.

### P1 — Testabdeckung (Security/Datenschutz)
- [x] **text/plain-Track-Pfad** getestet (Raw-Body, wie Tracker sendet) → 204 + DB-Zeile. → entfernt nach Verifikation.
- [x] Fehlender/leerer Referrer → 403 getestet. → entfernt nach Verifikation.
- [x] **Datenschutz-Asserts:** Schema ohne `ip`-Spalte; gleiche IP+UA, anderer Tag → anderer `session_hash`; Token erscheint nicht in Fehler-Responses. → entfernt nach Verifikation.
- [x] **Frontend-401-Intercept** unit-getestet (`fetchJson`: clearToken + Redirect). → entfernt nach Verifikation.
- [x] Ungültiges JWT → 401 (Backend) getestet. → entfernt nach Verifikation.
- [x] WeeklyReport ohne `REPORT_EMAIL` → Exit-Failure. → entfernt nach Verifikation.
- [x] Cache-TTL (events 60 s / realtime 15 s) assertiert. → entfernt nach Verifikation.
- [ ] E2E: echter SSE-Push (Track → Stream-Ereignis) statt nur Seiten-Render. **Noch offen** — `realtime.spec` prüft weiterhin nur Render. [E2E `realtime.spec`]
- [x] E2E: 403 unbekannter Referrer, 401 ungültiges Token, echte Mehr-Site-Aggregation (Werte), www→Apex, Event-UI-Anzeige (`security.spec`). → entfernt nach Verifikation.

### P2 — Pipeline (bis auf Branch-Protection erledigt)
- [x] **Release-E2E-Image:** `build-image` liefert `image-tag`-Output; E2E-Job zieht passendes Tag (PR `pr-N-test`, sonst `test`), Tag-Push pusht `:test` mit. → entfernt nach Verifikation.
- [x] **`concurrency`** (per-Ref, cancel-in-progress) + PR-spezifische Image-Tags (kein mutabler `:test`-Race). → entfernt nach Verifikation.
- [x] **Failure-Artefakte:** Playwright `html`-Reporter + `trace: retain-on-failure` + `screenshot: only-on-failure` + Upload bei `failure()`. → entfernt nach Verifikation.
- [x] **Coverage:** PHPUnit `--coverage` (CI: xdebug) + Vitest `--coverage` (v8) mit Untergrenzen (60/50/40/60; lokal 91 %). → entfernt nach Verifikation. Hinweis: PHP-Coverage-Driver lokal nicht verfügbar (Herd ohne xdebug) — CI installiert ihn.
- [ ] **Branch-Protection für main** (required status checks `php-tests`, `frontend-tests`, `e2e-tests`) — **GitHub-Repo-Einstellung**, nicht per Datei; in README dokumentiert, Umsetzung via `gh` noch offen.
- [x] README-E2E-Anleitung gefixt (`docker-compose.test.yml` im **Repo-Root**). → entfernt nach Verifikation.
- [x] Repo-Doku: README auf real **public**/„Monorepo" korrigiert (kein Repo-Visibility-Change). → entfernt nach Verifikation.
- [x] Lokale E2E deterministisch: `down -v` in README + exakte Zähler-Assertions (00-tracking 1/1). → entfernt nach Verifikation.
- [x] Actions auf **SHA gepinnt** (alle via `gh api` verifiziert, Versions-Kommentar). → entfernt nach Verifikation.
- [x] Stale TODO-Kommentar in `ci.yml` entfernt. → entfernt nach Verifikation.

### E2E-Helper (Neu, erledigt)
- [x] **Zentrale E2E-Helper** nach Portal-Muster (`e2e/helpers/`: `AuthHelper`, `ToastHelper`, `NetworkHelper`, `SiteHelper`) — Specs nutzen Helper statt eigenem Inline-Setup/Cleanup; Site-Management via API + zentralem `teardown()`. Verifiziert (15/15 grün, kein Leftover). → entfernt nach Verifikation.

## 3. E2E-Test-Verbesserungen (Need dokumentiert)
> **Grundsatz (aus Gespräch, 2026-08-01):** Wegen Testinstabilität legt **nicht jeder E2E-Test seine eigene Seite/Site
> an und löscht sie wieder** — das Muster „create → test → delete" pro Spec macht Tests flaky und hinterlässt Leftover.
> Stattdessen: zentrale Helper in `e2e/helpers/` (Portal-Muster) für Login/Toast/API-Warten/Site-Management;
> Setup + Cleanup zentral (z. B. `test.beforeAll`/`test.afterAll` mit `SiteHelper.teardown()`).
> Umsetzung erfolgt (Abschnitt 2, E2E-Helper). Weiterer Bedarf:

- [ ] **E2E: echter SSE-Push testen** — `realtime.spec` prüft aktuell nur das statische Render der Realtime-Seite
      (Counter + Feed sichtbar). Es fehlt ein Test, der einen Track-Request sendet und prüft, dass das Ereignis über
      den SSE-Stream (`/ingest/stream`) im Realtime-Feed erscheint. [E2E `realtime.spec`]
- [ ] **E2E-Teststabilität — eigene zu trackende Website pro Test (Ideen-Notiz):** Tests funktionieren aktuell nur mit
      **sauberer Datenbasis** (`down -v`). Möglicher Ansatz, um ohne DB-Reset deterministisch zu sein: **jeder Test legt
      seine eigene zu trackende Website an und löscht sie wieder** (via `SiteHelper`). **Nicht jetzt umsetzen** — Deploy/
      Sync hat Priorität; erst nach dem nächsten Release bewerten.
- [ ] **E2E-Teststabilität beobachten:** Mit den neuen Helpern + `retries: CI?1:0` + `workers: 1` + `down -v`-Determinismus
      ist die Basis gesetzt. Wenn in CI weiter Flakes auftreten: exakte Zähler-Assertions prüfen, Stale-Cache-Fälle
      (300s-Summary-/60s-Events-Cache) berücksichtigen, parallele Specs seriell halten, `db_data_test`-Volume beachten.
- [ ] **E2E mit voller Abdeckung der neuen Backend-Verträge:** Stream-Token-403 (volles JWT am `/stream`) ist Backend-getestet;
      optional als E2E-Assert ergänzen. [E2E `security.spec`]
