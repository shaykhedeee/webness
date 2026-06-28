from __future__ import annotations

import json
import os
import re
import subprocess
import time
import uuid
from pathlib import Path
from typing import Any

import httpx
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# Load base environment
load_dotenv()

# Load root .env from 4 levels up (webness-os/.env)
root_env_path = Path(__file__).resolve().parents[4] / ".env"
if root_env_path.exists():
    load_dotenv(root_env_path, override=True)

STARTED_AT = time.monotonic()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
BRAIN_API_KEY = os.getenv("BRAIN_API_KEY", "")
CF_ACCESS_CLIENT_ID = os.getenv("CLOUDFLARE_ACCESS_CLIENT_ID", "")
CF_ACCESS_CLIENT_SECRET = os.getenv("CLOUDFLARE_ACCESS_CLIENT_SECRET", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")

def get_db_connection():
    clean_url = DATABASE_URL
    if clean_url:
        clean_url = re.sub(r'[?&]schema=[^&]*', '', clean_url)
        if clean_url.endswith('?'):
            clean_url = clean_url[:-1]
    return psycopg2.connect(clean_url)

def get_first_org_id() -> str:
    if not DATABASE_URL:
        return "default"
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT id FROM "Organization" LIMIT 1')
                row = cur.fetchone()
                if row:
                    return row[0]
                
                # Seed a default organization if none exists
                default_id = "00000000-0000-0000-0000-000000000000"
                cur.execute(
                    'INSERT INTO "Organization" (id, name, slug, "createdAt", "updatedAt") '
                    'VALUES (%s, %s, %s, NOW(), NOW()) '
                    'ON CONFLICT (id) DO NOTHING',
                    (default_id, "Default Org", "default-org")
                )
                conn.commit()
                return default_id
        finally:
            conn.close()
    except Exception as e:
        print(f"Error fetching/seeding default org ID: {e}")
    return "default"

MODEL_MAP = {
    "code": os.getenv("BRAIN_MODEL_CODE", "qwen2.5-coder:3b"),
    "reasoning": os.getenv("BRAIN_MODEL_REASONING", "deepseek-r1:8b"),
    "general": os.getenv("BRAIN_MODEL_GENERAL", "qwen2.5:7b"),
    "polish": os.getenv("BRAIN_MODEL_POLISH", "gemma2:9b"),
    "embeddings": os.getenv("BRAIN_MODEL_EMBEDDINGS", "nomic-embed-text"),
    "simple": os.getenv("BRAIN_MODEL_SIMPLE", "gemma3:1b"),
}

DEFAULT_RESEARCH_ITERATIONS = int(os.getenv("BRAIN_RESEARCH_MAX_ITERATIONS", "4"))
DEFAULT_CONFIDENCE_THRESHOLD = float(os.getenv("BRAIN_RESEARCH_CONFIDENCE_THRESHOLD", "0.85"))

app = FastAPI(title="Webness Local Brain", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str = Field(default="user")
    content: str


class ChatRequest(BaseModel):
    message: str | None = None
    messages: list[ChatMessage] | None = None
    task_type: str = Field(default="general")
    model: str | None = None
    temperature: float = Field(default=0.2, ge=0, le=2)
    system: str | None = None
    orgId: str | None = None


class ResearchLoopRequest(BaseModel):
    query: str | None = None
    prompt: str | None = None
    max_iterations: int = Field(default=DEFAULT_RESEARCH_ITERATIONS, ge=1, le=8)
    confidence_threshold: float = Field(default=DEFAULT_CONFIDENCE_THRESHOLD, ge=0, le=1)
    model: str | None = None


class ToolExecuteRequest(BaseModel):
    input: dict[str, Any] = Field(default_factory=dict)
    taskId: str | None = None
    orgId: str | None = None


class SwapModelRequest(BaseModel):
    model: str


def _header_matches(value: str | None, expected: str) -> bool:
    return bool(expected) and bool(value) and value == expected


async def require_auth(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
    x_webness_key: str | None = Header(default=None),
    cf_access_client_id: str | None = Header(default=None),
    cf_access_client_secret: str | None = Header(default=None),
) -> None:
    if BRAIN_API_KEY:
        bearer = authorization.removeprefix("Bearer ").strip() if authorization else None
        if not (
            _header_matches(x_api_key, BRAIN_API_KEY)
            or _header_matches(x_webness_key, BRAIN_API_KEY)
            or _header_matches(bearer, BRAIN_API_KEY)
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid Brain API key",
            )

    if CF_ACCESS_CLIENT_ID or CF_ACCESS_CLIENT_SECRET:
        if not (
            _header_matches(cf_access_client_id, CF_ACCESS_CLIENT_ID)
            and _header_matches(cf_access_client_secret, CF_ACCESS_CLIENT_SECRET)
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Missing or invalid Cloudflare Access service token",
            )


async def ollama_request(path: str, payload: dict[str, Any] | None = None, timeout: float = 180) -> Any:
    async with httpx.AsyncClient(timeout=timeout) as client:
        if payload is None:
            response = await client.get(f"{OLLAMA_BASE_URL}{path}")
        else:
            response = await client.post(f"{OLLAMA_BASE_URL}{path}", json=payload)
        response.raise_for_status()
        return response.json()


# ─── SEMANTIC VECTOR CACHE (pgvector) ───

async def generate_local_embedding(text: str) -> list[float] | None:
    try:
        model = MODEL_MAP["embeddings"]
        payload = {"model": model, "prompt": text}
        try:
            data = await ollama_request("/api/embeddings", payload, timeout=10)
            return data.get("embedding")
        except Exception:
            # Fallback to /api/embed (newer Ollama API format)
            data = await ollama_request("/api/embed", {"model": model, "input": text}, timeout=10)
            embeddings = data.get("embeddings")
            if embeddings and len(embeddings) > 0:
                return embeddings[0]
    except Exception as e:
        print(f"Failed to generate embedding locally: {e}")
    return None


async def check_semantic_cache(prompt: str, org_id: str = "default", threshold: float = 0.92) -> str | None:
    if not DATABASE_URL:
        return None
    try:
        embedding = await generate_local_embedding(prompt)
        if not embedding:
            return None
        
        vector_str = f"[{','.join(map(str, embedding))}]"
        org_filter = org_id or "default"
        
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'SELECT content, (1 - (embedding <=> %s::vector)) as similarity FROM "Embedding" '
                    'WHERE "orgId" = %s AND "contentType" = %s AND (1 - (embedding <=> %s::vector)) >= %s '
                    'ORDER BY similarity DESC LIMIT 1',
                    (vector_str, org_filter, "cache", vector_str, threshold)
                )
                row = cur.fetchone()
                if row:
                    content = row["content"]
                    print(f"🎯 Semantic Cache Hit! Similarity: {row['similarity']:.4f}")
                    if "\nAnswer: " in content:
                        return content.split("\nAnswer: ", 1)[1]
                    return content
        finally:
            conn.close()
    except Exception as e:
        print(f"Error checking semantic cache: {e}")
    return None


async def save_semantic_cache(prompt: str, answer: str, org_id: str = "default") -> None:
    if not DATABASE_URL:
        return
    try:
        embedding = await generate_local_embedding(prompt)
        if not embedding:
            return
        
        vector_str = f"[{','.join(map(str, embedding))}]"
        content_str = f"Prompt: {prompt}\nAnswer: {answer}"
        row_id = str(uuid.uuid4())
        org_filter = org_id or "default"
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'INSERT INTO "Embedding" (id, "orgId", "contentType", content, embedding, metadata, "createdAt") '
                    'VALUES (%s, %s, %s, %s, %s::vector, %s::jsonb, NOW())',
                    (row_id, org_filter, "cache", content_str, vector_str, json.dumps({"prompt": prompt}))
                )
                conn.commit()
                print("💾 Saved response to pgvector Semantic Cache.")
        finally:
            conn.close()
    except Exception as e:
        print(f"Error saving to semantic cache: {e}")


