# Agents.todo.md — Taskliste

> Der Build Agent arbeitet diese Liste ab. Verifikation ausgelagerter Ergebnisse ist Pflicht (bevorzugt parallel).
> Fortschritt/Status wird hier gepflegt (Historie in Abschnitt 0, offene Tasks darunter).
> Gelöste Todos werden **entfernt**, sobald sie **verifiziert** sind (Implementierer ≠ Verifizierer). Nicht verifizierte,
> aber umgesetzte Todos werden **abgehakt** (`[x]`).

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
| 29 E2E-Isolation | ✅ | Jede Spec legt eigene eindeutige Site an (SiteHelper `uniqueSite` `*.e2e.local`) + Teardown → **keine leere DB nötig**, parallel-sicher (`workers` 4/2, `--host-resolver-rules`); echte SSE-Push-E2E (realtime.spec), Stream-JWT-403-E2E (security.spec); Backend-Tests ergänzt (WeeklyReport-ohne-Email, Events/Realtime-TTL); README „public" präzisiert; verifiziert: Backend 74, Frontend 68, E2E 17×2 |
| 30 Produktions-Deployment | ✅ | **Manuell erledigt (2026-08-01):** Portainer Stack `analytics` (Variante A, ENV-Variablen laut README) auf `webnet`; Caddyfile-Block aktiviert (Caddyfile-Repo `reisi007/caddyfile`, `sync.sh`); Release-Sync-Workflow etabliert (lokal `./sync.sh` bzw. `./sync.sh release`) |
| 31 Mobile (Drawer + E2E) | ✅ | Header auf daisyUI-`drawer` mit Hamburger umgebaut (kontrolliertes Toggle, Drawer schließt nach Nav-Klick, Logo bleibt immer sichtbar); OverviewPage-Tabellen `overflow-x-auto`; `SidebarHelper` abstrahiert Viewport (Direktklick vs. Hamburger); Playwright: chromium **1920×1080**, neues `mobile`-Projekt (Pixel 7) läuft **komplette Suite**, `mobile.spec` (kein Horizontal-Scroll, Hamburger/Nav, Overlay-Close, Switcher/Logout); Verifikation grün (Frontend typecheck/lint/79 Tests/build, E2E 38 Tests ×2 Projekte ×3 Läufe) |

## 1. Audit: Security / Code Quality / Testabdeckung (2026-08-01)
> Ergebnisse aus 4 parallelen Audit-Subagenten (Backend, Frontend, E2E/Pipeline, Testabdeckung).
> **Umsetzung erfolgt** und am 2026-08-01 durch separaten Verifier bestätigt (Zero-Failures): Backend 74 Tests, Frontend 68 Tests + typecheck/lint/coverage/build, E2E 17 Tests, Compose config ×3, actionlint — alle grün.
> Hinweis zu Referenzen: Der Produktions-Caddyfile-Block liegt im separaten **Caddyfile-Repo `reisi007/caddyfile`** (nicht in diesem Repo) — hier nur als Hinweis geführt.

