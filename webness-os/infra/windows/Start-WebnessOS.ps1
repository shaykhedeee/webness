<#
.SYNOPSIS
Complete startup script for the Webness OS local environment.
Ensures the database is synced, dependencies are installed, and runs the unified dev server.
#>

$ErrorActionPreference = "Stop"

if ($PSScriptRoot) {
    $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
} else {
    $ProjectRoot = (Resolve-Path ".").Path
}

Push-Location $ProjectRoot
try {
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "🚀 Webness OS — Sovereign AI Agency Startup" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "1. Checking environment..." -ForegroundColor Yellow
    if (-not (Test-Path ".env")) {
        Write-Warning "No .env file found at root! Ensure your database URL is configured."
    }

    Write-Host "2. Syncing Database Schema (Prisma db:push)..." -ForegroundColor Yellow
    try {
        pnpm db:push
        Write-Host "✅ Database synced successfully." -ForegroundColor Green
    } catch {
        Write-Error "Failed to push database schema. Is PostgreSQL running?"
        exit 1
    }

    Write-Host ""
    Write-Host "3. Starting All Services (Node apps + Python Brain)..." -ForegroundColor Yellow
    Write-Host "Use Ctrl+C to stop all services." -ForegroundColor Gray
    Write-Host ""
    
    # Run the concurrently command
    pnpm run dev:all
} finally {
    Pop-Location
}
