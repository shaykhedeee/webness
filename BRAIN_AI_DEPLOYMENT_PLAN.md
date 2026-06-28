# Webness Brain AI - Deployment Plan (AI PC + Cloudflare + Oracle Postgres)

## A. Architecture (final)
- **AI PC**: FastAPI Brain, Ollama models, optional Image/TTS/STT services
- **Cloudflare Tunnel**: exposes `brain.webness.in` securely
- **Oracle VM**: PostgreSQL memory + app backend
- **Webness App**: calls Brain API with `x-api-key` / service token

## B. Core Brain flow
1. Request enters `/v1/chat` or `/v1/research-loop`
2. Router classifies task (code/reasoning/research/image/voice)
3. Planner creates sub-steps
4. Loop executes: Researcher -> Critic -> Refinement
5. Synthesizer returns final answer + confidence
6. All turns stored in Postgres memory

## C. Deep research loop
- `max_iterations=4` (default)
- each iteration:
  - gather facts / tool outputs
  - challenge with critic
  - revise plan
- stop conditions:
  - confidence >= threshold (e.g. 0.85)
  - critic marks resolved
  - max iterations reached

## D. Model map (best-fit routing)
- Coding: `qwen2.5-coder:7b`
- Deep reasoning: `deepseek-r1:8b`
- General chat: `qwen2.5:7b` / `llama3.1:8b`
- Rewrite/quality polish: `gemma2:9b`
- Embeddings: `nomic-embed-text`
- Image: external service (ComfyUI/SDXL)
- Voice: TTS/STT service (Kokoro/Piper + faster-whisper)

## E. Install checklist (AI PC)
1. Install tools:
   - Python 3.12
   - Ollama
   - cloudflared
2. Pull models above
3. Start Brain API on `127.0.0.1:8000`
4. Create Cloudflare tunnel to `brain.webness.in`
5. Enable Cloudflare Access policy
6. Add Windows startup tasks (Brain API + cloudflared)

## F. Critical operational notes
- If AI PC is OFF or sleeping, Brain API is DOWN.
- Keep AI PC plugged in and Sleep disabled.
- Keep Ollama local-only; expose only FastAPI behind Cloudflare.
- Use API key + Access policies before production traffic.

## G. Next deliverables
1. Windows auto-start scripts for Brain API + cloudflared
2. Oracle worker integration example that calls:
   - `POST https://brain.webness.in/v1/chat`
   - `POST https://brain.webness.in/v1/research-loop`