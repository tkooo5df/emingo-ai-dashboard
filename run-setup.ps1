# Setup database tables using proxy

Write-Host "Starting Fly.io database proxy..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "flyctl proxy 5432 -a emingo-db"

Write-Host "Waiting 5 seconds for proxy to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Creating tables..." -ForegroundColor Green
node setup-tables.js

Write-Host "Done! Close the proxy window when finished." -ForegroundColor Green


