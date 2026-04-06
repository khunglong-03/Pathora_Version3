# Development startup script - runs backend + cloudflare tunnel together
# Requires: .NET SDK, cloudflared, and npm/node

$ErrorActionPreference = "Stop"
$BackendDir = $PSScriptRoot
$FrontendDir = Split-Path $PSScriptRoot -Parent | Join-Path "pathora\frontend"

Write-Host "=== Starting Panthora Development Environment ===" -ForegroundColor Cyan

# Start backend in new window
Write-Host "Starting backend (http://localhost:5182)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir\src\Api'; dotnet run; Read-Host 'Press Enter to exit'" -WindowStyle Normal

# Start cloudflare tunnel in new window
Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Green
Write-Host "NOTE: Copy the tunnel URL (e.g. https://xxx.trycloudflare.com) and set it as" -ForegroundColor Yellow
Write-Host "NEXT_PUBLIC_API_GATEWAY in Vercel project settings." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cloudflared tunnel --url http://localhost:5182" -WindowStyle Normal

# Start frontend
Write-Host "Starting frontend (http://localhost:3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendDir'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "=== All services started ===" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5182" -ForegroundColor White
Write-Host "Swagger:  http://localhost:5182/swagger" -ForegroundColor White
Write-Host "Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "Tunnel:   Check the tunnel window for the public URL" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in any window to stop that service." -ForegroundColor Gray
Read-Host "Press Enter to exit this launcher"
