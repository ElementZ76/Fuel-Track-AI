# 🔍 Findings

> Research, discoveries, and constraints are logged here.

---

## Discovery Phase — Complete ✅

### User's 5 Answers (Verified)

1. **North Star:** Functional fuel logging app — mileage calc + fuel expenditure tracking
2. **Integrations:** None in v1. All local.
3. **Source of Truth:** `project_definition.txt` — confirmed present, read, and cross-verified
4. **Delivery Payload:** Locally-hosted webapp with clean aesthetics
5. **Behavioral Rules:** Ask when unclear, correct the user, don't assume

### Conflicts Resolved

| Conflict | Resolution |
|----------|-----------|
| Supabase (cloud) vs. local | **SQLite** — zero-config, local-first. Migration path via SQLAlchemy ORM. |
| Tailwind version | **v4** — no config file needed, uses `@import "tailwindcss"` + `@theme` |
| Scope: full vision vs. MVP | **Core first** — logging + mileage + expenditure. Predictive = future. |

---

## Technical Findings

### Tailwind CSS v4 Setup (Vite + React)
- Install: `npm install tailwindcss @tailwindcss/vite`
- Vite plugin: add `tailwindcss()` to `vite.config.js` plugins
- CSS: single `@import "tailwindcss";` replaces old directives
- Customization: use `@theme { }` in CSS instead of `tailwind.config.js`
- **No** `postcss.config.js` or `autoprefixer` needed

### FastAPI + SQLite
- Use `connect_args={"check_same_thread": False}` for SQLite engine
- SQLAlchemy 2.0+ recommended
- Mileage calc: `(current_odo - prev_odo) / fuel_qty` — requires consecutive full-tank fills
- Use Alembic for future schema migrations

### Mileage Calculation Logic
- Need `is_full_tank` flag on each log entry
- Only calculate km/L between two consecutive **full tank** entries
- Partial fills are recorded but excluded from mileage computation
- Edge cases: first entry (no calculation), same odometer (error/skip), negative distance (error)

---

## Constraints & Limitations

1. **Local-only** — no external APIs, no cloud DB in v1
2. **Single-user** — no auth system, local machine only
3. **SQLite limits** — fine for single-user; concurrent write locks could matter later
4. **Indian context** — ₹ currency, km/L units, liters for fuel (pending user confirmation)