# ─── FALLBACK CHAINS ───

async def call_external_fallback(prompt: str, task_type: str) -> dict[str, Any] | None:
    groq_key = os.getenv("GROQ_API_KEY", "")
    gemini_key = os.getenv("GOOGLE_AI_STUDIO_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")

    # 1. Try Groq (Ultra-fast failover)
    if groq_key:
        try:
            print("⚠️ Local Ollama loaded or offline. Falling back to Groq...")
            model = "llama-3.3-70b-versatile"
            started = time.monotonic()
            async with httpx.AsyncClient(timeout=30) as client:
                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                    }
                )
                res.raise_for_status()
                content = res.json()["choices"][0]["message"]["content"]
                return {
                    "content": content,
                    "model": model,
                    "provider": "groq",
                    "latencyMs": int((time.monotonic() - started) * 1000)
                }
        except Exception as e:
            print(f"Groq fallback failed: {e}")

    # 2. Try Gemini (Google AI Studio)
    if gemini_key:
        try:
            print("⚠️ Fallback escalating to Google Gemini...")
            model = "gemini-2.5-flash"
            started = time.monotonic()
            async with httpx.AsyncClient(timeout=30) as client:
                res = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}",
                    headers={"Content-Type": "application/json"},
                    json={"contents": [{"parts": [{"text": prompt}]}]}
                )
                res.raise_for_status()
                content = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                return {
                    "content": content,
                    "model": model,
                    "provider": "gemini",
                    "latencyMs": int((time.monotonic() - started) * 1000)
                }
        except Exception as e:
            print(f"Gemini fallback failed: {e}")

    # 3. Try OpenAI API
    if openai_key:
        try:
            print("⚠️ Fallback escalating to OpenAI...")
            model = "gpt-4o-mini"
            started = time.monotonic()
            async with httpx.AsyncClient(timeout=30) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                    }
                )
                res.raise_for_status()
                content = res.json()["choices"][0]["message"]["content"]
                return {
                    "content": content,
                    "model": model,
                    "provider": "openai",
                    "latencyMs": int((time.monotonic() - started) * 1000)
                }
        except Exception as e:
            print(f"OpenAI fallback failed: {e}")

    # 4. Try OpenRouter
    if openrouter_key:
        try:
            print("⚠️ Fallback escalating to OpenRouter...")
            model = "google/gemini-2.5-flash:free"
            started = time.monotonic()
            async with httpx.AsyncClient(timeout=30) as client:
                res = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openrouter_key}",
                        "HTTP-Referer": "https://resurgo.life",
                        "X-Title": "Webness OS Local Brain",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                    }
                )
                res.raise_for_status()
                content = res.json()["choices"][0]["message"]["content"]
                return {
                    "content": content,
                    "model": model,
                    "provider": "openrouter",
                    "latencyMs": int((time.monotonic() - started) * 1000)
                }
        except Exception as e:
            print(f"OpenRouter fallback failed: {e}")

    return None


def choose_model(task_type: str, explicit_model: str | None = None) -> str:
    if explicit_model:
        return explicit_model
    normalized = task_type.lower()
    if "simple" in normalized:
        return MODEL_MAP["simple"]
    if any(word in normalized for word in ("code", "program", "debug", "typescript", "python")):
        return MODEL_MAP["code"]
    if any(word in normalized for word in ("research", "reason", "plan", "critic", "deep")):
        return MODEL_MAP["reasoning"]
    if any(word in normalized for word in ("rewrite", "polish", "quality", "copy")):
        return MODEL_MAP["polish"]
    return MODEL_MAP["general"]


async def ollama_chat(
    messages: list[dict[str, str]],
    model: str,
    temperature: float = 0.2,
) -> dict[str, Any]:
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": temperature},
    }
    started = time.monotonic()
    data = await ollama_request("/api/chat", payload)
    latency_ms = int((time.monotonic() - started) * 1000)
    content = data.get("message", {}).get("content", "")
    return {
        "content": content,
        "model": data.get("model", model),
        "latencyMs": latency_ms,
        "tokensUsed": data.get("eval_count"),
    }


async def ollama_chat_with_fallback(
    messages: list[dict[str, str]],
    task_type: str,
    explicit_model: str | None = None,
    temperature: float = 0.2,
    org_id: str = "default"
) -> dict[str, Any]:
    user_prompt = messages[-1]["content"] if messages and messages[-1]["role"] == "user" else ""
    
    # 1. Try pgvector semantic query cache (single user prompt requests only)
    if user_prompt and len(messages) == 1:
        cache_hit = await check_semantic_cache(user_prompt, org_id)
        if cache_hit:
            return {
                "content": cache_hit,
                "model": "semantic-cache-hit",
                "latencyMs": 0,
                "tokensUsed": 0,
                "provider": "local-cache"
            }

    # 2. Choose target model based on router decisions
    model = choose_model(task_type, explicit_model)

    # 3. Call Local inference
    try:
        res = await ollama_chat(messages, model, temperature)
        content = res["content"]
        
        # Save to semantic cache if successful
        if user_prompt and len(messages) == 1 and content:
            await save_semantic_cache(user_prompt, content, org_id)
            
        return {
            "content": content,
            "model": res["model"],
            "latencyMs": res["latencyMs"],
            "tokensUsed": res["tokensUsed"],
            "provider": "ollama"
        }
    except Exception as e:
        print(f"Ollama execution failed: {e}. Executing external API failover...")
        
        # Convert message threads to unified prompt string
        prompt_str = ""
        for msg in messages:
            prompt_str += f"{msg['role'].capitalize()}: {msg['content']}\n"
        prompt_str += "Assistant: "
        
        fallback_res = await call_external_fallback(prompt_str, task_type)
        if fallback_res:
            # Save to cache
            if user_prompt and len(messages) == 1 and fallback_res["content"]:
                await save_semantic_cache(user_prompt, fallback_res["content"], org_id)
            return {
                "content": fallback_res["content"],
                "model": fallback_res["model"],
                "latencyMs": fallback_res["latencyMs"],
                "tokensUsed": None,
                "provider": fallback_res["provider"]
            }
        
        raise HTTPException(
            status_code=500,
            detail=f"Both local execution and fallback chain failed. Ollama error: {str(e)}"
        )


def chat_messages(request: ChatRequest) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []
    if request.system:
        messages.append({"role": "system", "content": request.system})
    if request.messages:
        messages.extend({"role": message.role, "content": message.content} for message in request.messages)
    if request.message:
        messages.append({"role": "user", "content": request.message})
    if not messages:
        raise HTTPException(status_code=400, detail="Provide message or messages")
    return messages


