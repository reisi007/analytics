# Agents.md — Laravel Backend

> **Rolle:** Modul-spezifisches Agent-Dokument für das Backend `laravel/` (reine API, kein Laravel-View).
> Globale Workflow-Regeln: Root `Agents.md` · Architektur `ARCHITECTURE.md` · Tests `TESTING.md`

## Backend-Regeln

- Reine API: keine Laravel-Views, alle Routen unter `/ingest/*` (`apiPrefix: 'ingest'` in `bootstrap/app.php`).
- Pint/PHPStan-Konventionen, Laravel-Stil.
- Tests: PHPUnit 12 + paratest, SQLite **in-memory** (`DB_DATABASE=:memory:`), E-Mail-Tests via Mailpit (:1027/:8027).
- `SiteDetector` cached die Alias→Label-Map statisch → nach Seeds/DB-Änderungen in Tests `SiteDetector::flush()`.
- `RefreshDatabase` + `SiteDetector::flush()` in `setUp`.
- Stream-Tests: `config(['analytics.stream.max_runtime' => 0.2, 'poll_seconds' => 0.1])` setzen, sonst Endlos-SSE.

## Backend-Tests

```bash
# Arbeitsdir: laravel/
composer test                                        # config:clear + php artisan test
php artisan test                                     # PHPUnit
php artisan test --parallel --processes=4            # paratest
# mit Mailpit-Tests:
docker compose -f docker-compose.local.yml up -d mailpit
```

## Code-Landkarte

### Backend (`laravel/`)
| Datei | Aufgabe |
|---|---|
| `routes/api.php` | Alle Routen unter `/ingest/*`. Öffentlich: `POST /auth/login`, `POST /track`. `auth:api`-Gruppe: `/auth/logout`, `/auth/me`, `/config/sites`, `/stream`, `/stats/*`, `/sites` CRUD |
| `app/Http/Controllers/Api/TrackController.php` | `POST /ingest/track`: Site aus Referer, text/plain- oder JSON-Body, validiert, `sessionHash()`, schreibt PageView/Event, antwortet 204 + ACAO. **`pageview`-Event** (`type=event, name=pageview`, SPA-Pattern) wird als Pageview umgewandelt. **Dedup:** Pro Besucher (session_hash) zählt eine URL nur, wenn der letzte getrackte Pageview eine andere URL hatte (verhindert SPA-Doppelfall + Reload-Doppelzählung, in beiden Reihenfolgen) |
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