### Erledigt (verifiziert, entfernt)
- **P0 — Pipeline-Rot & Sicherheit:** Zeitzonen-Bug (UTC-Kalendertage), Rate-Limit login/track (ENV `THROTTLE_*`, Named-Limiter, 6. Versuch → 429), Admin-Seeder-Härtung (RuntimeException bei fehlendem Passwort), `db:seed --force` via `firstOrCreate`. ✅
- **P1 — Security Backend:** `session_hash` mit HMAC-Pepper + Site, SSE-Stream-Token (TTL 1 min, scope=stream, volles JWT → 403), `from`/`to` `date_format`, `site`-Array → 422, `trustProxies` auf webnet/localhost, Payload-Limit (Tiefe 5, 64 KiB), CORS-Kontrakt (ACAO-Echo inkl. Port, 403 ohne ACAO), `recentActivity` bei `site=null`, Make-Webhook-Config-Keys. ✅
- **P1 — Security Frontend:** Server-Details aus Fehler-UI entfernt, SSE-Session-Ablauf (401 → Login-Redirect, kein Endlos-Reconnect), fetchJson-Timeout 15s + Logout 5s (AbortController), `getUser()` typisiert, Client-Validierung Sites/Aliases, Tracker-Referrer auf origin+pathname gestrippt, ESLint (react-hooks, Babel-Stack), `cache: 'no-store'` auf auth-GETs. ✅
- **P1 — Testabdeckung:** text/plain-Track, fehlender/leerer Referrer → 403, Datenschutz-Asserts (kein `ip`-Schema, Hash-Wechsel je Tag, kein Token-Leak), Frontend-401-Intercept, ungültiges JWT → 401, **WeeklyReport ohne `REPORT_EMAIL` → Exit-Failure (Test ergänzt)**, **Cache-TTL events 60s / realtime 15s (Tests ergänzt)**, **echter SSE-Push-E2E (realtime.spec, umgesetzt)**. ✅
- **P2 — Pipeline:** Release-E2E-Image (image-tag-Output, PR `pr-N-test`), `concurrency` + cancel-in-progress, Failure-Artefakte (html-Reporter, trace/screenshot on-failure, Upload), Coverage (PHPUnit `--coverage`, Vitest v8 mit 60/50/40/60), README-E2E-Anleitung Repo-Root, README „Monorepo/public", lokale E2E deterministisch, Actions SHA-gepinnt, kein stale TODO in ci.yml. ✅
- **E2E-Helper:** zentrale Helper (`AuthHelper`, `ToastHelper`, `NetworkHelper`, `SiteHelper`), Specs nutzen Helper + zentralem Teardown. ✅

### Offen
- [ ] **CSP für stats.\*-Domains** (`default-src 'self'; …`) — **im separaten Caddyfile-Repo** umsetzen (stats.*-Block hat dort weder CSP noch `log off`). Nicht in diesem Repo umsetzbar. [Caddyfile-Repo]

## 3. Tracking: utm_source-Referrer + Top-Seiten ohne Query-Params
- [ ] **utm_source als Referrer:** Enthält die getrackte URL `utm_source`, ersetzt der Wert den `document.referrer`-Referrer (Campaign-Attribution, serverseitig in `TrackController`). Bestehende Pageviews mit `utm_source` in der URL werden migriert (Referrer überschreiben).
- [ ] **Top-Seiten ohne Query-Params gruppieren:** `top_pages` gruppiert nach URL-Pfad ohne Query-String (volle URL bleibt gespeichert); Frontend verhindert Text-Overflow bei langen URLs (OverviewPage/EventsPage/RealtimePage).

## 4. E2E-Teststabilität
> **Umgesetzt (Abschnitt 2, Todo 29):** Jede Spec legt eigene eindeutige Site an (`SiteHelper.uniqueSite` `*.e2e.local`)
> und räumt im `afterAll`-Teardown auf → Tests sind von der DB-Basis entkoppelt und parallel-sicher.
> Offen:
- [ ] **E2E-Teststabilität beobachten:** Mit Isolation + `retries: CI?1:0` + exakten Zähler-Assertions ist die Basis gesetzt.
      Wenn in CI weiter Flakes auftreten: Stale-Cache-Fälle (300s-Summary-/60s-Events-Cache) prüfen, `db_data_test`-Volume beachten.

## 5. Nächste Integration: E2E-Tests mobile & desktop
- [ ] **E2E-Abdeckung für Viewports:** Specs zusätzlich auf **Mobile** (z. B. `iPhone 13`/`Pixel 7`, 390×844) und **Desktop** (1280×720+) ausführen — Ziel: UI brüht nicht auf kleinen Viewports (Tabellen, Site-Dropdown, Stat-Cards, Header).
- [ ] Playwright-Projektionen in `playwright.config.ts` (z. B. `projects` `mobile-chromium` + `desktop-chromium` oder `viewport`-Variation) ergänzen; nur neue/angepasste Specs auf Mobile, bestehende auf Desktop lassen.
- [ ] Mobile-spezifische Layout-Brüche beheben (z. B. Overflow bei langen URLs, enges Dropdown, Stat-Grid), falls Tests rot werden.