def estimate_confidence(text: str, iteration: int, max_iterations: int) -> float:
    explicit = re.search(r"confidence[^0-9]*(0(?:\.\d+)?|1(?:\.0+)?)", text, flags=re.I)
    if explicit:
        return min(1.0, max(0.0, float(explicit.group(1))))
    return min(0.9, 0.45 + (iteration / max_iterations) * 0.35)


def gpu_info() -> dict[str, Any] | None:
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,memory.total,memory.used,memory.free",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            check=True,
            text=True,
            timeout=3,
        )
        line = result.stdout.strip().splitlines()[0]
        name, total, used, free = [part.strip() for part in line.split(",")]
        return {
            "name": name,
            "vram_total_mb": int(total),
            "vram_used_mb": int(used),
            "vram_free_mb": int(free),
        }
    except Exception:
        return None


async def ollama_status() -> dict[str, Any]:
    try:
        tags = await ollama_request("/api/tags", timeout=5)
        models = [model.get("name") for model in tags.get("models", []) if model.get("name")]
        return {"status": "running", "loadedModel": None, "models": models}
    except Exception:
        return {"status": "stopped", "loadedModel": None, "models": []}


@app.get("/health")
async def health() -> dict[str, Any]:
    ollama = await ollama_status()
    degraded = ollama["status"] != "running"
    return {
        "status": "degraded" if degraded else "healthy",
        "gpu": gpu_info(),
        "ollama": ollama,
        "loaded_models": ollama["models"],
        "tools": ["chat", "research-loop", "tool-execute", "model-swap"],
        "uptime": int(time.monotonic() - STARTED_AT),
        "brain_url": "https://brain.webness.in",
    }


@app.post("/v1/chat")
async def chat(request: ChatRequest, _: None = Depends(require_auth)) -> dict[str, Any]:
    # ─── Gemma3-1B Router classification ───
    routed_task_type = request.task_type
    user_prompt = request.message or (request.messages[-1].content if request.messages else "")
    
    if user_prompt:
        try:
            router_prompt = (
                "You are a routing agent for Webness OS. Categorize the following task into exactly one category: "
                "simple (for basic questions, greetings, parsing, fast generation), "
                "reasoning (for deep reasoning, mathematical models, strategy plans), "
                "code (for typescript, python, database queries), "
                "or polish (for brand voice correction, copy editing).\n"
                "Return ONLY the category name in lowercase with no other text.\n\n"
                f"Task: {user_prompt}"
            )
            # Route locally via gemma3:1b router, defaulting to choose_model heuristics on failure
            routing_res = await ollama_chat([{"role": "user", "content": router_prompt}], MODEL_MAP["simple"], temperature=0.0)
            decision = routing_res["content"].strip().lower()
            if decision in ("simple", "reasoning", "code", "polish"):
                routed_task_type = decision
                print(f"Gemma3-1B Router Classify: {routed_task_type}")
        except Exception as e:
            print(f"Gemma3-1B Router classification error (falling back to default heuristics): {e}")

    result = await ollama_chat_with_fallback(
        chat_messages(request),
        routed_task_type,
        request.model,
        request.temperature,
        request.orgId or "default"
    )
    return {
        "success": True,
        "answer": result["content"],
        "data": {"answer": result["content"]},
        "modelUsed": result["model"],
        "providerUsed": result["provider"],
        "tokensUsed": result["tokensUsed"],
        "latencyMs": result["latencyMs"],
        "confidence": 0.75,
    }


@app.post("/v1/research-loop")
async def research_loop(request: ResearchLoopRequest, _: None = Depends(require_auth)) -> dict[str, Any]:
    query = request.query or request.prompt
    if not query:
        raise HTTPException(status_code=400, detail="Provide query or prompt")

    model = request.model or MODEL_MAP["reasoning"]
    iterations: list[dict[str, Any]] = []
    working_notes = ""
    confidence = 0.0

    for iteration in range(1, request.max_iterations + 1):
        researcher_prompt = (
            "You are the Webness Researcher. Gather useful facts, identify assumptions, "
            "and improve the answer. Keep it practical.\n\n"
            f"Question: {query}\n\nPrevious notes:\n{working_notes or 'None'}"
        )
        research = await ollama_chat([{"role": "user", "content": researcher_prompt}], model)

        critic_prompt = (
            "You are the Webness Critic. Challenge the research, name remaining gaps, "
            "and end with a confidence number from 0 to 1.\n\n"
            f"Research:\n{research['content']}"
        )
        critique = await ollama_chat([{"role": "user", "content": critic_prompt}], model)
        confidence = estimate_confidence(critique["content"], iteration, request.max_iterations)
        iterations.append(
            {
                "iteration": iteration,
                "research": research["content"],
                "critique": critique["content"],
                "confidence": confidence,
            }
        )
        working_notes = json.dumps(iterations[-1], ensure_ascii=False)
        if confidence >= request.confidence_threshold or "resolved" in critique["content"].lower():
            break

    synthesis_prompt = (
        "Synthesize the research loop into the best final answer. Include confidence and any caveats.\n\n"
        f"Question: {query}\n\nIterations:\n{json.dumps(iterations, ensure_ascii=False)}"
    )
    final = await ollama_chat([{"role": "user", "content": synthesis_prompt}], model)
    return {
        "success": True,
        "answer": final["content"],
        "data": {"answer": final["content"], "iterations": iterations, "confidence": confidence},
        "iterations": iterations,
        "confidence": confidence,
        "modelUsed": final["model"],
        "providerUsed": "ollama",
        "tokensUsed": final["tokensUsed"],
        "latencyMs": final["latencyMs"],
    }


@app.post("/tools/{tool_slug}/execute")
async def execute_tool(
    tool_slug: str,
    request: ToolExecuteRequest,
    raw_request: Request,
    _: None = Depends(require_auth),
) -> dict[str, Any]:
    task_type = "code" if "code" in tool_slug else "research" if "research" in tool_slug else "general"
    prompt = (
        f"Execute Webness tool `{tool_slug}` for task `{request.taskId or 'manual'}`.\n"
        "Return structured, practical output that can be stored as the task result.\n\n"
        f"Input JSON:\n{json.dumps(request.input, ensure_ascii=False, indent=2)}"
    )
    
    result = await ollama_chat_with_fallback(
        [{"role": "user", "content": prompt}],
        task_type,
        org_id=request.orgId or "default"
    )
    return {
        "taskId": request.taskId,
        "success": True,
        "data": {
            "toolSlug": tool_slug,
            "result": result["content"],
            "requestPath": str(raw_request.url.path),
        },
        "modelUsed": result["model"],
        "providerUsed": result["provider"],
        "tokensUsed": result["tokensUsed"],
        "latencyMs": result["latencyMs"],
    }


@app.post("/swap-model")
async def swap_model(request: SwapModelRequest, _: None = Depends(require_auth)) -> dict[str, Any]:
    await ollama_request("/api/generate", {"model": request.model, "prompt": "", "stream": False})
    return {"success": True, "model": request.model, "message": "Model loaded through Ollama"}


class ObsidianSyncRequest(BaseModel):
    vault_path: str | None = None
    api_url: str
    api_key: str
    org_id: str


