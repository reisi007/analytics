---
name: tracking-integration
description: Einbindung und Nutzung der eigenen DSGVO-konformen Tracking-/Analytics-Software (stats.reisinger.pictures / stats.all-the.rest). TRIGGER when immer ein Projekt Web-Analytics einbinden soll, ein Tracking-Skript eingebettet, Sites registriert oder Custom-Events gesendet werden sollen.
---

# Tracking-Software einbinden und nutzen

Self-hosted, DSGVO-konformes Webanalyse-System (Monorepo `reisi007/analytics`). Backend (Laravel/Postgres) + Dashboard (React SPA) laufen unter `https://stats.reisinger.pictures` (und `stats.all-the.rest`). Das Tracking-Skript `x7k2p.js` wird als Teil des Frontend-Builds erzeugt — bewusst unauffälliger Name gegen Adblocker.

## 1. Tracker einbinden

In die HTML-Seite (am besten im `<head>`, `<defer>` macht das Laden unkritisch):

```html
<script src="https://stats.reisinger.pictures/x7k2p.js" defer></script>
```

- `defer` empfohlen: Skript wartet, bis das DOM geparst ist, blockiert nichts.
- Die API-Basis wird **automatisch** aus `document.currentScript.src` erkannt (gleiche Origin) → Pageview an `POST /ingest/track`.
- Der Pageview wird einmal pro Seitenaufbau gesendet (`DOMContentLoaded` bzw. sofort, wenn das DOM schon bereit ist).

> **Keine Konfiguration im JS nötig.** Die Ziel-Site wird serverseitig über den HTTP-Referer des Track-Requests erkannt.

**CSP-Hinweis:** Hat das Ziel-Projekt eine Content-Security-Policy, muss der Track-Host in `script-src` (und bei Custom-Events zusätzlich in `connect-src`) erlaubt sein. Beispiel aus dem Portal: `script-src 'self' https://stats.reisinger.pictures …; connect-src 'self' https://stats.reisinger.pictures`.

## 2. Site registrieren

Damit eine Domain getrackt wird, muss ihr Host in den `aliases` einer Site stehen.

**Variante A — Dashboard** (https://stats.reisinger.pictures/ → Login → „Sites"):
Site hinzufügen mit **Label** + **Aliases** (Hosts). Der Dialog erlaubt auch Löschen (optional inkl. Daten).

**Variante B — CLI** (im Backend-Container):

```bash
php artisan sites:add "Mein Projekt" --aliases=www.meinprojekt.de,meinprojekt.de
```

**Regeln:**
- `site` ist ein frei wählbares **Label** (Anzeigename, Gruppierung) — kein Host.
- `aliases` sind die **Hosts** (Domains/Subdomains). Nur diese werden erkannt.
- Subdomains sind eigenständige Sites; nur `www.*` wird auf den Apex zusammengeführt.
- Unbekannter Referrer → `403` (kein CORS-Header).

## 3. Custom Events

Nach Einbindung ist global `window.trackEvent(name, payload?)` verfügbar:

```js
window.trackEvent('cta_click', { cta: 'pricing', position: 'hero' })
```

- `name`: String — dient als Filter/Sortierung im Dashboard (Events-Seite).
- `payload`: optional, beliebiges JSON-serialisierbares Objekt.
- Gesendet als `POST /ingest/track` mit `type: 'event'` + aktueller `url` (pathname+search).

## 4. SPA-Hinweise

- Der Pageview wird nur **einmal pro Seitenaufbau** gesendet — Route-Wechsel in SPAs werden **nicht** automatisch erfasst.
- Für virtuelle Pageviews bei Route-Änderung einen Helper nutzen, z. B.:

```js
// react-router (v6/7): nach jeder Navigation
router.subscribe((state) => window.trackEvent('pageview', { url: state.location.pathname }))
```

- Ein `pageview`-Event zählt **als Seitenansicht** (wie ein normaler Pageview) und erscheint nicht in den Events.
- **Deduplizierung:** Pro Besucher wird eine URL nur gezählt, wenn der letzte getrackte Pageview eine andere URL hatte.
  Das fängt den SPA-Doppelfall ab (Auto-Pageview beim Laden + Router-Event für dieselbe Route zählen nur einmal)
  und zählt **Seiten-Reloads** derselben URL nicht doppelt. Route-Wechsel auf andere URLs werden normal gezählt.
- Senden erfolgt via `sendBeacon` (Fallback `fetch` + `keepalive`) → Events gehen auch bei Seitenwechsel/Unload nicht verloren.

## 5. Erfasste Daten

| Art | Felder |
|---|---|
| Pageview | `url` (pathname+search), `title`, `referrer` (origin+pathname), `screen` (Breite/Höhe), `lang` |
| Event | `name`, `payload`, `url` |

- **Keine IP wird gespeichert.** Unique-Visitor über Einweg-Hash aus IP+User-Agent+Datum (IP nur Eingabe, nicht persistiert).

## 6. Dashboard-Nutzung

- URL: `https://stats.reisinger.pictures/` (Login mit Admin-Zugang).
- Übersicht: 7/30/90-Tage-Fenster, Top-Seiten, Top-Referrer, Top-Events, Verlauf.
- Echtzeit: Live-View per SSE (Feed).
- Events: gefilterte Liste, Suche nach Event-Name.
- Sites: Verwaltung (Label + Aliases), Löschen optional mit Datenlöschung.

## Installation dieses Skills

Der Skill ist ein Ordner mit einer `SKILL.md`.

**Global (alle Projekte auf diesem Rechner):**

```bash
mkdir -p ~/.agents/skills
# Variante A — Symlink (bleibt per git mit dem Repo synchron, empfohlen):
ln -s "$(pwd)/skills/tracking-integration" ~/.agents/skills/tracking-integration
# Variante B — Kopie:
# cp -R skills/tracking-integration ~/.agents/skills/
ls ~/.agents/skills/tracking-integration/SKILL.md
```

Danach ist der Skill global verfügbar (Agent-Neustart für die Skill-Auflistung nötig).

**Nur in einem Projekt:** Ordner ins Projekt legen (z. B. `skills/` oder `.agents/skills/`) und in der Agent-Konfiguration des Projekts als Skill-Quelle registrieren.
