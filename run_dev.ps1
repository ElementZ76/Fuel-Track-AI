# PowerShell script to start the FuelTrack AI environment

Write-Host "Starting FuelTrack AI..." -ForegroundColor Green

# 1. Start Backend in a background job or new window
Write-Host "Starting FastAPI Backend on http://localhost:8000" -ForegroundColor Cyan
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd server; ..\venv\Scripts\uvicorn.exe main:app --reload --port 8000"

# 2. Add placeholder for frontend (for when Figma designs arrive)
Write-Host "Frontend is currently deferred pending Figma designs." -ForegroundColor Yellow
# Uncomment below when client/ exists
# Write-Host "Starting Vite Frontend on http://localhost:5173" -ForegroundColor Cyan
# Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

Write-Host "Done!" -ForegroundColor Green
