<div align="center">
  <h1>🚗 FuelTrack AI</h1>
  <p><strong>A locally-hosted vehicle fuel, mileage, and expenditure tracking application.</strong></p>
  
  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/index.html)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

---

## 📌 Overview

FuelTrack AI is a modern, privacy-first, local web application designed to help you track your vehicle's fuel consumption, calculate accurate mileage (km/L), and log maintenance expenses. Inspired by robust mobile trackers like Fuelio, this tool brings comprehensive vehicle analytics directly to your local network.

### ✨ Core Features

*   **Multi-Vehicle Management:** Track cars, bikes, and EVs in one place.
*   **Accurate Mileage Tracking:** Deterministic km/L calculations factoring in full vs. partial fill-ups and missed logs.
*   **Comprehensive Expense Logging:** Track maintenance, insurance, servicing, tolls, and other non-fuel costs.
*   **Deep Analytics:** View total expenditure, cost per km, best/worst mileage, and detailed monthly roll-ups.
*   **Lightweight User Switcher:** Easy, PIN-based local accounts to keep data organized among multiple users.

---

## 🏗️ Architecture (A.N.T. Protocol)

FuelTrack AI is built using a strict 3-Layer Separation of Concerns:

1.  **Architecture (Backend):** Python + FastAPI powering a clean, RESTful API backed by a local SQLite database (via SQLAlchemy).
2.  **Navigation (Frontend):** *[Work in Progress]* React + Vite for a blazing fast SPA.
3.  **Styling & Tools:** Tailwind CSS v4 + Chart.js for premium, responsive analytics visualization.

### Data Schema (v1)

*   `users`: Local profiles with SHA-256 PIN hashing.
*   `vehicles`: Stores metadata (make, model, plate, tank capacity).
*   `fuel_logs`: Fill-up events, auto-computing total costs.
*   `expenses`: Granular non-fuel expenditure tracking.

---

## 🚀 Getting Started

### Prerequisites

*   Python 3.10+
*   Node.js 18+ *(Frontend pending)*
*   Git

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/ElementZ76/Fuel-Track-AI.git
cd Fuel-Track-AI

# Create and activate a virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r server/requirements.txt
```

### 2. Running the Development Server

Convenient scripts are included to spin up the environment:

**For Windows (PowerShell):**
```powershell
./run_dev.ps1
```

**For Mac/Linux (WSL):**
```bash
chmod +x run_dev.sh
./run_dev.sh
```

*Alternatively, run the backend manually from the project root:*
```bash
.\venv\Scripts\activate
uvicorn server.main:app --reload --port 8080
```
> The API documentation will be available at `http://localhost:8080/docs`.

---

## 🗺️ Project Roadmap

- [x] **Phase 0:** Blueprinting & System Constitution (`gemini.md`)
- [x] **Phase 1:** Data Schema & Gap Analysis
- [x] **Phase 2:** Backend Foundation (FastAPI + SQLite + Models)
- [x] **Phase 3:** Core REST API (25 Endpoints completed)
- [x] **Phase 4:** API Testing & Hardening
- [x] **Phase 5:** Frontend UI Scaffold (React + Vite)
- [x] **Phase 6:** UI Implementation (from Figma designs)
- [ ] **Phase 7:** Analytics Visualization & Polish 👈 *(Current Phase)*

---

<div align="center">
  <sub>Built with the B.L.A.S.T. framework for resilient software architecture.</sub>
</div>
