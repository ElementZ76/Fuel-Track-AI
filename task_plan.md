# 📋 Task Plan

## Current Phase: 🏗️ Phase 1 — Blueprint (Awaiting Final Approval)

---

### Phase 0: Initialization ✅
- [x] Create `gemini.md` (Project Constitution)
- [x] Create `task_plan.md` (this file)
- [x] Create `findings.md`
- [x] Create `progress.md`
- [x] Create folder structure (`architecture/`, `tools/`, `.tmp/`)
- [x] Ask Discovery Questions
- [x] Receive answers from user
- [x] Define Data Schema in `gemini.md`

### Phase 1: B — Blueprint (Vision & Logic) ← CURRENT
- [x] Discovery Questions answered
- [x] Data Schema v1 defined (users, vehicles, fuel_logs)
- [x] Research: Tailwind v4, FastAPI+SQLite, Fuelio app
- [x] Gap analysis against Fuelio (schema_gap_analysis.md)
- [x] Tier 1 additions approved (expenses table, vehicle fields, fuel log fields)
- [x] Data Schema v2 updated in `gemini.md` (4 tables, 25 endpoints)
- [x] Implementation plan v3 created (final)
- [ ] **Blueprint approved by user** ← WAITING

### Phase 2: L — Link (Connectivity)
- [x] Set up Python virtual environment
- [x] Install FastAPI + SQLAlchemy + uvicorn + pydantic
- [x] Verify backend server starts with empty app

### Phase 3: A — Architect (3-Layer Build)
- [x] `server/database.py` — SQLAlchemy engine + session
- [x] `server/models.py` — User, Vehicle, FuelLog, Expense ORM models
- [x] `server/schemas.py` — All Pydantic input/output schemas
- [x] `server/routers/auth.py` — User CRUD + PIN login
- [x] `server/routers/vehicles.py` — Vehicle CRUD
- [x] `server/services/mileage.py` — Mileage calculation logic
- [x] `server/routers/fuel_logs.py` — Fuel log CRUD + mileage
- [x] `server/routers/expenses.py` — Expense CRUD + category filter
- [x] `server/services/stats.py` — Stats aggregation (fuel + expenses)
- [x] `server/main.py` — Wire all routers, CORS, startup
- [ ] **🧪 Full backend test — all 25 endpoints**

### Phase 3.5: Frontend (Figma-Driven)
- [ ] Ask user for Figma designs
- [ ] Scaffold Vite + React + Tailwind v4
- [ ] Build API client + routing
- [ ] Implement pages from Figma
- [ ] Wire up Chart.js visualizations

### Phase 4: S — Stylize (Refinement & UI)
- [ ] Micro-animations + hover effects
- [ ] Responsive layout
- [ ] Edge case handling (empty states, loading, errors)
- [ ] Present to user for feedback

### Phase 5: T — Trigger (Deployment)
- [ ] Final integration test
- [ ] Dev script (`run_dev.ps1`)
- [ ] Documentation finalized
- [ ] Maintenance Log updated in `gemini.md`
