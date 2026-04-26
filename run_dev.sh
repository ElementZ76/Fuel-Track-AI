#!/bin/bash

echo -e "\033[0;32mStarting FuelTrack AI...\033[0m"

# Function to clean up background processes on exit
cleanup() {
    echo -e "\n\033[0;31mShutting down servers...\033[0m"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C (SIGINT) and call cleanup
trap cleanup SIGINT SIGTERM

# ── Backend ───────────────────────────────────────────────────────
echo -e "\033[0;36mStarting FastAPI Backend on http://localhost:8080\033[0m"
# Check if venv_wsl exists
if [ ! -d "venv_wsl" ]; then
    echo -e "\033[0;31mError: Virtual environment not found. Please create one named 'venv_wsl' (python3 -m venv venv_wsl) and install requirements.\033[0m"
    exit 1
fi

source venv_wsl/bin/activate
uvicorn server.main:app --reload --port 8080 &
BACKEND_PID=$!

# ── Frontend ──────────────────────────────────────────────────────
echo -e "\033[0;36mStarting Vite Frontend on http://localhost:5173\033[0m"
cd client || exit
npm run dev &
FRONTEND_PID=$!

echo -e "\033[0;32mBoth servers started. Open http://localhost:5173 in your browser.\033[0m"
echo -e "Press Ctrl+C to stop both servers."

# Wait for background processes to keep the script running
wait $BACKEND_PID $FRONTEND_PID
