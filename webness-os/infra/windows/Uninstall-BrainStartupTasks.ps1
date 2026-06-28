<#
.SYNOPSIS
Removes the Webness Brain Windows Scheduled Tasks.
#>
[CmdletBinding()]
param(
  [string]$TaskPrefix = "Webness"
)

$ErrorActionPreference = "Stop"

foreach ($taskName in @("$TaskPrefix Brain API", "$TaskPrefix Cloudflared Tunnel")) {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($task) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Removed $taskName"
  } else {
    Write-Host "Task not found: $taskName"
  }
}
