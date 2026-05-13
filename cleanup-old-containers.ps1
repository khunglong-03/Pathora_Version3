# ============================================================
# Cleanup Old Pathora Containers (PowerShell)
# ============================================================

Write-Host "🧹 Cleaning up old Pathora containers..." -ForegroundColor Cyan

# Stop old containers
Write-Host "⏹️  Stopping old containers..." -ForegroundColor Yellow
docker stop pathora-backend pathora-publicapi pathora-frontend pathora-nginx 2>$null

# Remove old containers
Write-Host "🗑️  Removing old containers..." -ForegroundColor Yellow
docker rm pathora-backend pathora-publicapi pathora-frontend pathora-nginx 2>$null

# Remove old images (optional)
Write-Host "🖼️  Removing old images..." -ForegroundColor Yellow
docker rmi pathora-stack-backend pathora-stack-publicapi pathora-stack-frontend 2>$null

# Prune unused volumes (optional - be careful!)
# Write-Host "💾 Pruning unused volumes..." -ForegroundColor Yellow
# docker volume prune -f

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Current containers:" -ForegroundColor Cyan
docker ps -a | Select-String "pathora"
