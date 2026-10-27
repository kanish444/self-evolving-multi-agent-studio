# SE-MAESTRO Localhost Startup Script
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   Starting SE-MAESTRO on Localhost" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir'; npm run dev -- --host 127.0.0.1"

Write-Host "`nSE-MAESTRO is starting!" -ForegroundColor Green
Write-Host "Frontend Studio: http://localhost:5173/" -ForegroundColor Green
Write-Host "Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
