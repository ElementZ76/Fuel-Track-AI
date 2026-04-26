# 📜 Project Constitution — `gemini.md`

> **This file is LAW.** All schemas, rules, and architectural invariants are defined here.
> Only update when: a schema changes, a rule is added, or architecture is modified.

---

## 🎯 Project: FuelTrack AI

**North Star:** A functional fuel logging webapp that calculates mileage (km/L) and tracks fuel expenditure over time, hosted locally with clean aesthetics.

**Tech Stack:**
- **Frontend:** React + Vite + Tailwind CSS v4 + React Router
- **Backend:** Python + FastAPI
- **Database:** SQLite (via SQLAlchemy ORM)
- **Charts:** Chart.js (for spending/mileage visualization)

---

## 🔒 Data Schema

### Database Tables

#### `users`
```json
{
  "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
  "username": "TEXT UNIQUE NOT NULL — e.g., 'praveen'",
  "pin_hash": "TEXT NOT NULL — hashed 4-digit PIN (SHA-256, lightweight)",
  "display_name": "TEXT — e.g., 'Praveen'",
  "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP"
}
```

#### `vehicles`
```json
{
  "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
  "user_id": "INTEGER NOT NULL — FK → users.id",
  "name": "TEXT NOT NULL — e.g., 'My Honda City'",
  "make": "TEXT — e.g., 'Honda'",
  "model": "TEXT — e.g., 'City'",
  "year": "INTEGER — e.g., 2022",
  "fuel_type": "TEXT DEFAULT 'petrol' — petrol | diesel | cng | electric",
  "plate": "TEXT — license plate, e.g., 'KA01AB1234'",
  "tank_capacity": "REAL — fuel tank size in liters, e.g., 40.0",
  "initial_odometer": "REAL DEFAULT 0 — starting odometer in km",
  "notes": "TEXT — optional description/notes about the vehicle",
  "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP"
}
```

#### `fuel_logs`
```json
{
  "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
  "vehicle_id": "INTEGER NOT NULL — FK → vehicles.id",
  "date": "DATE NOT NULL — date of fill-up",
  "odometer_reading": "REAL NOT NULL — current odometer in km",
  "fuel_quantity": "REAL NOT NULL — liters filled",
  "price_per_liter": "REAL NOT NULL — ₹ per liter",
  "total_cost": "REAL NOT NULL — fuel_quantity × price_per_liter",
  "is_full_tank": "BOOLEAN DEFAULT TRUE — needed for accurate mileage calc",
  "fuel_type": "TEXT DEFAULT 'petrol' — petrol | diesel | cng",
  "station_name": "TEXT — e.g., 'HP Petrol Pump, MG Road'",
  "missed": "BOOLEAN DEFAULT FALSE — if true, a fill-up was missed before this entry (invalidates mileage calc for this entry)",
  "notes": "TEXT — optional notes",
  "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP"
}
```

#### `expenses`
```json
{
  "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
  "vehicle_id": "INTEGER NOT NULL — FK → vehicles.id",
  "date": "DATE NOT NULL — date of expense",
  "category": "TEXT NOT NULL — maintenance | insurance | service | parking | tolls | wash | repairs | tires | other",
  "title": "TEXT NOT NULL — e.g., 'Oil Change', 'Annual Insurance'",
  "amount": "REAL NOT NULL — ₹ cost",
  "odometer_reading": "REAL — odometer at time of expense (optional)",
  "expiry_date": "DATE — expiry date for insurance or warranties (optional)",
  "notes": "TEXT — optional details",
  "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP"
}
```

### Computed Values (Not Stored — Calculated on Read)

```json
{
  "distance_traveled_km": "current_odometer - previous_odometer",
  "mileage_kmpl": "distance_traveled_km / fuel_quantity (only when is_full_tank=true AND missed=false on both entries)",
  "cost_per_km": "total_cost / distance_traveled_km",
  "avg_mileage": "SUM(distances) / SUM(fuel_quantities) — across valid logs only",
  "total_fuel_spent": "SUM(total_cost) from fuel_logs",
  "total_expense_spent": "SUM(amount) from expenses",
  "total_vehicle_cost": "total_fuel_spent + total_expense_spent",
  "monthly_expenditure": "SUM(fuel_cost + expense_cost) grouped by month",
  "expense_by_category": "SUM(amount) grouped by category"
}
```