def chunk_text(text: str, chunk_size: int = 1000) -> list[str]:
    # Simple chunker that tries to split by paragraph first
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""
    
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if len(current_chunk) + len(p) + 2 <= chunk_size:
            current_chunk = f"{current_chunk}\n\n{p}" if current_chunk else p
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            if len(p) > chunk_size:
                # If paragraph itself is too large, split by sentence or character length
                sentences = re.split(r'(?<=[.!?])\s+', p)
                current_sub_chunk = ""
                for s in sentences:
                    if len(current_sub_chunk) + len(s) + 1 <= chunk_size:
                        current_sub_chunk = f"{current_sub_chunk} {s}" if current_sub_chunk else s
                    else:
                        if current_sub_chunk:
                            chunks.append(current_sub_chunk.strip())
                        current_sub_chunk = s
                if current_sub_chunk:
                    current_chunk = current_sub_chunk
            else:
                current_chunk = p
                
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks


async def run_obsidian_sync(vault_path: str, api_url: str, api_key: str, org_id: str):
    try:
        vault = Path(vault_path)
        if not vault.exists() or not vault.is_dir():
            print(f"Error: Vault path {vault_path} does not exist")
            return
            
        md_files = list(vault.glob("**/*.md"))
        memories = []
        
        for file_path in md_files:
            try:
                # Skip obsidian special folders
                if ".obsidian" in file_path.parts:
                    continue
                    
                relative_path = str(file_path.relative_to(vault))
                content = file_path.read_text(encoding="utf-8")
                
                # Basic frontmatter parsing
                title = file_path.stem
                tags = []
                body = content
                
                # Check for frontmatter
                fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
                if fm_match:
                    fm_text = fm_match.group(1)
                    body = content[fm_match.end():]
                    
                    # Parse tags and title if specified in frontmatter
                    for line in fm_text.splitlines():
                        if line.startswith("title:"):
                            title = line.replace("title:", "").strip().strip('"').strip("'")
                        elif line.startswith("tags:"):
                            tags_part = line.replace("tags:", "").strip()
                            if tags_part.startswith("[") and tags_part.endswith("]"):
                                tags = [t.strip().strip('"').strip("'") for t in tags_part[1:-1].split(",") if t.strip()]
                            else:
                                tags = [tags_part]
                
                # Find tags within body as well (e.g. #tag-name)
                body_tags = re.findall(r"\s#([a-zA-Z0-9_\-]+)", body)
                tags.extend(body_tags)
                tags = list(set(tags)) # de-duplicate
                
                # Chunk content
                chunks = chunk_text(body)
                for idx, chunk in enumerate(chunks):
                    memories.append({
                        "content": f"Source: Obsidian - Note: {title}\nFile: {relative_path}\n\n{chunk}",
                        "contentType": "research",
                        "metadata": {
                            "source": "obsidian",
                            "file": relative_path,
                            "title": title,
                            "chunk_index": idx,
                            "tags": tags
                        }
                    })
            except Exception as e:
                print(f"Failed to process file {file_path}: {e}")
                
        if not memories:
            return
            
        # Send memories to Express API
        # We'll clear the old ones on the first batch, then append the rest
        # To avoid large payloads, send in batches of 50 memories
        batch_size = 50
        async with httpx.AsyncClient(timeout=120) as client:
            for idx, i in enumerate(range(0, len(memories), batch_size)):
                batch = memories[i:i+batch_size]
                clear_old = "true" if idx == 0 else "false"
                
                res = await client.post(
                    f"{api_url.rstrip('/')}/api/ai-os/memory/bulk?orgId={org_id}&clear={clear_old}",
                    json={"memories": batch},
                    headers={
                        "x-ai-brain-key": api_key,
                        "Content-Type": "application/json"
                    }
                )
                res.raise_for_status()
                
        print(f"Successfully synced {len(memories)} chunks from {len(md_files)} files!")
    except Exception as e:
        print(f"Obsidian sync failed: {e}")


@app.post("/v1/obsidian/sync")
async def sync_obsidian(
    request: ObsidianSyncRequest,
    background_tasks: BackgroundTasks,
    _: None = Depends(require_auth)
) -> dict[str, Any]:
    vault_path = request.vault_path or os.getenv("OBSIDIAN_VAULT_PATH", "")
    if not vault_path:
        raise HTTPException(status_code=400, detail="OBSIDIAN_VAULT_PATH is not configured")
        
    vault_path = vault_path.strip().strip('"').strip("'")
    vault_path = os.path.abspath(os.path.expanduser(vault_path))
        
    if not os.path.exists(vault_path) or not os.path.isdir(vault_path):
        raise HTTPException(status_code=400, detail=f"Obsidian Vault path does not exist or is not a directory: {vault_path}")
        
    background_tasks.add_task(
        run_obsidian_sync,
        vault_path,
        request.api_url,
        request.api_key,
        request.org_id
    )
    
    return {
        "success": True,
        "message": "Obsidian sync started in background.",
        "vault_path": vault_path
    }


# ─── SOVEREIGN AI OS ENHANCEMENTS ───

async def save_semantic_cache_rule(org_id: str, content: str, contentType: str = "correction", metadata: dict = None) -> None:
    if not DATABASE_URL:
        return
    try:
        embedding = await generate_local_embedding(content)
        if not embedding:
            return
        
        vector_str = f"[{','.join(map(str, embedding))}]"
        row_id = str(uuid.uuid4())
        org_filter = org_id or "default"
        if org_filter == "default" or not org_filter:
            org_filter = get_first_org_id()
        metadata_str = json.dumps(metadata or {})
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'INSERT INTO "Embedding" (id, "orgId", "contentType", content, embedding, metadata, "createdAt") '
                    'VALUES (%s, %s, %s, %s, %s::vector, %s::jsonb, NOW())',
                    (row_id, org_filter, contentType, content, vector_str, metadata_str)
                )
                conn.commit()
                print(f"💾 Saved {contentType} to pgvector.")
        finally:
            conn.close()
    except Exception as e:
        print(f"Error saving rule to pgvector: {e}")


