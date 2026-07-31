# Agents.md — Build Agent Arbeitsdokument

> **Rolle:** Build Agent. **Darf ausschließlich** `Agents.md` und `Agents.todo.md` lesen/bearbeiten.
> Subagenten werden über das Task-Tool gesteuert. Ergebnisse müssen verifiziert werden (bevorzugt parallel).

## Lokale Toolchain (verifiziert)
- **PHP 8.5** via **Laravel Herd** — Default-Symlink `php` auf 8.5 umgestellt (global). `php`, `composer`, `php artisan` nutzen damit 8.5.8
- **Docker** (29.5.3) für Builds, Compose-Stacks, Caddyfile-Validation, lokale Postgres/Mailpit
- **GitHub CLI** (`gh`, angemeldet als `reisi007`, Token-Scopes inkl. packages+workflow) für Repo-, Package- und Release-Aktionen
- **Node v26** + **pnpm 11** für Frontend/E2E
- Nutzung ist erwünscht: Docker, Herd, gh CLI.

## Projekt
DSGVO-konformes Webanalyse-System (Repo: `reisi007/analytics`, privat). Arbeitet von `/Users/florianreisinger/dev/tracking`.

- **Backend:** Laravel 13, PHP 8.5, Postgres 18, in Docker (php:8.5-fpm-alpine), Image → `ghcr.io/reisi007/analytics` (public, GHCR)
- **Frontend:** React 19 + Vite 8 + TypeScript 7 + daisyUI 5 (SPA, via Caddy ausgeliefert), **pnpm** als Package-Manager, Vitest 4, Tailwind 4
- **Tests:** PHPUnit 12 + paratest (parallel), Playwright 1.62
- **Tracking:** komprimiertes `tracker.js` wird **als Teil des Frontend-Builds** erzeugt (kein separates Repo-File)
- **Domain-Detection:** Site wird **nicht** im JS konfiguriert — Server erkennt die Ziel-Domain über den **HTTP Referer** des Track-Requests
- **Unique Visitor:** `session_hash = sha256(ip + user_agent + datum)` — keine IP-/Cookie-Speicherung
- **Realtime:** SSE (`GET /api/stream`, Polling DB alle 2s)
- **Report:** wöchentlich (Montag 9:00), Command `GenerateWeeklyReport`
- **Deploy-Ziel:** **Portainer Stack mit ENV-Variablen** (wie Caddy-Stack). Caddy-Container hängt am externen Netz **`webnet`**
- **Domains:** `stats.reisinger.pictures` und `stats.all-the.rest`
- **Integration in Webseiten** (reisinger.pictures, all-the.rest) erfolgt **erst ganz am Ende** (letzter Schritt)

## Wichtige Infrastruktur-Fakten (verifiziert)
- Caddy läuft als Container, externes Netz `webnet`, mountet `/home/webadmin/websites` → `/srv/websites` (ro)
- → statische Files unter `/home/webadmin/websites/analytics/…` legen, dann unter `/srv/websites/analytics/…` erreichbar
- Caddyfile-Repo: `/Users/florianreisinger/dev/caddyfile` (Repo `reisi007/caddyfile`, Deploy via `./sync.sh`)
- Muster FastCGI-Proxy (siehe `portal.reisinger.pictures`): `reverse_proxy <service>:9000 { transport fastcgi { env SCRIPT_FILENAME …/index.php resolve_root_symlink } }`
- SSE braucht `flush_interval -1` im `reverse_proxy`
- Compose-Service-Name = DNS-Name im Netz. Caddyfile referenziert `analytics_php:9000` → Service-Name `analytics_php`

