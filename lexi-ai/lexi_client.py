"""
LEXI AI Client SDK
-------------------
Clean, production-ready Python client with multi-provider fallback, exponential backoff,
and error handling for consuming LEXI AI (Groq, Gemini, local FastAPI server, or HuggingFace).
"""

import os
import time
import random
import requests
from typing import Generator, List, Dict, Optional

class LexiClient:
    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
        api_base_url: Optional[str] = "http://localhost:8000"
    ):
        self.groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        self.api_base_url = api_base_url.rstrip("/") if api_base_url else None
        
        self.default_system_prompt = (
            "You are LEXI, an elite AI assistant engineered for extreme clarity, "
            "deep technical reasoning, and zero fluff."
        )

    def chat(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_retries: int = 5,
        base_delay: float = 2.0
    ) -> str:
        """
        Sends a query to LEXI AI with automatic fallback across providers
        and exponential backoff retry logic for free tier rate limits (HTTP 429).
        """
        sys_p = system_prompt or self.default_system_prompt

        # Attempt 1: Fast Local/Remote FastAPI Server Endpoint
        if self.api_base_url:
            try:
                response = requests.post(
                    f"{self.api_base_url}/v1/chat/completions",
                    json={
                        "model": "lexi-ai-8b",
                        "messages": [
                            {"role": "system", "content": sys_p},
                            {"role": "user", "content": prompt}
                        ]
                    },
                    timeout=15
                )
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"[Client Info] Server endpoint at {self.api_base_url} unreachable: {e}. Falling back to direct API calls...")

        # Attempt 2: Direct Groq API Call
        if self.groq_api_key:
            try:
                return self._call_groq_direct(prompt, sys_p, max_retries, base_delay)
            except Exception as e:
                print(f"[Client Warning] Groq direct call failed: {e}. Falling back to Gemini...")

        # Attempt 3: Direct Gemini API Call
        if self.gemini_api_key:
            try:
                return self._call_gemini_direct(prompt, sys_p, max_retries, base_delay)
            except Exception as e:
                print(f"[Client Error] Gemini direct call failed: {e}")

        raise RuntimeError("All available APIs failed or no valid API Keys provided.")

    def _call_groq_direct(self, prompt: str, system_prompt: str, max_retries: int, base_delay: float) -> str:
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1024
        }

        for attempt in range(max_retries):
            try:
                res = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=20
                )
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"]
                elif res.status_code == 429:
                    delay = base_delay * (2 ** attempt) + random.uniform(0.1, 0.5)
                    print(f"⚠️ [Groq 429 Rate Limit] Retrying in {delay:.2f}s (Attempt {attempt+1}/{max_retries})...")
                    time.sleep(delay)
                else:
                    res.raise_for_status()
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                time.sleep(base_delay)
        raise RuntimeError("Groq rate limit retries exhausted.")

    def _call_gemini_direct(self, prompt: str, system_prompt: str, max_retries: int, base_delay: float) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": f"System: {system_prompt}\nUser Question: {prompt}"}]
                }
            ]
        }

        for attempt in range(max_retries):
            try:
                res = requests.post(url, json=payload, timeout=20)
                if res.status_code == 200:
                    data = res.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                elif res.status_code == 429:
                    delay = base_delay * (2 ** attempt) + random.uniform(0.1, 0.5)
                    print(f"⚠️ [Gemini 429 Quota Exceeded] Retrying in {delay:.2f}s (Attempt {attempt+1}/{max_retries})...")
                    time.sleep(delay)
                else:
                    res.raise_for_status()
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                time.sleep(base_delay)
        raise RuntimeError("Gemini rate limit retries exhausted.")


# Demo Usage
if __name__ == "__main__":
    client = LexiClient()
    print("🤖 Prompting LEXI AI...")
    try:
        response = client.chat("Explain how to fine-tune Llama 3 on Google Colab T4 GPU in 3 clear bullet points.")
        print(f"\n[LEXI Response]:\n{response}\n")
    except Exception as e:
        print(f"Execution finished with note: {e}")
