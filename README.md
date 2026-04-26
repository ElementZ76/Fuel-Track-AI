<div align="center">
  <div style="padding: 20px;">
    <div style="width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, #8069BF, #4E4273); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: #fff; margin: 0 auto 16px; font-family: 'Space Grotesk', sans-serif;">F</div>
    <h1 style="margin: 0; font-family: 'Space Grotesk', sans-serif;">FuelTrack AI</h1>
    <p style="margin-top: 8px; color: #A09CB0;">Automotive Precision • Fleet Telemetry • Financial Tracking</p>
  </div>
</div>

---

## 📖 Overview

**FuelTrack AI** is a comprehensive, local-first web application designed to track vehicle telemetry, log fuel expenditures, and calculate precise efficiency metrics over time. Built with a focus on a premium, "Automotive Precision" design language, the platform offers users deep insights into their fleet's financial and physical performance.

---

## ✨ Key Features

- **Multi-Vehicle Fleet Management:** Track multiple vehicles under a single profile with dedicated telemetry for each.
- **Precision Logging:** Granular data entry for fuel fill-ups (accounting for partial fills and missed logs) and diverse maintenance expenses.
- **Advanced Telemetry Analytics:** Dynamic calculation of `km/L`, cost per kilometer, and overall expenditure.
- **Rich Visualization:** Interactive trend charts and cost-breakdown visualizations using Chart.js.
- **Local-First Architecture:** Powered by a local SQLite database utilizing Write-Ahead Logging (WAL) for speed and data integrity.
- **Premium UI/UX:** A bespoke dark-mode interface built on React and Tailwind CSS v4.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React 19, Vite, Tailwind v4 | High-performance SPA with custom design system |
| **Backend** | FastAPI (Python 3.13) | Asynchronous, type-safe REST API |
| **Database** | SQLite + SQLAlchemy ORM | Local relational data storage with FK constraints |
| **Routing** | React Router DOM | Client-side navigation |
| **Charts** | Chart.js / react-chartjs-2 | Data visualization and analytics |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- **Python 3.13+**
- **Node.js 18+**
- **Git**

### 1. Installation

Clone the repository and set up the Python virtual environment:

```bash
# Clone the repository
git clone https://github.com/ElementZ76/Fuel-Track-AI.git
cd Fuel-Track-AI

# Create and activate the virtual environment
# On Windows (PowerShell):
python -m venv venv
.\venv\Scripts\activate

# On WSL/Linux/Mac (Bash):
python3 -m venv venv_wsl
source venv_wsl/bin/activate

# Install backend dependencies
pip install -r server/requirements.txt

# Install frontend dependencies
cd client
npm install
cd ..
```

---

### 2. Running the Application

You can launch the application using either the automated scripts or by starting the services manually. 

#### Option A: One-Click Startup (Automated)

Convenient scripts are included to spin up both the frontend and backend simultaneously.

**For Windows (PowerShell):**
```powershell
./run_dev.ps1
```

**For Mac/Linux (WSL/Bash):**
```bash
chmod +x run_dev.sh
./run_dev.sh
```

#### Option B: Manual Startup (WSL / Linux / Mac)

If you prefer to run the services manually (e.g., in separate terminal windows to monitor logs), run the following commands **from the project root directory**.

**Terminal 1: Start the Backend**
```bash
# Ensure you are at the project root
# Activate the virtual environment
# On Windows: .\venv\Scripts\activate
# On WSL/Linux/Mac: source venv_wsl/bin/activate

# Start the FastAPI server on port 8080
uvicorn server.main:app --reload --port 8080
```
> The API documentation will be available at `http://localhost:8080/docs`.

**Terminal 2: Start the Frontend**
```bash
# Ensure you are at the project root
# Navigate to the client directory
cd client

# Start the Vite development server
npm run dev
```
> The web application will be available at `http://localhost:5173`.

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
