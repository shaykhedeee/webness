<#
.SYNOPSIS
Pulls the Ollama models documented for the Webness Brain routing map.
#>
[CmdletBinding()]
param(
  [string[]]$Models = @(
    "qwen2.5-coder:3b",
    "deepseek-r1:8b",
    "qwen2.5:7b",
    "llama3.1:8b",
    "gemma2:9b",
    "nomic-embed-text",
    "hermes3:8b"
  )
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
  throw "ollama was not found in PATH. Install it first from https://ollama.com/download or winget."
}

foreach ($model in $Models) {
  Write-Host "Pulling $model"
  ollama pull $model
}
