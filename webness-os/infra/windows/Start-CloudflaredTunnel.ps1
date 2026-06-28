<#
.SYNOPSIS
Starts the Cloudflare Tunnel that exposes brain.webness.in to the local Brain API.
#>
[CmdletBinding()]
param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$ConfigPath = "",
  [string]$CloudflaredExe = ""
)

$ErrorActionPreference = "Stop"

if (-not $ConfigPath) {
  $ConfigPath = Join-Path $ProjectRoot "infra\cloudflared\config.yml"
}

if (-not (Test-Path $ConfigPath)) {
  throw "Cloudflared config not found: $ConfigPath"
}

if (-not $CloudflaredExe) {
  $command = Get-Command cloudflared -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "cloudflared.exe was not found in PATH. Install it with winget install Cloudflare.cloudflared."
  }
  $CloudflaredExe = $command.Source
}

$configText = Get-Content -Raw -LiteralPath $ConfigPath
if ($configText -match "YOUR_TUNNEL_ID") {
  Write-Warning "Cloudflared config still contains YOUR_TUNNEL_ID placeholders."
  Write-Warning "Create a named tunnel and update infra\cloudflared\config.yml before expecting brain.webness.in to work."
}

Write-Host "Starting Cloudflare Tunnel with config $ConfigPath"
& $CloudflaredExe tunnel --config $ConfigPath run