async def get_local_memory_context(org_id: str, query: str, limit: int = 3) -> str:
    if not DATABASE_URL:
        return ""
    try:
        embedding = await generate_local_embedding(query)
        if not embedding:
            return ""
        
        vector_str = f"[{','.join(map(str, embedding))}]"
        org_filter = org_id or "default"
        if org_filter == "default" or not org_filter:
            org_filter = get_first_org_id()
        
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # 1. Fetch relevant pgvector dynamic memories (brand_voice, correction, research)
                cur.execute(
                    'SELECT content, "contentType", (1 - (embedding <=> %s::vector)) as similarity FROM "Embedding" '
                    'WHERE "orgId" = %s AND "contentType" IN (\'brand_voice\', \'correction\', \'research\') '
                    'ORDER BY similarity DESC LIMIT %s',
                    (vector_str, org_filter, limit)
                )
                rows = cur.fetchall()
                
                lines = []
                lines.append("## 🏛️ Sovereign AI OS Context & Memory (Local)")
                
                # 2. Fetch basic org info
                cur.execute(
                    'SELECT name, industry, website, onboarding, "brandVoice" FROM "Organization" WHERE id = %s',
                    (org_filter,)
                )
                org_row = cur.fetchone()
                if org_row:
                    lines.append(f"- **Business Name:** {org_row['name']}")
                    if org_row.get('industry'):
                        lines.append(f"- **Industry Focus:** {org_row['industry']}")
                    if org_row.get('website'):
                        lines.append(f"- **Website:** {org_row['website']}")
                    
                    onboarding = org_row.get('onboarding')
                    if onboarding:
                        if isinstance(onboarding, str):
                            onboarding = json.loads(onboarding)
                        if isinstance(onboarding, dict):
                            lines.append("\n### Dynamic User Preferences (Onboarding)")
                            for k, v in onboarding.items():
                                if v and not isinstance(v, (dict, list)):
                                    lines.append(f"- **{k}:** {v}")
                    
                    brand_voice = org_row.get('brandVoice')
                    if brand_voice:
                        if isinstance(brand_voice, str):
                            brand_voice = json.loads(brand_voice)
                        if isinstance(brand_voice, dict):
                            lines.append("\n### Core Brand Voice & Dynamic Directives")
                            for k, v in brand_voice.items():
                                if v and not isinstance(v, (dict, list)):
                                    lines.append(f"- **{k}:** {v}")
                
                if rows:
                    lines.append("\n### Dynamically Retrieved Memories (pgvector local)")
                    for row in rows:
                        sim = row["similarity"]
                        sim_pct = f"{(sim * 100):.1f}%" if sim is not None else "unknown"
                        lines.append(f"- [{row['contentType']}] {row['content']} *(Retrieved similarity: {sim_pct})*")
                
                return "\n".join(lines)
        finally:
            conn.close()
    except Exception as e:
        print(f"Error getting local memory context: {e}")
    return ""


def validate_safe_path(target_path: str) -> str:
    workspace_dir = os.path.abspath(os.getenv("WORKSPACE_ROOT", str(Path(__file__).resolve().parents[4])))
    if not os.path.isabs(target_path):
        resolved = os.path.abspath(os.path.join(workspace_dir, target_path))
    else:
        resolved = os.path.abspath(target_path)
    
    if not resolved.startswith(workspace_dir):
        raise HTTPException(status_code=400, detail="Security Violation: Attempted file access outside workspace directory boundary.")
    return resolved


async def stream_ollama_to_openai(model: str, messages: list[dict], temperature: float):
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "options": {"temperature": temperature}
    }
    chat_id = f"chatcmpl-{uuid.uuid4()}"
    created_time = int(time.time())
    
    try:
        async with httpx.AsyncClient(timeout=180) as client:
            async with client.stream("POST", f"{OLLAMA_BASE_URL}/api/chat", json=payload) as response:
                if response.status_code != 200:
                    yield f"data: {json.dumps({'error': 'Ollama connection failed'})}\n\n"
                    yield "data: [DONE]\n\n"
                    return
                
                async for line in response.iter_lines():
                    if not line.strip():
                        continue
                    try:
                        data = json.loads(line)
                        content = data.get("message", {}).get("content", "")
                        done = data.get("done", False)
                        
                        chunk = {
                            "id": chat_id,
                            "object": "chat.completion.chunk",
                            "created": created_time,
                            "model": model,
                            "choices": [
                                {
                                    "index": 0,
                                    "delta": {"content": content} if not done else {},
                                    "finish_reason": "stop" if done else None
                                }
                            ]
                        }
                        yield f"data: {json.dumps(chunk)}\n\n"
                    except Exception:
                        pass
                yield "data: [DONE]\n\n"
    except Exception as e:
        print(f"Ollama stream error: {e}, falling back to cloud...")
        prompt_str = ""
        for msg in messages:
            prompt_str += f"{msg['role'].capitalize()}: {msg['content']}\n"
        prompt_str += "Assistant: "
        
        fallback_res = await call_external_fallback(prompt_str, "general")
        if fallback_res and fallback_res.get("content"):
            chunk = {
                "id": chat_id,
                "object": "chat.completion.chunk",
                "created": created_time,
                "model": fallback_res["model"],
                "choices": [
                    {
                        "index": 0,
                        "delta": {"content": fallback_res["content"]},
                        "finish_reason": "stop"
                    }
                ]
            }
            yield f"data: {json.dumps(chunk)}\n\n"
        else:
            yield f"data: {json.dumps({'error': 'Both local Ollama and external fallback failed'})}\n\n"
        yield "data: [DONE]\n\n"


@app.post("/v1/chat/completions")
async def chat_completions(request: Request, _: None = Depends(require_auth)):
    body = await request.json()
    model = body.get("model", MODEL_MAP["general"])
    messages = body.get("messages", [])
    stream = body.get("stream", False)
    temperature = body.get("temperature", 0.2)
    org_id = body.get("orgId", "default")
    
    # 1. Retrieve unified memory context and decorate prompt
    user_prompt = messages[-1]["content"] if messages and messages[-1]["role"] == "user" else ""
    if user_prompt:
        memory_context = await get_local_memory_context(org_id, user_prompt)
        if memory_context:
            system_found = False
            for msg in messages:
                if msg["role"] == "system":
                    msg["content"] = f"{msg['content']}\n\n{memory_context}"
                    system_found = True
                    break
            if not system_found:
                messages.insert(0, {"role": "system", "content": memory_context})

    # Resolve target model
    target_model = model
    if model in MODEL_MAP:
        target_model = MODEL_MAP[model]
    elif model in ("hermes-agent", "hermes"):
        target_model = "hermes3:8b"

    if stream:
        return StreamingResponse(
            stream_ollama_to_openai(target_model, messages, temperature),
            media_type="text/event-stream"
        )
    else:
        try:
            res = await ollama_chat(messages, target_model, temperature)
            return {
                "id": f"chatcmpl-{uuid.uuid4()}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": model,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": res["content"]
                        },
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": res.get("tokensUsed", 0),
                    "total_tokens": res.get("tokensUsed", 0)
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


class LearnRequest(BaseModel):
    task_id: str | None = None
    org_id: str = "default"
    prompt: str
    output: str
    status: str = "success"
    user_feedback: str | None = None
    rating: int | None = None


