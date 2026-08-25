"""
LEXI AI — Provider Hub
======================
Unified multi-provider inference layer with:
  • 5 free-tier providers: Groq, Gemini 2.0, OpenRouter, HuggingFace Serverless, local FastAPI.
  • Automatic cascade fallback with per-provider exponential backoff.
  • Structured provider health tracking & latency metrics.
  • Thread-safe async execution.
"""

import os
import time
import random
import asyncio
import hashlib
import json
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Optional, Any

import requests

logger = logging.getLogger("lexi.providers")

# ─── Provider Registry ───────────────────────────────────────────────────────

class ProviderName(str, Enum):
    GROQ = "groq"
    GEMINI = "gemini"
    OPENROUTER = "openrouter"
    HUGGINGFACE = "huggingface"
    LOCAL = "local"

@dataclass
class ProviderHealth:
    name: ProviderName
    total_calls: int = 0
    total_failures: int = 0
    total_429s: int = 0
    last_latency_ms: float = 0.0
    is_healthy: bool = True
    last_error: str = ""

@dataclass
class ProviderResult:
    text: str
    provider: str
    model: str
    latency_ms: float
    tokens_used: int = 0

# ─── Multi-Provider Engine ────────────────────────────────────────────────────

class ProviderHub:
    """Unified inference hub routing across all free-tier providers with smart fallback."""

    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY", "")
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
        self.hf_key = os.getenv("HF_TOKEN", "")
        self.local_url = os.getenv("LEXI_LOCAL_URL", "")

        self._health: Dict[str, ProviderHealth] = {}
        self._response_cache: Dict[str, str] = {}

        # Build ordered provider cascade (fastest → most generous)
        self._cascade: List[ProviderName] = []
        if self.groq_key:
            self._cascade.append(ProviderName.GROQ)
            self._health["groq"] = ProviderHealth(name=ProviderName.GROQ)
        if self.gemini_key:
            self._cascade.append(ProviderName.GEMINI)
            self._health["gemini"] = ProviderHealth(name=ProviderName.GEMINI)
        if self.openrouter_key:
            self._cascade.append(ProviderName.OPENROUTER)
            self._health["openrouter"] = ProviderHealth(name=ProviderName.OPENROUTER)
        if self.hf_key:
            self._cascade.append(ProviderName.HUGGINGFACE)
            self._health["huggingface"] = ProviderHealth(name=ProviderName.HUGGINGFACE)
        if self.local_url:
            self._cascade.append(ProviderName.LOCAL)
            self._health["local"] = ProviderHealth(name=ProviderName.LOCAL)

    @property
    def available_providers(self) -> List[str]:
        return [p.value for p in self._cascade]

    @property
    def health_report(self) -> Dict[str, Any]:
        return {k: {"healthy": v.is_healthy, "calls": v.total_calls,
                     "failures": v.total_failures, "429s": v.total_429s,
                     "last_latency_ms": round(v.last_latency_ms, 1),
                     "last_error": v.last_error}
                for k, v in self._health.items()}

    # ── Cache Helper ─────────────────────────────────────────────────────────
    def _cache_key(self, messages: List[Dict], model: str) -> str:
        raw = json.dumps(messages, sort_keys=True) + model
        return hashlib.md5(raw.encode()).hexdigest()

    # ── Core Cascade Router ──────────────────────────────────────────────────
    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        use_cache: bool = True,
    ) -> ProviderResult:
        """Routes through the provider cascade with automatic failover."""

        cache_key = self._cache_key(messages, str(temperature))
        if use_cache and cache_key in self._response_cache:
            return ProviderResult(
                text=self._response_cache[cache_key],
                provider="cache", model="cache", latency_ms=0.0
            )

        last_error = None
        for provider in self._cascade:
            health = self._health.get(provider.value)
            if health and not health.is_healthy:
                continue  # skip providers in cooldown

            try:
                result = await self._call_provider(
                    provider, messages, temperature, max_tokens
                )
                if use_cache:
                    self._response_cache[cache_key] = result.text
                return result
            except Exception as e:
                last_error = e
                logger.warning(f"[{provider.value}] Failed: {e}. Trying next provider...")
                continue

        raise RuntimeError(
            f"All providers exhausted. Last error: {last_error}. "
            f"Configured providers: {self.available_providers}"
        )

    async def _call_provider(
        self,
        provider: ProviderName,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> ProviderResult:
        dispatch = {
            ProviderName.GROQ: self._call_groq,
            ProviderName.GEMINI: self._call_gemini,
            ProviderName.OPENROUTER: self._call_openrouter,
            ProviderName.HUGGINGFACE: self._call_huggingface,
            ProviderName.LOCAL: self._call_local,
        }
        return await dispatch[provider](messages, temperature, max_tokens)

    # ── Individual Provider Implementations ──────────────────────────────────

    async def _call_groq(self, messages, temperature, max_tokens) -> ProviderResult:
        return await self._call_openai_compatible(
            base_url="https://api.groq.com/openai/v1/chat/completions",
            api_key=self.groq_key,
            model="llama-3.1-70b-versatile",
            fallback_model="llama-3.1-8b-instant",
            provider_name="groq",
            messages=messages, temperature=temperature, max_tokens=max_tokens,
        )

    async def _call_gemini(self, messages, temperature, max_tokens) -> ProviderResult:
        health = self._health["gemini"]
        system_parts = [m["content"] for m in messages if m["role"] == "system"]
        user_parts = [f'{m["role"].upper()}: {m["content"]}' for m in messages if m["role"] != "system"]
        system_text = system_parts[0] if system_parts else ""
        prompt_text = "\n".join(user_parts)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.gemini_key}"
        payload = {
            "system_instruction": {"parts": [{"text": system_text}]} if system_text else {},
            "contents": [{"parts": [{"text": prompt_text}]}],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens}
        }

        result = await self._http_with_backoff(
            url=url, payload=payload, headers={"Content-Type": "application/json"},
            provider_name="gemini",
            extract_fn=lambda data: data["candidates"][0]["content"]["parts"][0]["text"],
        )
        return result

    async def _call_openrouter(self, messages, temperature, max_tokens) -> ProviderResult:
        return await self._call_openai_compatible(
            base_url="https://openrouter.ai/api/v1/chat/completions",
            api_key=self.openrouter_key,
            model="meta-llama/llama-3.1-8b-instruct:free",
            fallback_model="meta-llama/llama-3.1-8b-instruct:free",
            provider_name="openrouter",
            messages=messages, temperature=temperature, max_tokens=max_tokens,
            extra_headers={"HTTP-Referer": "https://lexi-ai.app", "X-Title": "LEXI AI"},
        )

    async def _call_huggingface(self, messages, temperature, max_tokens) -> ProviderResult:
        health = self._health["huggingface"]
        url = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3.1-8B-Instruct/v1/chat/completions"
        payload = {
            "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
            "messages": messages,
            "temperature": temperature,
            "max_tokens": min(max_tokens, 1024),
        }
        headers = {
            "Authorization": f"Bearer {self.hf_key}",
            "Content-Type": "application/json",
        }
        result = await self._http_with_backoff(
            url=url, payload=payload, headers=headers,
            provider_name="huggingface",
            extract_fn=lambda data: data["choices"][0]["message"]["content"],
        )
        return result

    async def _call_local(self, messages, temperature, max_tokens) -> ProviderResult:
        return await self._call_openai_compatible(
            base_url=f"{self.local_url.rstrip('/')}/v1/chat/completions",
            api_key="not-needed",
            model="lexi-ai-local",
            fallback_model="lexi-ai-local",
            provider_name="local",
            messages=messages, temperature=temperature, max_tokens=max_tokens,
        )

    # ── Shared HTTP + Backoff Engine ─────────────────────────────────────────

    async def _call_openai_compatible(
        self, base_url, api_key, model, fallback_model, provider_name,
        messages, temperature, max_tokens, extra_headers=None,
    ) -> ProviderResult:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        if extra_headers:
            headers.update(extra_headers)

        for current_model in [model, fallback_model]:
            payload = {
                "model": current_model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            try:
                return await self._http_with_backoff(
                    url=base_url, payload=payload, headers=headers,
                    provider_name=provider_name,
                    extract_fn=lambda data: data["choices"][0]["message"]["content"],
                    model_name=current_model,
                )
            except Exception:
                if current_model == fallback_model:
                    raise
                logger.info(f"[{provider_name}] Primary model {model} failed, trying {fallback_model}...")
                continue
        raise RuntimeError(f"{provider_name} all models failed")

    async def _http_with_backoff(
        self, url, payload, headers, provider_name, extract_fn,
        model_name="", max_retries=4, base_delay=1.5,
    ) -> ProviderResult:
        health = self._health[provider_name]

        for attempt in range(max_retries):
            t0 = time.perf_counter()
            try:
                loop = asyncio.get_event_loop()
                res = await loop.run_in_executor(
                    None,
                    lambda: requests.post(url, json=payload, headers=headers, timeout=30)
                )
                latency = (time.perf_counter() - t0) * 1000

                if res.status_code == 200:
                    data = res.json()
                    text = extract_fn(data)
                    health.total_calls += 1
                    health.last_latency_ms = latency
                    health.is_healthy = True
                    return ProviderResult(
                        text=text, provider=provider_name,
                        model=model_name, latency_ms=latency
                    )
                elif res.status_code == 429:
                    health.total_429s += 1
                    delay = base_delay * (2 ** attempt) + random.uniform(0.1, 0.8)
                    logger.warning(f"[{provider_name}] 429 Rate Limit. Backing off {delay:.1f}s (attempt {attempt+1}/{max_retries})")
                    await asyncio.sleep(delay)
                else:
                    health.total_failures += 1
                    health.last_error = f"HTTP {res.status_code}: {res.text[:200]}"
                    raise RuntimeError(health.last_error)

            except requests.exceptions.Timeout:
                health.total_failures += 1
                health.last_error = "Request timeout"
                if attempt == max_retries - 1:
                    health.is_healthy = False
                    raise
                await asyncio.sleep(base_delay * (attempt + 1))
            except requests.exceptions.ConnectionError:
                health.is_healthy = False
                raise

        health.is_healthy = False
        raise RuntimeError(f"[{provider_name}] Rate limit retries exhausted after {max_retries} attempts.")


# ─── Synchronous Convenience Wrapper ─────────────────────────────────────────

def generate_sync(
    prompt: str,
    system_prompt: str = "",
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str:
    """Blocking convenience wrapper for scripts and dataset generation."""
    hub = ProviderHub()
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    loop = asyncio.new_event_loop()
    try:
        result = loop.run_until_complete(hub.generate(messages, temperature, max_tokens))
        return result.text
    finally:
        loop.close()


if __name__ == "__main__":
    hub = ProviderHub()
    print(f"✅ Available providers: {hub.available_providers}")
    print(f"📊 Health: {json.dumps(hub.health_report, indent=2)}")

    try:
        response = generate_sync("Explain QLoRA in 3 bullet points.", system_prompt="You are LEXI AI.")
        print(f"\n🤖 Response:\n{response}")
    except Exception as e:
        print(f"⚠️  No API keys configured: {e}")
