# Webness Local Brain

FastAPI service for the AI PC described in `BRAIN_AI_DEPLOYMENT_PLAN.md`.

## Endpoints

- `GET /health`
- `POST /v1/chat`
- `POST /v1/research-loop`
- `POST /tools/{tool_slug}/execute`
- `POST /swap-model`

The service accepts any of these auth headers when `BRAIN_API_KEY` is set:

- `x-api-key`
- `X-Webness-Key`
- `Authorization: Bearer <key>`

## Run on Windows

From `webness-os`:

```powershell
.\infra\windows\Start-BrainApi.ps1 -Install
```

The script creates `apps\brain\.env` from `.env.example` the first time it runs.
