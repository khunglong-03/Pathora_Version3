# Cloudflare Tunnel startup script
# Requires cloudflared to be installed: winget install Cloudflare.cloudflared
# Then run: .\start-tunnel.ps1
# Copy the tunnel URL shown and set it as NEXT_PUBLIC_API_GATEWAY in your Vercel project settings

$BackendUrl = "http://localhost:5182"
Write-Host "Starting Cloudflare Tunnel to $BackendUrl..." -ForegroundColor Cyan
Write-Host "NOTE: The tunnel URL changes every time you restart. Update NEXT_PUBLIC_API_GATEWAY in Vercel settings each time." -ForegroundColor Yellow
Write-Host ""
cloudflared tunnel --url $BackendUrl
