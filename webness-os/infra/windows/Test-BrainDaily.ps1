<#
.SYNOPSIS
Runs a quick local and public health check for the daily Brain stack.
#>
[CmdletBinding()]
param(
  [string]$LocalUrl = "http://127.0.0.1:8000",
  [string]$PublicUrl = "https://brain.webness.in",
  [string]$ApiKey = $env:BRAIN_API_KEY,
  [switch]$SkipPublic
)

$ErrorActionPreference = "Continue"

function Invoke-BrainHealth {
  param([string]$Url)

  $headers = @{}
  if ($ApiKey) {
    $headers["x-api-key"] = $ApiKey
    $headers["X-Webness-Key"] = $ApiKey
  }

  try {
    $started = Get-Date
    $response = Invoke-RestMethod -Method Get -Uri "$Url/health" -Headers $headers -TimeoutSec 10
    $latency = [int]((Get-Date) - $started).TotalMilliseconds
    [pscustomobject]@{
      Url = $Url
      Ok = $true
      Status = $response.status
      Ollama = $response.ollama.status
      Models = ($response.ollama.models -join ", ")
      LatencyMs = $latency
    }
  } catch {
    [pscustomobject]@{
      Url = $Url
      Ok = $false
      Status = "failed"
      Ollama = "unknown"
      Models = ""
      LatencyMs = $null
      Error = $_.Exception.Message
    }
  }
}

Write-Host "Process check"
Get-Process -Name "ollama","cloudflared","python" -ErrorAction SilentlyContinue |
  Select-Object ProcessName, Id, StartTime |
  Format-Table -AutoSize

Write-Host "Health check"
$results = @()
$results += Invoke-BrainHealth -Url $LocalUrl
if (-not $SkipPublic) {
  $results += Invoke-BrainHealth -Url $PublicUrl
}
$results | Format-Table -AutoSize
