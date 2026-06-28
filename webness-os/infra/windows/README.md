# Webness Brain on Windows

These scripts turn the deployment plan into a daily runnable local stack:

- Brain API: FastAPI on `127.0.0.1:8000`
- Ollama: local-only model runtime on `127.0.0.1:11434`
- Cloudflare Tunnel: `brain.webness.in` to the local Brain API

## First-time setup

Run PowerShell from `webness-os`:

```powershell
.\infra\windows\Pull-BrainModels.ps1
.\infra\windows\Start-BrainApi.ps1 -Install
```

In another PowerShell window:

```powershell
.\infra\windows\Start-CloudflaredTunnel.ps1
```

## Install startup tasks

```powershell
.\infra\windows\Install-BrainStartupTasks.ps1 -RunNow
.\infra\windows\Set-BrainPowerProfile.ps1
```

Logs are written to `infra\logs\brain-api.log` and `infra\logs\cloudflared.log`.

## Daily health check

```powershell
.\infra\windows\Test-BrainDaily.ps1
```

Set `BRAIN_API_KEY` in `apps\brain\.env` and in the cloud worker/API environment before exposing production traffic.
