# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

MT System is a **Thai-language machine maintenance prototype** for a rubber manufacturing plant. It covers the full lifecycle: Operator scans a QR code → files a repair request → Technician picks it up from a queue → Supervisor verifies completion → inventory is automatically decremented → Manager views KPI dashboard.

The frontend is a single-page React app loaded via `<script type="text/babel">` (no build step). Three separate HTML entry points exist, each wiring a different data backend:

| HTML file | Data source |
|---|---|
| `MT System.html` | `data.js` — fully static, hard-coded seed data |
| `MT System (Supabase).html` | `supabase-bridge.js` + Supabase (PostgreSQL) |
| `MT System (API).html` | `api-bridge.js` + Express/MySQL REST backend |

## Running the app

**Static version (no backend needed):**
```bash
cd mt-system
python -m http.server 8000
# open http://localhost:8000/MT%20System.html
```

**API/MySQL version:**
```bash
cd backend
npm install
node server.js        # starts on port 3001 (configurable via PORT env var)
# then serve the front end with python -m http.server 8000
# open http://localhost:8000/MT%20System%20(API).html
```

**Supabase version:**
1. Edit `src/supabase-config.js` with your project URL and anon key.
2. Run `supabase/schema.sql` then `supabase/seed.sql` in the Supabase SQL editor.
3. Serve as above and open `MT System (Supabase).html`.

The app **must** be served through a local server (not opened as a `file://`) — CORS and module imports require HTTP.

## Architecture

### Frontend file loading order (defined in each HTML file)
```
src/data.js  OR  src/supabase-bridge.js  OR  src/api-bridge.js   ← sets window.DATA
src/tweaks-panel.jsx                                ← useTweaks hook + design knobs
src/ui.jsx                                          ← shared components (Icon, badges, tables)
src/screens_mobile.jsx                              ← field/mobile screens (Login, MachineScreen, ReportForm, TechQueue, RepairForm, mobile request list)
src/screens_desk1.jsx                               ← desktop screens (RequestList, RequestDetail, VerifyQueue, PmSchedule, Admin)
src/screens_store.jsx                               ← Store Keeper screens (MasterData, ReorderList, StockInOut)
src/screens_dashboard.jsx                           ← Dashboard (Manager view)
src/app.jsx                                         ← App shell: routing, role switcher, layout
```

### `window.DATA` contract
All screens read from `window.DATA`. Every backend bridge (`src/data.js`, `src/supabase-bridge.js`, `src/api-bridge.js`) must expose the same shape:
- `DATA.machines[]`, `DATA.requests[]`, `DATA.repairs{}`, `DATA.usage{}`, `DATA.parts[]`, `DATA.pm[]`, `DATA.stockIn[]`, `DATA.stockOut[]`, `DATA.users[]`
- Lookup helpers: `DATA.machineByCode(code)`, `DATA.partByCode(code)`, `DATA.requestsForMachine(code)`
- Formatters: `DATA.fmtMoney(n)`, `DATA.fmtNum(n)`
- Static presentational data (kept in bridge, not yet in DB): `DATA.kpi[]`, `DATA.pareto[]`, `DATA.mcGroups[]`, `DATA.downtimeTrend[]`, `DATA.riskMatrix[]`, `DATA.riskGrid`

### Routing / navigation
`app.jsx` manages a `screen` string + `params` object + a history `stack`. Navigation uses `ctx.go(screenKey, params)` and `ctx.back()`. The `SCREENS` map in `app.jsx` declares every screen's component, shell type (`"full"` for login, `"desktop"` for sidebar layout, `field: true` for mobile-style centered layout), and metadata (title, back button, `wide` flag).

### Role system
Six roles: `Operator`, `Technician`, `Supervisor`, `Store Keeper`, `Manager`, `Admin`. The `NAV` map in `app.jsx` defines each role's home screen and sidebar menu. Login is prototype-only (no real auth check); role can be switched via the in-app switcher. The `ctx` object passed to every screen contains `{ go, back, login, role, params, toast }`.

### Live refresh (API/Supabase modes)
`src/api-bridge.js` polls `/api/bootstrap` every 8 seconds and dispatches `"mt-data-refresh"` if request statuses changed. `src/app.jsx` listens for this event and forces a re-render without changing the current screen.

## Database

Two SQL dialects are maintained in parallel:

- **PostgreSQL / Supabase**: `supabase/schema.sql`, `supabase/seed.sql`
- **MySQL 8.0+**: `mysql/schema_mysql.sql` (not shown in Glob but referenced), `mysql/seed_mysql.sql`

Key DB behaviours implemented as triggers:
- Auto-generate `REQ-YYYY-NNN` request numbers
- Auto-decrement `current_stock` when `spare_part_usage` rows are inserted
- Queue Telegram notifications for new High/Critical requests and stock below ROP

Seed files are generated from `src/data.js` using `supabase/gen_seed.mjs` or `mysql/gen_seed_mysql.mjs`. Re-run these if you change `src/data.js`.

## Backend (Express + MySQL)

`backend/server.js` exposes:
- `GET /api/bootstrap` — returns all data in `window.DATA` shape (JSON)
- `POST /api/requests` — create new repair request
- `POST /api/repairs` — save repair record + parts used
- `GET /api/requests/poll` — lightweight status check for the 8 s poller

`backend/telegram-worker.js` processes the `telegram_outbox` table and sends messages via the Telegram Bot API. Configure via `.env` (copy from `backend/` — needs `DB_*`, `TELEGRAM_BOT_TOKEN`).

## Design system

CSS variables are defined in `styles.css`. Key tokens:
- `--navy` (brand chrome, settable via tweaks), `--accent`, `--bg`, `--surface`, `--surface-2`, `--border`, `--ink`, `--ink-2`, `--ink-3`
- `data-density="compact|cozy"` attribute on `<html>` controls spacing
- Thai fonts: IBM Plex Sans Thai (default), Noto Sans Thai, Sarabun — switchable via the Tweaks panel

`src/tweaks-panel.jsx` exports the `useTweaks` hook and a suite of design-knob components (`TweakSlider`, `TweakRadio`, `TweakColor`, etc.) for live UI adjustment during prototyping. The `TWEAK_DEFAULTS` block in `src/app.jsx` is delimited by `/*EDITMODE-BEGIN*/` / `/*EDITMODE-END*/` markers for tooling.
