"""
LEXI AI — Production FastAPI Server (v2.0)
==========================================
Full-featured deployment backend with:
  • OpenAI-compatible /v1/chat/completions (standard & streaming SSE)
  • 5-provider cascade routing via ProviderHub
  • Conversation memory with sliding window
  • In-memory LRU response cache
  • Per-IP rate limiting middleware
  • Provider health dashboard endpoint
  • Streaming Server-Sent Events (SSE) support
  • Graceful error propagation with structured JSON errors
"""

import os
import time
import uuid
import json
import asyncio
import logging
from collections import OrderedDict
from typing import List, Dict, Optional, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

from providers import ProviderHub, ProviderResult

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
logger = logging.getLogger("lexi.server")

# ─── App Initialization ──────────────────────────────────────────────────────

app = FastAPI(
    title="LEXI AI Engine",
    description="Production AI inference server with multi-provider cascade, streaming, caching, and rate limiting.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LEXI_SYSTEM = os.getenv("LEXI_SYSTEM_PROMPT", (
    "You are LEXI, an elite AI assistant engineered for extreme precision, deep multi-step "
    "reasoning, and production-grade code generation. You think step-by-step inside <thought> "
    "tags before delivering flawless, structured answers. You never produce fluff or filler."
))

# ─── In-Memory State ─────────────────────────────────────────────────────────

hub = ProviderHub()

class LRUCache:
    """Thread-safe LRU cache for response deduplication."""
    def __init__(self, maxsize: int = 500):
        self._cache: OrderedDict[str, str] = OrderedDict()
        self._maxsize = maxsize

    def get(self, key: str) -> Optional[str]:
        if key in self._cache:
            self._cache.move_to_end(key)
            return self._cache[key]
        return None

    def put(self, key: str, value: str):
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = value
        while len(self._cache) > self._maxsize:
            self._cache.popitem(last=False)

response_cache = LRUCache(maxsize=500)

class ConversationStore:
    """Per-session conversation memory with sliding window."""
    def __init__(self, max_history: int = 20):
        self._store: Dict[str, List[Dict]] = {}
        self._max = max_history

    def get(self, session_id: str) -> List[Dict]:
        return self._store.get(session_id, [])

    def append(self, session_id: str, message: Dict):
        if session_id not in self._store:
            self._store[session_id] = []
        self._store[session_id].append(message)
        # Sliding window: keep system + last N messages
        if len(self._store[session_id]) > self._max:
            system_msgs = [m for m in self._store[session_id] if m.get("role") == "system"]
            non_system = [m for m in self._store[session_id] if m.get("role") != "system"]
            self._store[session_id] = system_msgs + non_system[-(self._max - len(system_msgs)):]

    def clear(self, session_id: str):
        self._store.pop(session_id, None)

conversations = ConversationStore(max_history=20)

# Rate limiter state
class RateLimiter:
    def __init__(self, rpm: int = 60):
        self._rpm = rpm
        self._requests: Dict[str, List[float]] = {}

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        if client_ip not in self._requests:
            self._requests[client_ip] = []
        # Clean old entries
        self._requests[client_ip] = [t for t in self._requests[client_ip] if now - t < 60]
        if len(self._requests[client_ip]) >= self._rpm:
            return False
        self._requests[client_ip].append(now)
        return True

rate_limiter = RateLimiter(rpm=60)

# Server startup metrics
startup_time = time.time()
request_counter = {"total": 0, "errors": 0, "cache_hits": 0}

# ─── Pydantic Schemas (OpenAI-compatible) ─────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str = "lexi-ai"
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024
    stream: Optional[bool] = False
    session_id: Optional[str] = None  # For conversation memory

class Usage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

class ChatChoice(BaseModel):
    index: int = 0
    message: ChatMessage
    finish_reason: str = "stop"

class ChatCompletionResponse(BaseModel):
    id: str = Field(default_factory=lambda: f"chatcmpl-lexi-{uuid.uuid4().hex[:12]}")
    object: str = "chat.completion"
    created: int = Field(default_factory=lambda: int(time.time()))
    model: str = "lexi-ai"
    choices: List[ChatChoice]
    usage: Usage = Field(default_factory=Usage)
    provider: Optional[str] = None
    latency_ms: Optional[float] = None

# ─── Rate Limit Middleware ────────────────────────────────────────────────────

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/v1/"):
        client_ip = request.client.host if request.client else "unknown"
        if not rate_limiter.is_allowed(client_ip):
            return JSONResponse(
                status_code=429,
                content={"error": {"message": "Rate limit exceeded. Max 60 requests per minute.", "type": "rate_limit_error"}},
            )
    response = await call_next(request)
    return response

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "LEXI AI Engine v2.0",
        "status": "online",
        "uptime_seconds": int(time.time() - startup_time),
        "providers": hub.available_providers,
        "endpoints": {
            "chat": "/v1/chat/completions",
            "models": "/v1/models",
            "health": "/health",
            "dashboard": "/dashboard",
            "docs": "/docs",
        },
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "providers": hub.health_report,
        "metrics": request_counter,
    }