### API Input Schemas (Pydantic)

#### UserCreate
```json
{
  "username": "string (required, unique)",
  "pin": "string (required, 4 digits)",
  "display_name": "string (optional)"
}
```

#### LoginRequest
```json
{
  "username": "string (required)",
  "pin": "string (required)"
}
```

#### VehicleCreate
```json
{
  "user_id": "integer (required)",
  "name": "string (required)",
  "make": "string (optional)",
  "model": "string (optional)",
  "year": "integer (optional)",
  "fuel_type": "string (optional, default: 'petrol')",
  "plate": "string (optional)",
  "tank_capacity": "float (optional)",
  "initial_odometer": "float (optional, default: 0)",
  "notes": "string (optional)"
}
```

#### FuelLogCreate
```json
{
  "vehicle_id": "integer (required)",
  "date": "date (required)",
  "odometer_reading": "float (required)",
  "fuel_quantity": "float (required)",
  "price_per_liter": "float (required)",
  "is_full_tank": "boolean (optional, default: true)",
  "fuel_type": "string (optional)",
  "station_name": "string (optional)",
  "missed": "boolean (optional, default: false)",
  "notes": "string (optional)"
}
```

#### ExpenseCreate
```json
{
  "vehicle_id": "integer (required)",
  "date": "date (required)",
  "category": "string (required) — maintenance | insurance | service | parking | tolls | wash | repairs | tires | other",
  "title": "string (required)",
  "amount": "float (required)",
  "odometer_reading": "float (optional)",
  "expiry_date": "date (optional)",
  "notes": "string (optional)"
}
```

### API Output Schemas (Pydantic)

#### UserRead
```json
{
  "id": "integer",
  "username": "string",
  "display_name": "string | null",
  "created_at": "datetime"
}
```

#### LoginResponse
```json
{
  "success": "boolean",
  "user": "UserRead | null",
  "message": "string"
}
```

#### VehicleRead
```json
{
  "id": "integer",
  "user_id": "integer",
  "name": "string",
  "make": "string | null",
  "model": "string | null",
  "year": "integer | null",
  "fuel_type": "string",
  "plate": "string | null",
  "tank_capacity": "float | null",
  "initial_odometer": "float",
  "notes": "string | null",
  "created_at": "datetime"
}
```

#### FuelLogRead
```json
{
  "id": "integer",
  "vehicle_id": "integer",
  "date": "date",
  "odometer_reading": "float",
  "fuel_quantity": "float",
  "price_per_liter": "float",
  "total_cost": "float",
  "is_full_tank": "boolean",
  "fuel_type": "string",
  "station_name": "string | null",
  "missed": "boolean",
  "notes": "string | null",
  "created_at": "datetime",
  "distance_km": "float | null — computed from previous log",
  "mileage_kmpl": "float | null — computed (null if missed=true or not full tank)"
}
```

#### ExpenseRead
```json
{
  "id": "integer",
  "vehicle_id": "integer",
  "date": "date",
  "category": "string",
  "title": "string",
  "amount": "float",
  "odometer_reading": "float | null",
  "expiry_date": "date | null",
  "notes": "string | null",
  "created_at": "datetime"
}
```