## 4. UI-Features (2026-08-01)
> Anwenderwunsch: (1) Default-Ansicht = **Alle Sites** (nicht automatisch erste/erkannte Site), (2) **Logo im Header**,
> (3) **Favicon im Site-Dropdown** mit Fallback, wenn keines gefunden.
> **Erledigt (verifiziert, Implementierer ≠ Verifizierer, 2026-08-01):** Frontend 4/4 (typecheck, 69 Unit-Tests, build, lint),
> Backend 74 Tests, E2E 17/17. Zusätzlich vorbestehenden Bug behoben: `docker-compose.test.yml` fehlten
> `ANALYTICS_ADMIN_*`-Defaults → Seed auf frischem Volume schlug fehl (jetzt Defaults `admin@e2e.local`/`password`, wie CI).
> Details:
- Default-Ansicht „Alle Sites": `SiteContext` initialisiert `site=''`, keine Auto-Detection mehr (`detectSite` in `lib/site.ts` entfernt + Test gelöscht) ✅
- Logo im Header: `Brand` in `App.tsx` zeigt `/favicon.svg` + Text ✅
- Favicon-Dropdown: `components/SiteFavicon.tsx` probiert für fremde Sites mehrere Pfade nacheinander (`favicon.ico` → `.svg` → `.png` → `apple-touch-icon.png`, onError + 4s-Timeout), Fallback Globus für „Alle Sites"/Initiale; `SiteSwitcher` als daisyUI-Dropdown (conditional-render, Escape/Outside-Click-Close) ✅
- Header-Logo: `Brand` zeigt `/favicon.svg` (per `<picture>` mit `/favicon.ico`-Fallback) ✅
- Tests: `SiteFavicon.test.tsx`, `SiteContext.test.tsx` neu; `OverviewPage`/`RealtimePage`-Tests an Default `''` angepasst ✅
- E2E: `e2e/helpers/SiteSwitcherHelper.ts` neu; Specs (`sites`, `00-tracking`, `realtime`, `security`, `sites-management`) auf Dropdown umgestellt ✅
- **Parallele Arbeit (User) wiederhergestellt/beachtet:** `RealtimePage.tsx` `formatTime`-Tooltip (war fälschlich zurückgerollt → wiederhergestellt) + paralleles last-ids-Reconnect/Dedup-Feature (StreamController/StatsAggregator, `last_pv_id`/`last_event_id`); beide Zustände im Working Tree erhalten.
- **Hinweis Flakiness:** `RealtimePage.test.tsx` (Fake-Timer-Tests) timed-out vereinzelt nur im Coverage+Parallel-Lauf (`coverage/.tmp`-ENOENT-Race, 5000ms-Timeout) — isoliert und 3× in Folge grün (78/78). Bei erneuten Flakes: `testTimeout`/Pool prüfen.

## 5. Site-Modell: Label + Aliases (2026-08-01)
> Anwenderwunsch: **Site = frei wählbarer Name (Label), `aliases` = die Hosts (Domains/Subdomains)**.
> Vorher: `site` = kanonischer Host (wurde selbst als Host-Key gemappt + in der UI per HOSTNAME-Pattern erzwungen).
> **Umsetzung delegiert** an Implementierer-Subagenten; Verifikation durch separaten Verifier-Subagenten (Zero-Failures).
> Konsequenz: Nur Hosts aus `aliases` werden erkannt — jede Track-Domain muss explizit in `aliases` stehen (Apex inklusive).
> **Erledigt + verifiziert (2026-08-01):** Implementierung delegiert, Verifikation durch separaten Verifier grün
> (Backend 74/74, Frontend 76/76, typecheck/lint/build). `SiteDetector::buildMap()` mappt nur noch Aliases,
> `detectSite()` matcht nur Aliases, `SitesPage` akzeptiert beliebige Site-Namen, Seeder nutzt `Reisinger Pictures`/`All The Rest`.
- [ ] **Offener Punkt:** Bestandsdaten in Produktion (pageviews/events/sites unter alten Host-Namen) werden NICHT automatisch umbenannt → separates Daten-Migrations-Todo falls gewünscht

