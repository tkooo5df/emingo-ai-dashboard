# Start API Server with proper error handling
$env:DATABASE_URL = "postgres://postgres:vOZx4og262UxQeT@localhost:5432"
Write-Host "Starting API Server..." -ForegroundColor Green
Write-Host "Make sure flyctl proxy is running: flyctl proxy 5432 -a emingo-db" -ForegroundColor Yellow
node server/api.js

