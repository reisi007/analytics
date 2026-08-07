# Agents.md — React Dashboard

> **Role:** Module-scope agent doc for the React SPA in `dashboard/`, including the `x7k2p.js` tracker build.
> Global workflow rules live in the root `Agents.md`, `ARCHITECTURE.md`, and `TESTING.md`.

## React Compiler

React Compiler is enabled via `reactCompilerPreset()` in `vite.config.ts`. It is added to the `babel` preset list
(`@rolldown/plugin-babel`), so it runs alongside `linguiTransformerBabelPreset()`. Memoization is handled
automatically by the compiler:

- `useMemo`, `useCallback`, `React.memo`, and `forwardRef` are **antipatterns** and must not be used.
- Write plain components/functions; the compiler optimizes re-renders.
- The tracker entry `src/tracker.ts` (plain TS lib) is intentionally outside the compiler preset: it is built via
  `vite.tracker.config.ts` without the React plugins.

## Commands

```bash
# Working dir: dashboard/
pnpm typecheck     # tsc --noEmit (strict)
pnpm test          # vitest run (jsdom, coverage thresholds)
pnpm build:app     # vite build (SPA)
pnpm lint          # eslint src
pnpm check:i18n    # lingui extract + missing-message check (runs in prebuild)
```

`pnpm build` = `prebuild` (`check:i18n`) + `build:app && build:tracker` (`x7k2p.js` via `vite.tracker.config.ts`).

## Code Landmap

### Frontend (`dashboard/src/`)
| File | Purpose |
|---|---|
| `main.tsx`, `App.tsx` | React bootstrap, routing (`/login`, ProtectedRoute, `/`, `/realtime`, `/events`, `/sites`), layout with logo in header + SiteSwitcher as favicon dropdown |
| `lib/api.ts` | `fetchJson` (Bearer auth, 401→login redirect), types, URL builder, all API calls, `ApiError` |
| `lib/auth.ts` | Token/user in localStorage (`analytics_token`, `analytics_user`), `login`/`logout`, `onAuthChange` |
| `lib/site.ts` | `SitesConfig` type (Site → aliases) |
| `context/SiteContext.tsx` | Default `site=''` = "All websites" (no auto-detection), loads `config/sites` + `stats/sites`, SiteSwitcher state, `refresh()` |
| `context/ToastContext.tsx` | ToastProvider (daisyUI `toast toast-top toast-end`, auto-dismiss 5s), `useToast()` |
| `tracker.ts` | `sendTrack` (text/plain, sendBeacon→fetch keepalive), `pageviewData`, `trackEvent`, global `window.trackEvent` |
| `components/ApiErrorAlert.tsx` | Error UI (Badge + message) |
| `components/SiteFavicon.tsx` | Favicon for foreign sites: tries `favicon.ico` → `.svg` → `.png` → `apple-touch-icon.png` (onError + 4s timeout), fallback: globe for "All websites", initial if all fail |
| `components/SeriesChart.tsx`, `StatCard.tsx` | Chart + stat cards |
| `pages/OverviewPage.tsx` | Summary overview (7/30/90 days), top lists, `rangeParams` in browser TZ |
| `pages/RealtimePage.tsx` | SSE client (`EventSource` with `?token=`, reconnect 3s, feed) |
| `pages/EventsPage.tsx`, `SitesPage.tsx`, `LoginPage.tsx` | Events list, sites management (modals), login |
| `vite.config.ts` | Vite + proxy `/ingest` + Vitest (jsdom) |
| `vite.tracker.config.ts` | Separate build for `x7k2p.js` (tracker, anti-adblock name) |
