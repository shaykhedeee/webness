<#
.SYNOPSIS
Starts the Webness Local Brain FastAPI service on the AI PC.
#>
[CmdletBinding()]
param(
  [string]$ProjectRoot = "",
  [switch]$Install
)

$ErrorActionPreference = "Stop"

if (-not $ProjectRoot) {
  if ($PSScriptRoot) {
    $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
  } else {
    $ProjectRoot = (Resolve-Path ".").Path
  }
}

$BrainDir = Join-Path $ProjectRoot "apps\brain"
$VenvDir = Join-Path $BrainDir ".venv"
$PythonExe = Join-Path $VenvDir "Scripts\python.exe"
$Requirements = Join-Path $BrainDir "requirements.txt"

if (-not (Test-Path $BrainDir)) {
  throw "Brain app directory not found: $BrainDir"
}

if (-not (Test-Path (Join-Path $BrainDir ".env")) -and (Test-Path (Join-Path $BrainDir ".env.example"))) {
  Copy-Item -LiteralPath (Join-Path $BrainDir ".env.example") -Destination (Join-Path $BrainDir ".env")
  Write-Warning "Created apps\brain\.env from .env.example. Set BRAIN_API_KEY before exposing brain.webness.in."
}

if (-not (Test-Path $PythonExe)) {
  Write-Host "Creating Python virtual environment at $VenvDir"
  try {
    python -m venv $VenvDir
  } catch {
    try {
      py -3.12 -m venv $VenvDir
    } catch {
      py -3 -m venv $VenvDir
    }
  }
  $Install = $true
}

if ($Install) {
  & $PythonExe -m pip install --upgrade pip
  & $PythonExe -m pip install -r $Requirements
}

Push-Location $BrainDir
try {
  if (Test-Path ".env") {
    Get-Content ".env" | Foreach-Object {
      $line = $_.Trim()
      if ($line -and -not $line.StartsWith("#")) {
        $parts = $line -split '=', 2
        if ($parts.Length -eq 2) {
          $name = $parts[0].Trim()
          $val = $parts[1].Trim().Trim('"').Trim("'")
          [System.Environment]::SetEnvironmentVariable($name, $val)
        }
      }
    }
  }
  $env:BRAIN_HOST = if ($env:BRAIN_HOST) { $env:BRAIN_HOST } else { "127.0.0.1" }
  $env:BRAIN_PORT = if ($env:BRAIN_PORT) { $env:BRAIN_PORT } else { "8080" }

  Write-Host "Starting Webness Brain API (Port 8080) in background..."
  $argsList = @("-m", "uvicorn", "webness_brain.main:app", "--app-dir", "src", "--host", $env:BRAIN_HOST, "--port", "8080")
  $proc = Start-Process -FilePath $PythonExe -ArgumentList $argsList -NoNewWindow -PassThru

  Write-Host "Starting Nous Hermes Agent (Port 8642) in foreground..."
  try {
    & $PythonExe -m uvicorn webness_brain.main:app --app-dir src --host 127.0.0.1 --port 8642
  } finally {
    if ($proc -and -not $proc.HasExited) {
      Write-Host "Stopping Webness Brain API background process..."
      Stop-Process -Id $proc.Id -Force
    }
  }
} finally {
  Pop-Location
}