@app.post("/v1/learn")
async def learn_from_task(request: LearnRequest, _: None = Depends(require_auth)) -> dict[str, Any]:
    model = choose_model("reasoning")
    reflection_prompt = (
        "You are the Webness AI OS Meta-Cognitive Self-Learning System. "
        "Analyze the following task execution history to identify errors, areas of improvement, or key lessons.\n\n"
        f"--- TASK HISTORY ---\n"
        f"Original Instruction: {request.prompt}\n"
        f"Agent Output: {request.output}\n"
        f"Execution Status: {request.status}\n"
        f"User Feedback/Correction: {request.user_feedback or 'None'}\n"
        f"Rating: {request.rating or 'N/A'}\n"
        f"---------------------\n\n"
        "Generate a clear, actionable directive or rule for future runs of similar tasks. "
        "Start your response with 'Rule: ' or 'Lesson learned: ' and be concise (1-3 sentences). "
        "Keep it highly practical (e.g., 'Rule: When generating Ebook chapters on marketing, always emphasize email list building first as requested by user.')."
    )
    
    try:
        reflection_res = await ollama_chat([{"role": "user", "content": reflection_prompt}], model, temperature=0.2)
        learned_rule = reflection_res["content"].strip()
        
        if learned_rule:
            metadata = {
                "source": "self_learning",
                "task_id": request.task_id,
                "status": request.status,
                "rating": request.rating,
                "ref_time": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            await save_semantic_cache_rule(request.org_id, learned_rule, "correction", metadata)
            return {
                "success": True,
                "learned_rule": learned_rule,
                "message": "Successfully reflected and stored new directive in pgvector memory."
            }
    except Exception as e:
        print(f"Self-learning reflection failed: {e}")
        if request.user_feedback:
            fallback_rule = f"Correction: For prompt '{request.prompt[:100]}', note: {request.user_feedback}"
            await save_semantic_cache_rule(request.org_id, fallback_rule, "correction", {"source": "user_feedback_fallback"})
            return {
                "success": True,
                "learned_rule": fallback_rule,
                "message": "Saved user correction directly to memory (reflection bypassed)."
            }
    
    raise HTTPException(status_code=500, detail="Failed to run self-learning reflection loop.")


@app.get("/v1/files/list")
async def list_files(path: str = ".", _: None = Depends(require_auth)):
    try:
        target = validate_safe_path(path)
        if not os.path.isdir(target):
            raise HTTPException(status_code=400, detail="Path is not a directory")
        
        items = []
        for name in os.listdir(target):
            if name in (".git", "node_modules", ".venv", "dist", ".turbo", "__pycache__"):
                continue
            full_path = os.path.join(target, name)
            is_dir = os.path.isdir(full_path)
            items.append({
                "name": name,
                "isDir": is_dir,
                "sizeBytes": os.path.getsize(full_path) if not is_dir else 0,
                "relativePath": os.path.relpath(full_path, validate_safe_path("."))
            })
        return {"success": True, "files": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/v1/files/read")
async def read_file(path: str, _: None = Depends(require_auth)):
    try:
        target = validate_safe_path(path)
        if not os.path.isfile(target):
            raise HTTPException(status_code=400, detail="Path is not a file")
        with open(target, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return {"success": True, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class WriteFileRequest(BaseModel):
    path: str
    content: str


@app.post("/v1/files/write")
async def write_file(request: WriteFileRequest, _: None = Depends(require_auth)):
    try:
        target = validate_safe_path(request.path)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as f:
            f.write(request.content)
        return {"success": True, "message": "File written successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class FileIndexRequest(BaseModel):
    org_id: str = "default"
    excludes: list[str] | None = None


async def run_workspace_indexing(org_id: str, excludes: list[str] = None):
    if not DATABASE_URL:
        return
    workspace_dir = os.path.abspath(os.getenv("WORKSPACE_ROOT", str(Path(__file__).resolve().parents[4])))
    
    org_filter = org_id or "default"
    if org_filter == "default" or not org_filter:
        org_filter = get_first_org_id()
        
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                'DELETE FROM "Embedding" WHERE "orgId" = %s AND "contentType" = %s',
                (org_filter, "code_chunk")
            )
            conn.commit()
        conn.close()
    except Exception as e:
        print(f"Failed to clear old index: {e}")
    
    allowed_extensions = {".ts", ".tsx", ".py", ".md", ".json", ".js", ".mjs", ".prisma", ".sh", ".ps1"}
    ignore_dirs = {".git", "node_modules", ".venv", "dist", ".turbo", "__pycache__", "pgvector-temp", "infra/logs"}
    
    indexed_count = 0
    for root, dirs, files in os.walk(workspace_dir):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext not in allowed_extensions:
                continue
            
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, workspace_dir)
            
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                if not content.strip():
                    continue
                
                chunk_size = 1000
                overlap = 200
                chunks = []
                
                i = 0
                while i < len(content):
                    chunk = content[i:i+chunk_size]
                    chunks.append(chunk)
                    i += chunk_size - overlap
                    
                for idx, chunk in enumerate(chunks):
                    chunk_content = f"File: {rel_path} (Chunk {idx})\n\n{chunk}"
                    metadata = {
                        "source": "workspace_index",
                        "file": rel_path,
                        "chunk_index": idx,
                        "extension": ext
                    }
                    await save_semantic_cache_rule(org_filter, chunk_content, "code_chunk", metadata)
                    indexed_count += 1
            except Exception as e:
                print(f"Failed to index file {rel_path}: {e}")
    print(f"Finished indexing workspace: {indexed_count} chunks stored.")


@app.post("/v1/files/index")
async def index_workspace_files(request: FileIndexRequest, background_tasks: BackgroundTasks, _: None = Depends(require_auth)):
    background_tasks.add_task(run_workspace_indexing, request.org_id, request.excludes)
    return {"success": True, "message": "Workspace indexing started in the background."}


class FileSearchRequest(BaseModel):
    query: str
    org_id: str = "default"
    limit: int = 5


@app.post("/v1/files/search")
async def search_workspace(request: FileSearchRequest, _: None = Depends(require_auth)):
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        embedding = await generate_local_embedding(request.query)
        if not embedding:
            return {"success": True, "results": []}
        
        vector_str = f"[{','.join(map(str, embedding))}]"
        org_filter = request.org_id or "default"
        if org_filter == "default" or not org_filter:
            org_filter = get_first_org_id()
        
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'SELECT id, content, metadata, "createdAt", '
                    '(1 - (embedding <=> %s::vector)) as similarity FROM "Embedding" '
                    'WHERE "orgId" = %s AND "contentType" = %s '
                    'ORDER BY similarity DESC LIMIT %s',
                    (vector_str, org_filter, "code_chunk", request.limit)
                )
                rows = cur.fetchall()
                return {"success": True, "results": rows}
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ImportRequest(BaseModel):
    title: str
    content: str
    source: str = "codex"
    tags: list[str] | None = None
    org_id: str = "default"


@app.post("/v1/import")
async def import_external_data(request: ImportRequest, _: None = Depends(require_auth)):
    chunks = chunk_text(request.content, chunk_size=1000)
    imported_chunks = 0
    for idx, chunk in enumerate(chunks):
        chunk_content = f"Imported from {request.source.upper()} - {request.title}\n\n{chunk}"
        metadata = {
            "source": request.source,
            "title": request.title,
            "chunk_index": idx,
            "tags": request.tags or []
        }
        await save_semantic_cache_rule(request.org_id, chunk_content, "research", metadata)
        imported_chunks += 1
    return {
        "success": True,
        "message": f"Successfully imported {request.title}. Indexed {imported_chunks} chunks.",
        "chunks": imported_chunks
    }


# ─── ODYSSEUS AI & CONCURRENT CODER TRIUMVIRATE ───

class CoderDelegateRequest(BaseModel):
    prompt: str
    orgId: str = "default"
    model: str | None = None


class DeepResearchRequest(BaseModel):
    query: str
    orgId: str = "default"
    steps: int = 3


@app.post("/v1/coder/delegate")
async def coder_delegate(request: CoderDelegateRequest, _: None = Depends(require_auth)) -> dict[str, Any]:
    planner_model = choose_model("reasoning", request.model)
    subagent_model = "qwen2.5-coder:3b"

    split_prompt = (
        "You are the Master Code Planner. Decompose the following coding request into exactly three distinct, "
        "non-overlapping sub-tasks to be worked on concurrently by three independent subagents.\n"
        "Tasks should correspond to:\n"
        "1. Interface/Types declaration\n"
        "2. Functional logic / state management\n"
        "3. Integration / API client handlers\n\n"
        f"Request: {request.prompt}\n\n"
        "Return the output as a clean JSON object matching this structure:\n"
        "{\n"
        "  \"task1\": \"Describe sub-task 1\",\n"
        "  \"task2\": \"Describe sub-task 2\",\n"
        "  \"task3\": \"Describe sub-task 3\"\n"
        "}"
    )

    import asyncio
    
    # Run planner
    try:
        planner_res = await ollama_chat([{"role": "user", "content": split_prompt}], planner_model)
        raw_text = planner_res["content"].strip()
        json_match = re.search(r"\{[\s\S]+\}", raw_text)
        tasks = json.loads(json_match.group(0)) if json_match else {
            "task1": f"Draft structure for: {request.prompt}",
            "task2": f"Draft implementation logic for: {request.prompt}",
            "task3": f"Draft client connection wrapper for: {request.prompt}"
        }
    except Exception as e:
        print(f"Master planner decomposition failed: {e}")
        tasks = {
            "task1": f"Draft structure for: {request.prompt}",
            "task2": f"Draft implementation logic for: {request.prompt}",
            "task3": f"Draft client connection wrapper for: {request.prompt}"
        }

    # Launch 3 parallel completions asynchronously
    async def run_subagent(task_description: str, agent_id: int) -> str:
        agent_prompt = (
            f"You are Code Agent {agent_id}. Complete the following sub-task:\n"
            f"{task_description}\n\n"
            "Return clean, complete code. Do not include markdown formatting or explanations."
        )
        try:
            res = await ollama_chat([{"role": "user", "content": agent_prompt}], subagent_model, temperature=0.2)
            return res["content"]
        except Exception as err:
            return f"// Code Agent {agent_id} failed: {str(err)}"

    results = await asyncio.gather(
        run_subagent(tasks.get("task1", ""), 1),
        run_subagent(tasks.get("task2", ""), 2),
        run_subagent(tasks.get("task3", ""), 3)
    )

    # Master planner merges
    merge_prompt = (
        "You are the Master Code Integrator. Merge the following three code segments into a single, cohesive, "
        "fully production-quality file. Fix any syntax errors or missing references between them.\n\n"
        f"Segment 1 (Types):\n{results[0]}\n\n"
        f"Segment 2 (Logic):\n{results[1]}\n\n"
        f"Segment 3 (Integration):\n{results[2]}\n\n"
        "Output ONLY the final merged code inside a single code block."
    )

    try:
        final_res = await ollama_chat([{"role": "user", "content": merge_prompt}], planner_model)
        final_code = final_res["content"]
    except Exception as e:
        final_code = f"/* Integration failed: {str(e)} */\n\n" + "\n\n".join(results)

    return {
        "success": True,
        "tasks": tasks,
        "subagent_outputs": results,
        "final_code": final_code
    }


@app.post("/v1/odysseus/deep-research")
async def odysseus_deep_research(request: DeepResearchRequest, _: None = Depends(require_auth)) -> dict[str, Any]:
    model = choose_model("reasoning")
    logs = []
    
    logs.append("Phase 1: Querying local Second Brain (Obsidian PKM) and workspace indexes...")
    context = await get_local_memory_context(request.orgId, request.query)
    
    working_data = context
    for i in range(1, request.steps + 1):
        logs.append(f"Phase {i+1}: Executing Deep Research Cycle {i} of {request.steps}...")
        research_prompt = (
            "You are the Odysseus Deep Research Agent. Synthesize information, look for contradictions, "
            "and expand on details.\n\n"
            f"Topic: {request.query}\n"
            f"Current Knowledge Space:\n{working_data}\n\n"
            "Analyze remaining gaps and expand on them."
        )
        try:
            res = await ollama_chat([{"role": "user", "content": research_prompt}], model)
            working_data += f"\n\n--- Research Cycle {i} ---\n{res['content']}"
        except Exception as e:
            working_data += f"\n\n[Cycle {i} failed: {str(e)}]"

    logs.append("Final Phase: Synthesizing comprehensive research brief...")
    synthesis_prompt = (
        "Draft a formal, professional research report based on the compiled facts.\n"
        "Include sections for Executive Summary, Detailed Analysis, Gaps/Risks, and Actionable Steps.\n\n"
        f"Data compilation:\n{working_data}"
    )
    
    try:
        final_brief = await ollama_chat([{"role": "user", "content": synthesis_prompt}], model)
        brief_content = final_brief["content"]
    except Exception as e:
        brief_content = f"Failed to synthesize brief: {str(e)}\n\nRaw context: {working_data}"

            brief_content = f"Failed to synthesize brief: {str(e)}\n\nRaw context: {working_data}"
 
     return {
         "success": True,
         "logs": logs,
         "brief": brief_content
     }


# ─── STANDALONE AGENTIC CODER WORKSPACE ───

# In-memory dictionary to track background OODA run states
ooda_runs: dict[str, dict[str, Any]] = {}

class CodeEditRequest(BaseModel):
    path: str
    target_search: str
    replacement: str


class SaveTrainingRequest(BaseModel):
    instruction: str
    context: str
    reasoning_steps: str
    final_code: str


class OodaRequest(BaseModel):
    target_path: str
    instruction: str
    verification_command: str | None = None
    max_iterations: int = 3
    orgId: str = "default"


@app.get("/v1/coder/read-large")
async def read_large_file(path: str, start_line: int = 1, end_line: int | None = None, _: None = Depends(require_auth)):
    try:
        target = validate_safe_path(path)
        if not os.path.isfile(target):
            raise HTTPException(status_code=400, detail="Path is not a file")
        
        with open(target, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        
        total_lines = len(lines)
        if end_line is None:
            if total_lines <= 800:
                content = "".join(lines)
                is_truncated = False
            else:
                outline = []
                for idx, line in enumerate(lines):
                    if line.strip().startswith(("import ", "from ", "class ", "def ", "export ", "const ", "function ")):
                        outline.append(f"Line {idx+1}: {line.strip()}")
                content = f"// File too large ({total_lines} lines). High-level structural outline:\n" + "\n".join(outline[:200]) + "\n\n// Use start_line and end_line parameters to read specific chunks."
                is_truncated = True
        else:
            start_idx = max(0, start_line - 1)
            end_idx = min(total_lines, end_line)
            content = "".join(lines[start_idx:end_idx])
            is_truncated = (end_idx < total_lines) or (start_idx > 0)
            
        return {
            "success": True,
            "path": path,
            "total_lines": total_lines,
            "content": content,
            "is_truncated": is_truncated
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/coder/edit")
async def edit_file(request: CodeEditRequest, _: None = Depends(require_auth)):
    try:
        target = validate_safe_path(request.path)
        if not os.path.isfile(target):
            raise HTTPException(status_code=400, detail="Path is not a file")
        
        with open(target, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        
        if request.target_search not in content:
            raise HTTPException(
                status_code=400, 
                detail=f"Target content to replace was not found in the file: {request.target_search[:100]}"
            )
        
        new_content = content.replace(request.target_search, request.replacement, 1)
        with open(target, "w", encoding="utf-8") as f:
            f.write(new_content)
            
        return {"success": True, "message": f"Successfully updated {request.path}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/coder/save-training-data")
async def save_training_data(request: SaveTrainingRequest, _: None = Depends(require_auth)):
    try:
        training_dir = Path(__file__).resolve().parents[2] / "training_data"
        training_dir.mkdir(exist_ok=True)
        dataset_file = training_dir / "dataset.jsonl"
        
        record = {
            "instruction": request.instruction,
            "context": request.context,
            "reasoning_steps": request.reasoning_steps,
            "final_code": request.final_code,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        with open(dataset_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            
        return {"success": True, "message": "Training tuple successfully appended to dataset.jsonl"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/v1/coder/training-data")
async def get_training_data(_: None = Depends(require_auth)):
    try:
        training_dir = Path(__file__).resolve().parents[2] / "training_data"
        dataset_file = training_dir / "dataset.jsonl"
        
        records = []
        if dataset_file.exists():
            with open(dataset_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        records.append(json.loads(line))
        return {"success": True, "records": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def run_ooda_loop_task(run_id: str, target_path: str, instruction: str, verification_command: str | None, max_iterations: int, org_id: str):
    import asyncio
    state = ooda_runs[run_id]
    state["status"] = "running"
    
    planner_model = choose_model("reasoning")
    
    try:
        resolved_path = validate_safe_path(target_path)
        rel_path = os.path.relpath(resolved_path, validate_safe_path("."))
    except Exception as e:
        state["logs"].append(f"[ERROR] Path validation failed: {str(e)}")
        state["status"] = "failed"
        return

    for iteration in range(1, max_iterations + 1):
        state["logs"].append(f"\n--- [ITERATION {iteration} / {max_iterations}] Starting OODA loop ---")
        
        # 1. OBSERVE
        state["logs"].append(f"[OBSERVE] Reading target file '{rel_path}'...")
        try:
            with open(resolved_path, "r", encoding="utf-8", errors="ignore") as f:
                file_content = f.read()
        except Exception as e:
            state["logs"].append(f"[ERROR] Failed to read target file: {str(e)}")
            state["status"] = "failed"
            return
            
        # 2. ORIENT
        state["logs"].append("[ORIENT] Searching pgvector memories and rules context...")
        memory_context = await get_local_memory_context(org_id, instruction, limit=2)
        
        # 3. DECIDE
        state["logs"].append(f"[DECIDE] Requesting design plan from reasoning model ({planner_model})...")
        decide_prompt = (
            "You are the sovereign AI OS Coder Agent (Decide Phase).\n"
            f"Instruction: {instruction}\n"
            f"Target File: {rel_path}\n"
            f"Relevant Memories:\n{memory_context or 'None'}\n\n"
            f"Target File Current Content:\n{file_content}\n\n"
            "Determine the exact block of code that needs to be replaced. Identify the exact search string (must exist uniquely in the file) "
            "and the exact replacement content.\n\n"
            "Output your response strictly as a JSON block with these keys:\n"
            "{\n"
            "  \"reasoning\": \"Step-by-step thinking trace for the edit\",\n"
            "  \"target_search\": \"Exact string to find in the file (must match whitespace and characters precisely)\",\n"
            "  \"replacement\": \"Replacement code block\"\n"
            "}"
        )
        try:
            decide_res = await ollama_chat([{"role": "user", "content": decide_prompt}], planner_model, temperature=0.1)
            raw_text = decide_res["content"].strip()
            json_match = re.search(r"\{[\s\S]+\}", raw_text)
            if not json_match:
                state["logs"].append("[ERROR] Reasoning model did not return a valid JSON block.")
                continue
            decision = json.loads(json_match.group(0))
            reasoning_trace = decision.get("reasoning", "No trace provided")
            target_search = decision.get("target_search")
            replacement = decision.get("replacement")
            
            state["logs"].append(f"[DECIDE] Reasoning Plan: {reasoning_trace}")
        except Exception as e:
            state["logs"].append(f"[ERROR] Decision phase failed: {str(e)}")
            continue
            
        # 4. ACT
        state["logs"].append(f"[ACT] Modifying file '{rel_path}'...")
        if not target_search:
            state["logs"].append("[ERROR] Target search block is empty.")
            continue
            
        if target_search not in file_content:
            state["logs"].append(f"[ERROR] Target search block was not found in target file. Retrying decide...")
            continue
            
        try:
            new_content = file_content.replace(target_search, replacement, 1)
            with open(resolved_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            state["logs"].append("[ACT] File edit successfully applied.")
        except Exception as e:
            state["logs"].append(f"[ERROR] Act phase failed to write file: {str(e)}")
            continue
            
        # 5. VERIFY
        if verification_command:
            state["logs"].append(f"[VERIFY] Running command: {verification_command}...")
            try:
                proc = await asyncio.create_subprocess_shell(
                    verification_command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=validate_safe_path(".")
                )
                stdout, stderr = await proc.communicate()
                out_str = stdout.decode().strip()
                err_str = stderr.decode().strip()
                
                if proc.returncode == 0:
                    state["logs"].append(f"[VERIFY] Verification command succeeded!\nOutput:\n{out_str}")
                    state["logs"].append("[LEARN] Storing successful trajectory to training dataset...")
                    try:
                        training_dir = Path(__file__).resolve().parents[2] / "training_data"
                        training_dir.mkdir(exist_ok=True)
                        dataset_file = training_dir / "dataset.jsonl"
                        record = {
                            "instruction": instruction,
                            "context": f"File: {rel_path}\n{target_search}",
                            "reasoning_steps": reasoning_trace,
                            "final_code": replacement,
                            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                        }
                        with open(dataset_file, "a", encoding="utf-8") as f:
                            f.write(json.dumps(record, ensure_ascii=False) + "\n")
                    except Exception as err:
                        state["logs"].append(f"[WARN] Failed to write training log: {str(err)}")
                        
                    await save_semantic_cache_rule(org_id, f"Successfully implemented: {instruction} in {rel_path} by replacing block.", "correction", {"source": "ooda_loop"})
                    state["status"] = "success"
                    return
                else:
                    state["logs"].append(f"[VERIFY] Verification command failed (Exit code: {proc.returncode}).\nStderr: {err_str}\nStdout: {out_str}")
            except Exception as e:
                state["logs"].append(f"[ERROR] Verification execution failed: {str(e)}")
        else:
            state["logs"].append("[VERIFY] No verification command supplied. Assuming successful edit.")
            state["status"] = "success"
            return
            
    state["logs"].append("\n[ERROR] Maximum OODA loop iterations reached without successful verification.")
    state["status"] = "failed"


@app.post("/v1/coder/execute-ooda")
async def execute_ooda_loop(request: OodaRequest, background_tasks: BackgroundTasks, _: None = Depends(require_auth)):
    run_id = str(uuid.uuid4())
    ooda_runs[run_id] = {
        "status": "pending",
        "logs": ["Job queued. Resolving environment..."],
        "target_path": request.target_path,
        "instruction": request.instruction,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    background_tasks.add_task(
        run_ooda_loop_task,
        run_id,
        request.target_path,
        request.instruction,
        request.verification_command,
        request.max_iterations,
        request.orgId
    )
    
    return {"success": True, "runId": run_id, "message": "OODA coding agent launched in background."}


@app.get("/v1/coder/ooda-status/{run_id}")
async def get_ooda_status(run_id: str, _: None = Depends(require_auth)):
    if run_id not in ooda_runs:
        raise HTTPException(status_code=404, detail="OODA run not found")
    return {"success": True, "data": ooda_runs[run_id]}



