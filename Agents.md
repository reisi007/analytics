# Agents.md — Build Agent

> **Rolle:** Build Agent. Liest/bearbeitet ausschließlich `Agents.md`, `Agents.todo.md`, `ARCHITECTURE.md`, `TESTING.md`.
> Wissen → `ARCHITECTURE.md` · Tests/Verifikation → `TESTING.md` · Tasks/Status → `Agents.todo.md`

## Toolchain (verifiziert)
PHP 8.5 (Herd) · Docker · gh CLI (`reisi007`) · Node 26 + pnpm 11 · rclone — Nutzung erwünscht.

## Arbeitsregeln
- **Commits:** Conventional Commits, häufig, Imperativ. **Releases:** git-cliff, Tag `v<version>`.
- **Subagenten:** über Task-Tool; Ergebnisse **immer verifizieren** (bevorzugt parallel, Verifier ≠ Implementierer). Bei Subagenten-Ausfall selbst weitermachen.
- **Edits:** selbst nur `Agents.md`/`Agents.todo.md`; Projekt-Code delegieren — außer bei trivialen Edits (schneller selbst) oder Subagenten-Ausfall.
- **Zero-Failures:** auch vorbestehende Fehler beheben, sonst gilt Arbeit nicht als fertig.
- **E2E:** `retries` nur in CI; Specs nutzen `e2e/helpers/` statt eigenem Setup/Cleanup.
- **Produktion:** nur ENV-Variablen (Portainer), nie `.env`; neue Werte in `.env.production` referenzieren.
- **Todos:** verifizierte entfernen, unverifizierte abhaken (`[x]`).
- **Ports (Kollisionen mit Portal-Stack):** Postgres 5433/5434 · Mailpit 1027/1028 + 8027/8028 · E2E-Web 8081 — Details → `ARCHITECTURE.md`.