#### MileageStats
```json
{
  "vehicle_id": "integer",
  "total_distance_km": "float",
  "total_fuel_liters": "float",
  "total_fuel_spent": "float",
  "total_expense_spent": "float",
  "total_vehicle_cost": "float — fuel + expenses combined",
  "avg_mileage_kmpl": "float",
  "avg_cost_per_km": "float",
  "best_mileage_kmpl": "float",
  "worst_mileage_kmpl": "float",
  "expense_by_category": [
    {
      "category": "string",
      "total_amount": "float",
      "count": "integer"
    }
  ],
  "monthly_breakdown": [
    {
      "month": "string — YYYY-MM",
      "distance_km": "float",
      "fuel_liters": "float",
      "fuel_cost": "float",
      "expense_cost": "float",
      "total_cost": "float — fuel_cost + expense_cost",
      "avg_mileage": "float"
    }
  ]
}
```

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users` | Create a new user |
| `GET` | `/api/users` | List all users (for switcher) |
| `POST` | `/api/auth/login` | Verify PIN, return user info |
| `POST` | `/api/vehicles` | Create a new vehicle |
| `GET` | `/api/vehicles` | List all vehicles |
| `GET` | `/api/vehicles?user_id={id}` | List vehicles for a specific user |
| `GET` | `/api/vehicles/{id}` | Get vehicle details |
| `PUT` | `/api/vehicles/{id}` | Update vehicle |
| `DELETE` | `/api/vehicles/{id}` | Delete vehicle |
| `POST` | `/api/vehicles/{id}/fuel-logs` | Add a fuel log entry |
| `GET` | `/api/vehicles/{id}/fuel-logs` | List fuel logs for a vehicle |
| `GET` | `/api/vehicles/{id}/fuel-logs/{log_id}` | Get single fuel log |
| `PUT` | `/api/vehicles/{id}/fuel-logs/{log_id}` | Update a fuel log |
| `DELETE` | `/api/vehicles/{id}/fuel-logs/{log_id}` | Delete a fuel log |
| `POST` | `/api/vehicles/{id}/expenses` | Add an expense entry |
| `GET` | `/api/vehicles/{id}/expenses` | List expenses for a vehicle |
| `GET` | `/api/vehicles/{id}/expenses?category={cat}` | Filter expenses by category |
| `GET` | `/api/vehicles/{id}/expenses/{exp_id}` | Get single expense |
| `PUT` | `/api/vehicles/{id}/expenses/{exp_id}` | Update an expense |
| `DELETE` | `/api/vehicles/{id}/expenses/{exp_id}` | Delete an expense |
| `GET` | `/api/vehicles/{id}/stats` | Get mileage & expenditure stats (fuel + expenses) |
| `GET` | `/api/vehicles/{id}/stats/monthly` | Monthly breakdown (fuel + expenses) |

---

## 📐 Architectural Invariants

1. **3-Layer Separation**: Architecture (SOPs) → Navigation (Routing) → Tools (Execution)
2. **Deterministic Tools**: All scripts in `tools/` must be atomic, testable, and free of probabilistic logic.
3. **Data-First**: No tool is built until its input/output schema is defined here.
4. **Environment Isolation**: All secrets live in `.env`. Never hardcode credentials.
5. **Ephemeral Intermediates**: All temp data lives in `.tmp/`. Payloads go to their cloud destination.
6. **SQLite is the DB**: Local file-based. No cloud DB in v1. Migration path to PostgreSQL preserved via SQLAlchemy ORM.
7. **Mileage Calculation Rule**: Accurate km/L requires `is_full_tank = true` AND `missed = false` on consecutive fill-ups. Partial fills and entries with missed fill-ups are recorded but excluded from mileage calculations.
8. **total_cost is auto-calculated**: `total_cost = fuel_quantity × price_per_liter` — always computed, never manually entered.
9. **Expenses are separate from fuel logs**: Fuel costs and non-fuel expenses are tracked in different tables but aggregated in stats. Category list is fixed (not user-customizable in v1).

---

## 🚦 Behavioral Rules

1. **Ask, don't assume.** If a requirement is ambiguous, halt and ask the user.
2. **Correct the user.** If the user is wrong about something technical, say so respectfully.
3. **Core first, stretch later.** Fuel logging + mileage + expenditure tracking are MVP. Predictive features are Phase 2+.
4. **Local-only in v1.** No cloud services, no external APIs.
5. **Indian context.** Currency is ₹ (INR). Fuel is measured in liters. Distance in kilometers.

---

## 🔧 Maintenance Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-25 | Project initialized | B.L.A.S.T. Protocol 0 |
| 2026-04-25 | Data schema defined | Discovery complete, user confirmed SQLite + Tailwind v4 |
| 2026-04-25 | Behavioral rules added | User specified ask-first, correct-me rules |
| 2026-04-25 | Added `users` table + auth endpoints | User wants lightweight login/user-switching |
| 2026-04-25 | Frontend deferred to Figma | User will provide Figma designs for UI implementation |
| 2026-04-25 | Tier 1 gap fill: `expenses` table, vehicle fields, fuel log fields | Fuelio comparison — user approved all Tier 1 additions |
