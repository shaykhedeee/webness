<#
.SYNOPSIS
Adjusts Windows power settings so the AI PC stays available while plugged in.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "Disabling plugged-in sleep and hibernate for daily Brain availability."
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /hibernate off
Write-Host "Done. Battery settings were not changed."
