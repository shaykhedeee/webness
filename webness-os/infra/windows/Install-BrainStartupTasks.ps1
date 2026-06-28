<#
.SYNOPSIS
Installs per-user Windows Scheduled Tasks for the Brain API and cloudflared tunnel.

.DESCRIPTION
This is the recommended daily-driver setup for the AI PC because both processes run
as the signed-in user and can read files under the user's profile, including
.cloudflared credentials.
#>
[CmdletBinding()]
param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$TaskPrefix = "Webness",
  [switch]$RunNow
)

$ErrorActionPreference = "Stop"

$WindowsDir = Join-Path $ProjectRoot "infra\windows"
$LogsDir = Join-Path $ProjectRoot "infra\logs"
New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null

$brainScript = Join-Path $WindowsDir "Start-BrainApi.ps1"
$tunnelScript = Join-Path $WindowsDir "Start-CloudflaredTunnel.ps1"

if (-not (Test-Path $brainScript)) { throw "Missing $brainScript" }
if (-not (Test-Path $tunnelScript)) { throw "Missing $tunnelScript" }

$brainAction = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$brainScript`" -Install *> `"$LogsDir\brain-api.log`""

$tunnelAction = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$tunnelScript`" *> `"$LogsDir\cloudflared.log`""

$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Days 30) `
  -MultipleInstances IgnoreNew `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName "$TaskPrefix Brain API" `
  -Action $brainAction `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Starts the Webness Local Brain FastAPI service on logon." `
  -Force | Out-Null

Register-ScheduledTask `
  -TaskName "$TaskPrefix Cloudflared Tunnel" `
  -Action $tunnelAction `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Starts the Cloudflare Tunnel for brain.webness.in on logon." `
  -Force | Out-Null

Write-Host "Installed startup tasks:"
Write-Host "  $TaskPrefix Brain API"
Write-Host "  $TaskPrefix Cloudflared Tunnel"

if ($RunNow) {
  Start-ScheduledTask -TaskName "$TaskPrefix Brain API"
  Start-ScheduledTask -TaskName "$TaskPrefix Cloudflared Tunnel"
  Write-Host "Started both tasks. Logs are in $LogsDir."
}
