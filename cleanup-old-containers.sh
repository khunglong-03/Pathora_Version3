#!/bin/bash

# ============================================================
# Cleanup Old Pathora Containers
# ============================================================

echo "🧹 Cleaning up old Pathora containers..."

# Stop old containers
echo "⏹️  Stopping old containers..."
docker stop pathora-backend pathora-publicapi pathora-frontend pathora-nginx 2>/dev/null || true

# Remove old containers
echo "🗑️  Removing old containers..."
docker rm pathora-backend pathora-publicapi pathora-frontend pathora-nginx 2>/dev/null || true

# Remove old images (optional)
echo "🖼️  Removing old images..."
docker rmi pathora-stack-backend pathora-stack-publicapi pathora-stack-frontend 2>/dev/null || true

# Prune unused volumes (optional - be careful!)
# echo "💾 Pruning unused volumes..."
# docker volume prune -f

echo "✅ Cleanup complete!"
echo ""
echo "📊 Current containers:"
docker ps -a | grep pathora || echo "No pathora containers found"
