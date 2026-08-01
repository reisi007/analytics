# Agents.md — Build Agent Arbeitsdokument

> **Rolle:** Build Agent. **Darf ausschließlich** `Agents.md`, `Agents.todo.md`, `ARCHITECTURE.md` und `TESTING.md` lesen/bearbeiten.
> Subagenten werden über das Task-Tool gesteuert. Ergebnisse müssen verifiziert werden (bevorzugt parallel).
> Projektwissen (Architektur, Infra, Deployment, Konventionen) → **`ARCHITECTURE.md`**.
> Testaufbau, Verifikations-Playbook und bekannte Test-Fallstricke → **`TESTING.md`**.
> Offene Tasks → **`Agents.todo.md`** (gelöste Todos werden entfernt, nicht abgehakt).

## Lokale Toolchain (verifiziert)
- **PHP 8.5** via **Laravel Herd** — Default-Symlink `php` auf 8.5 umgestellt (global). `php`, `composer`, `php artisan` nutzen damit 8.5.8
- **Docker** (29.5.3) für Builds, Compose-Stacks, Caddyfile-Validation, lokale Postgres/Mailpit
- **GitHub CLI** (`gh`, angemeldet als `reisi007`, Token-Scopes inkl. packages+workflow) für Repo-, Package- und Release-Aktionen
- **Node v26** + **pnpm 11** für Frontend/E2E
- **rclone** (1.74.3, Remotes `pcloud:` + `reisinger.pictures:`) für den Files-Deploy (`sync.sh`)
- Nutzung ist erwünscht: Docker, Herd, gh CLI.

## Projekt-Kurzüberblick
DSGVO-konformes Webanalyse-System (Repo: `reisi007/analytics`, **real public** laut GitHub-API, Doku sagt teils „privat" → offener Punkt in Agents.todo.md). Arbeitet von `/Users/florianreisinger/dev/tracking`.

- **Backend:** Laravel 13, PHP 8.5, Postgres 18, in Docker (php:8.5-fpm-alpine), Image → `ghcr.io/reisi007/analytics` (public, GHCR)
- **Frontend:** React 19 + Vite 8 + TypeScript 7 + daisyUI 5 (SPA, via Caddy ausgeliefert), **pnpm**, Vitest 4, Tailwind 4
- **Tests:** PHPUnit 12 + paratest (parallel), Playwright 1.62
- **Tracking:** komprimiertes `tracker.js` wird **als Teil des Frontend-Builds** erzeugt (kein separates Repo-File)
- **Domain-Detection:** Site wird **nicht** im JS konfiguriert — Server erkennt die Ziel-Domain über den **HTTP Referer** des Track-Requests
- **Unique Visitor:** `session_hash = sha256(ip + user_agent + datum)` — keine IP-/Cookie-Speicherung
- **Realtime:** SSE (`GET /ingest/stream`, Polling DB alle 2s)
- **Report:** wöchentlich (Montag 9:00), Command `GenerateWeeklyReport`
- **Deploy-Ziel:** **Portainer Stack mit ENV-Variablen** (wie Caddy-Stack). Caddy-Container hängt am externen Netz **`webnet`**
- **Domains:** `stats.reisinger.pictures` und `stats.all-the.rest`
- **Integration in Webseiten** (reisinger.pictures, all-the.rest) erfolgt **erst ganz am Ende** (letzter Schritt)

Details → `ARCHITECTURE.md`. Verifikation → `TESTING.md`.

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
- **Produktion über ENV-Variablen, nicht über .env:** Produktive Konfiguration wird ausschließlich über **ENV-Variablen** gesteuert (Portainer-Stack / Container-ENV). Nichts Produktionsrelevantes wird über eine `.env`-Datei geregelt. Lokale Defaults sind bewusst locker (z. B. Rate-Limits `THROTTLE_LOGIN`/`THROTTLE_TRACK` Default `99999` = deaktiviert); die realen Limits stehen in `.env.production` (Referenz) bzw. als Portainer-ENV. Neue konfigurierbare Werte: immer via `env()`/Config lesen, `.env.production`-Referenz pflegen.
- **E2E-Retry nur in CI:** Playwright-`retries` nur in CI (1), nie lokal (`retries: process.env.CI ? 1 : 0`).
- **E2E-Helper statt Inline-Setup:** E2E-Tests legen keine eigenen Sites/Seiten an und löschen sie nicht selbst — dafür gibt es zentrale Helper in `e2e/helpers/` (Vorbild: `portal.reisinger.pictures`-E2E-Helper). Tests nutzen Helper (Login, Toast, Site-Management) statt eigenem Setup/Cleanup (Testinstabilität vermeiden).
- **Gelöste Todos:** werden aus `Agents.todo.md` **entfernt**, sobald sie **verifiziert** sind (Implementierer ≠ Verifizierer). Nicht verifizierte, aber umgesetzte Todos werden **abgehakt** (`[x]`).

## Status / Fortschritt
Status-/Fortschritts-Historie und offene Tasks → **`Agents.todo.md`**.