## Architektur-Entscheidungen (fix)
- **CORS (korrigiert):** Eingebettete Cross-Origin-Skripte laufen im Page-Origin → Track-Request an stats.* ist cross-origin. `/api/track` setzt `Access-Control-Allow-Origin: *`; Tracker sendet `Content-Type: text/plain` (Simple Request, kein Preflight). Dashboard-Reads (same-origin) brauchen kein CORS.
- E2E-Job hängt an `build-image`; `build-image` läuft auf **allen** Branches (main→`latest`, PR→`pr-*`), damit E2E auch auf PRs läuft
- Frontend wird NICHT im Container serviert → als Zip im GitHub Release, deploy.sh entpackt es
- Compose-Services: `analytics_db`, `analytics_php`, `analytics_worker`, `analytics_scheduler`
- Produktives .env wird über **Portainer Stack ENV-Variablen** injiziert (keine Secrets im Repo)
- Dashboard-Site-Auswahl aus `window.location.host` (stats.* → Site), API-Read via `?site=`
- **Subdomains eigenständig:** Subdomains (z. B. `dev.reisinger.pictures`) werden als eigene Sites behandelt (eigene Stats, eigene Report-Mails). Nur `www.*` wird auf die Apex-Domain zusammengeführt. `GenerateWeeklyReport` iteriert **alle Sites mit Daten** (inkl. Subdomains) + die konfigurierten Sites — nicht nur die 2 konfigurierten.
- **Combined Overview + Caching:** `site`-Parameter in Stats-APIs ist **optional** → ohne `site` wird über **alle Sites** aggregiert. `GET /api/stats/sites` liefert die Liste aller Sites (Daten + konfiguriert). Dashboard: Site-Switcher („Alle Sites" + einzelne). Read-APIs werden via `Cache::remember` gecacht (summary 300s, events 60s, realtime 15s); SSE bleibt live (un-gecacht).
- **Auth (JWT-Login):** `tymon/jwt-auth` 2.3, Secret via `JWT_SECRET` (Prod-Pflicht, Gatekeeper). `POST /api/auth/login` → Bearer-Token. `/api/stats/*` und `/api/stream` sind `auth:api`-geschützt (Token per Header, SSE via `?token=`). `/api/track` bleibt öffentlich. Admin-User via Seeder aus `ANALYTICS_ADMIN_EMAIL`/`ANALYTICS_ADMIN_PASSWORD`.
- **Laravel liefert keine UI:** Backend = reine API, kein Laravel-View. Lokal: `tracking.test` (Herd) bedient nur `/api/*`; React läuft via Vite-Dev (`pnpm dev`, Proxy `/api` → `http://tracking.test`).
- **Sites in der DB (CORS-Whitelist):** Welche Seiten Analytics erlaubt sind (site → aliases) liegt in der **DB-Tabelle `sites`** (kein PHP-Config, kein hardcoded Frontend-Config). `/api/track` akzeptiert nur Referrer-Origins, deren Host in der DB steht (sonst 403 ohne `Access-Control-Allow-Origin`). `GET /api/config/sites` + `/api/stats/sites` lesen aus der DB. `detectSite` im Frontend nutzt die geladenen Aliases, Fallback = Host. Seeder legt `reisinger.pictures`, `all-the.rest` an (plus `localhost` für local/testing); Verwaltung via `sites:add`/`sites:list` (Artisan).
- **Keine Inline-Styles in React:** In JSX/TSX ausschließlich Tailwind-/daisyUI-Klassen; `style={{...}}`-Props sind verboten.
- **E-Mail-Kompatibilität:** Weekly-Report als handgebautes HTML-Template (Tabellen-Layout, **nur Inline-Styles**, kein `<style>`-Block, keine CSS-Klassen/@media) für maximale Client-Kompatibilität. Ziel: **≥ 90 % Mailpit-Compatibility-Score** (caniemail).

## Arbeitsregeln (aus Gesprächen abgeleitet)
- **Commits:** häufig committen, **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `build:`), Imperativ.
- **Releases:** Changelog im GitHub-Release-Format aus Conventional Commits generieren (git-cliff), Tag `v<version>`.
- **Subagenten:** Beauftragung über Task-Tool; Berichte waren teils leer → Ergebnisse **immer verifizieren** (Dateien prüfen, Tests/Builds laufen lassen). Verifikation bevorzugt parallel.
- **Verifikation auslagern:** Der Build Agent verifiziert **nicht selbst**. Verifikation wird an einen **separaten Subagenten** delegiert, der **nicht** der Implementierende ist (Rollen getrennt: Implementierer ≠ Verifizierer).
- **Pre-existing Errors:** Bei Verifikationen sind **auch vorbestehende Fehler nicht zulässig** — alle Fehler (auch alt/fremd) müssen behoben werden, bevor eine Arbeit als fertig gilt (Zero-Failures-Policy).
- **Subagenten-Ausfall:** Bei leeren/abgebrochenen Subagent-Ergebnissen selbst weitermachen (direkt bauen), Rolle in Agents.md dokumentieren.
- **Edits an Projektdateien:** Der Build Agent editiert selbst NUR `Agents.md`/`Agents.todo.md`; Datei-Edits an Projekt-Code übernimmt er **nicht selbst**, sondern delegiert sie per Task-Tool an Subagenten (mit konkreter Datei-, Inhalts- und Verifikations-Anweisung). Ausnahme bei Subagenten-Ausfall → selbst machen (siehe Subagenten-Ausfall).
- **Nicht delegieren, wenn es deutlich schneller ist:** Bei trivialen, kleinen Edits (z. B. eine Zeile in einer Datei ändern) **nicht** an Subagenten delegieren, wenn der Build Agent die Änderung selbst **deutlich schneller** umsetzen kann. Delegation lohnt nur bei größeren, mehrschrittigen oder parallelisierbaren Aufgaben (und bei Verifikation, siehe oben).
- **Local Docker-Kollisionen:** Portal-Stack belegt/definiert Ports 3306/3307 (MariaDB), 7700/7701 (Meilisearch), 1025/8025 + 1026/8026 (Mailpit). Analytics nutzt nicht-kollidierende Host-Ports:
  | Service | Local | Test/E2E |
  |---|---|---|
  | Postgres | 5433 | 5434 |
  | Mailpit SMTP | 1027 | 1028 |
  | Mailpit Web/API | 8027 | 8028 |
  | E2E-Web | – | 8081 |
- **Library-Versionen:** aktuelle stabile Versionen (Stand 2026-07): Laravel 13.23, PHP 8.5, Postgres 18, React 19.2, Vite 8, TS 7, Vitest 4, Tailwind 4, daisyUI 5, Playwright 1.62, pnpm 11, Composer 2.10. Beim Setup die neuesten verwenden.
- **Gelöste Todos** werden aus `Agents.todo.md` **entfernt** (nicht abgehakt).

## Status / Fortschritt
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

## Verifikations-Playbook
```bash
# Backend (Arbeitsdir laravel/)
composer install && cp .env.example .env && php artisan key:generate
php artisan migrate --database=testing    # SQLite in-memory
php artisan test --parallel --processes=4

# Frontend (Arbeitsdir dashboard/)
pnpm install && pnpm test:unit && pnpm build

# E2E (Arbeitsdir e2e/)
npx playwright install --with-deps
npx playwright test

# Caddyfile (Arbeitsdir caddyfile/)
docker run --rm -v "$(pwd)/Caddyfile:/etc/caddy/Caddyfile" caddy:latest caddy validate --config /etc/caddy/Caddyfile
```