## 6. Test-Stack-Konsolidierung: Eine Mailpit für Dev+PHPUnit, E2E nur on-demand (2026-08-02)
> Analog zum Portal-Projekt (Konsolidierungs-Plan 2026-08-02). Problem: `php artisan test` (SQLite in-memory, kein
> DB-Bedarf) hängt aktuell an der **Mailpit des E2E-Stacks** (`:1028/:8028`, `docker-compose.test.yml`) — für
> Backend-Tests muss also unnötig der E2E-Stack-Mailpit laufen. E2E-Tests lesen selbst keine Mail (kein Mailpit-Ref in
> `e2e/`). Ziel: **eine Mailpit (Dev `:1027/:8027`) für Dev + PHPUnit**; der E2E-Stack bleibt selbst-enthaltend
> (CI-Isolation; Postgres/Mailpit/Caddy intern), wird aber **nur noch durch den Agenten on-demand** gestartet
> (`./e2e-up.sh`), default ist nichts E2E-spezifisches gestartet.
> **Einschränkung (User, 2026-08-02):** Aktuell laufende Container NICHT stoppen/neu starten — ein anderer Agent nutzt
> den E2E-Stack (analytics_*_test) gerade. Umsetzung daher rein dateibasiert + validierende Checks, kein `down`/
> `restart`/`--build`-Neustart des laufenden Stacks, kein E2E-Lauf.
> **Status (2026-08-02, delegiert an Implementierer + Verifier ≠ Implementierer):** ✅ Umgesetzt + verifiziert.
> Backend `php artisan test` → **87/87 passed** (gegen Dev-Mailpit :1027/:8027, die nur dafür gestartet wurde);
> `docker compose config` ×2 + `actionlint ci.yml` + `zsh -n e2e-up.sh` grün; kein Container gestoppt/neu gestartet.
> E2E-Lauf bewusst ausgesetzt (anderer Agent nutzt ggf. den E2E-Stack; `e2e-up.sh` ist idempotent, keine `down`-Schritte).
- [x] `laravel/phpunit.xml`: `MAIL_PORT` 1028→1027, `MAILPIT_API` `http://127.0.0.1:8028/api/v1`→`http://127.0.0.1:8027/api/v1` (Dev-Mailpit)
- [x] `.github/workflows/ci.yml` (Job `php-tests`, Mailpit-Service): Ports `1028:1025`/`8028:8025` → `1027:1025`/`8027:8025`
- [x] `docker-compose.test.yml`: Mailpit-External-Ports (`1028:1025`, `8028:8025`) entfernen — bleibt interner Service für `php` (greift nach Update des laufenden Stacks beim nächsten `up`)
- [x] `e2e-up.sh` (Repo-Root, wie `sync.sh`): idempotent — Dev-Stack (`docker-compose.local.yml`) hoch falls nötig; E2E-Stack (`:8081`) checken, nur falls down `IMAGE_TAG=test docker compose -f docker-compose.test.yml up -d --build` + `exec -T php php artisan migrate --seed --force`; Zusammenfassung was gestartet/was lief
- [x] `.run/🚀 [E2E] Start E2E Stack.run.xml` → ruft `./e2e-up.sh` (IntelliJ, Muster `sync.sh`)
- [x] Doku: `TESTING.md` (PHPUnit-Mailpit :1027/:8027, Playbook nutzt Dev-Compose, E2E nur durch Agent via `./e2e-up.sh`), `ARCHITECTURE.md` (Ports-Zeilen 25-26/86-88/188, E2E-Mailpit nur intern), `README.md` (49-50, 116-118, 142), `Agents.md` (E2E-Regel + Ports-Note)
- [x] Verifikation (Verifier ≠ Implementierer): `docker compose config` ×2 (local/test), actionlint `ci.yml`, `php artisan test` grün gegen Dev-Mailpit (läuft bereits), kein Container-Stop/-Restart, kein E2E-Lauf