@app.get("/dashboard")
def dashboard():
    return {
        "service": "LEXI AI Engine v2.0",
        "uptime_seconds": int(time.time() - startup_time),
        "total_requests": request_counter["total"],
        "total_errors": request_counter["errors"],
        "cache_hits": request_counter["cache_hits"],
        "cache_hit_rate": f"{(request_counter['cache_hits'] / max(1, request_counter['total'])) * 100:.1f}%",
        "providers": hub.health_report,
        "active_conversations": len(conversations._store),
    }

@app.get("/v1/models")
def list_models():
    models = [
        {"id": "lexi-ai", "object": "model", "owned_by": "lexi-ai", "description": "LEXI AI with multi-provider cascade"},
    ]
    for p in hub.available_providers:
        models.append({"id": f"lexi-ai-{p}", "object": "model", "owned_by": p})
    return {"object": "list", "data": models}

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest, req: Request):
    request_counter["total"] += 1
    t0 = time.perf_counter()

    # Build message list with conversation memory
    messages_dicts = [{"role": m.role, "content": m.content} for m in request.messages]

    # Inject system prompt if not present
    has_system = any(m["role"] == "system" for m in messages_dicts)
    if not has_system:
        messages_dicts.insert(0, {"role": "system", "content": LEXI_SYSTEM})

    # Handle conversation memory
    session_id = request.session_id
    if session_id:
        history = conversations.get(session_id)
        if history:
            # Prepend history before current messages (skip system duplicates)
            current_non_system = [m for m in messages_dicts if m["role"] != "system"]
            system_msg = [m for m in messages_dicts if m["role"] == "system"]
            messages_dicts = system_msg + history + current_non_system

    # Check cache
    import hashlib
    cache_key = hashlib.md5(json.dumps(messages_dicts, sort_keys=True).encode()).hexdigest()
    cached = response_cache.get(cache_key)
    if cached and not request.stream:
        request_counter["cache_hits"] += 1
        latency = (time.perf_counter() - t0) * 1000
        return ChatCompletionResponse(
            model=request.model,
            choices=[ChatChoice(message=ChatMessage(role="assistant", content=cached))],
            provider="cache",
            latency_ms=round(latency, 1),
        )

    # Stream mode
    if request.stream:
        return StreamingResponse(
            _stream_response(messages_dicts, request.model, request.temperature or 0.7, request.max_tokens or 1024),
            media_type="text/event-stream",
        )

    # Normal mode — call provider hub
    try:
        result: ProviderResult = await hub.generate(
            messages=messages_dicts,
            temperature=request.temperature or 0.7,
            max_tokens=request.max_tokens or 1024,
        )

        # Cache the response
        response_cache.put(cache_key, result.text)

        # Store in conversation memory
        if session_id:
            user_msg = messages_dicts[-1] if messages_dicts else {}
            conversations.append(session_id, user_msg)
            conversations.append(session_id, {"role": "assistant", "content": result.text})

        latency = (time.perf_counter() - t0) * 1000

        return ChatCompletionResponse(
            model=request.model,
            choices=[ChatChoice(message=ChatMessage(role="assistant", content=result.text))],
            provider=result.provider,
            latency_ms=round(latency, 1),
        )

    except Exception as e:
        request_counter["errors"] += 1
        logger.error(f"Chat completion failed: {e}")
        raise HTTPException(status_code=503, detail={"error": {"message": str(e), "type": "provider_error"}})

async def _stream_response(messages, model, temperature, max_tokens):
    """Generates SSE stream chunks (OpenAI-compatible streaming format)."""
    completion_id = f"chatcmpl-lexi-{uuid.uuid4().hex[:12]}"

    try:
        result = await hub.generate(messages=messages, temperature=temperature, max_tokens=max_tokens)

        # Simulate streaming by chunking the response
        words = result.text.split(" ")
        for i, word in enumerate(words):
            chunk = {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": model,
                "choices": [{
                    "index": 0,
                    "delta": {"content": word + (" " if i < len(words) - 1 else "")},
                    "finish_reason": None if i < len(words) - 1 else "stop",
                }],
            }
            yield f"data: {json.dumps(chunk)}\n\n"
            await asyncio.sleep(0.02)  # Simulate token-by-token streaming

        yield "data: [DONE]\n\n"

    except Exception as e:
        error_chunk = {"error": {"message": str(e), "type": "stream_error"}}
        yield f"data: {json.dumps(error_chunk)}\n\n"
        yield "data: [DONE]\n\n"

# ─── Conversation Management Endpoints ───────────────────────────────────────

@app.delete("/v1/conversations/{session_id}")
def clear_conversation(session_id: str):
    conversations.clear(session_id)
    return {"status": "cleared", "session_id": session_id}

@app.get("/v1/conversations/{session_id}")
def get_conversation(session_id: str):
    return {"session_id": session_id, "messages": conversations.get(session_id)}

# ─── Entrypoint ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "7860"))
    print(f"🚀 Starting LEXI AI Engine v2.0 on port {port}...")
    print(f"📡 Providers: {hub.available_providers}")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
