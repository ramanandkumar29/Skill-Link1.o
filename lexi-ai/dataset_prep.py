import os
import json
import time
import random
from typing import List, Dict, Any

# Ensure required libraries: pip install google-generativeai groq tqdm requests
try:
    from groq import Groq
except ImportError:
    Groq = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None

LEXI_SYSTEM_PROMPT = """You are LEXI, an elite, highly intelligent, precise, and empathetic AI assistant. 
Your tone is professional yet personable, highly structured, clear, and direct. You never produce fluff."""

SAMPLE_TOPICS = [
    "Explaining complex machine learning concepts simply",
    "Writing high-performance Python backend code with FastAPI",
    "Debugging distributed system bottlenecks",
    "Designing full-stack AI architectures on free tier services",
    "Optimizing LLM inference using quantization and GGUF",
    "Refactoring dirty code into clean, scalable SOLID patterns",
    "Analyzing tech stack choices for startups"
]

def call_groq_api(prompt: str, api_key: str) -> str:
    """Call Groq API with exponential backoff rate-limit handling."""
    if not Groq:
        raise ImportError("Please install groq: pip install groq")
    
    client = Groq(api_key=api_key)
    max_retries = 5
    base_delay = 2.0

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": LEXI_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1024
            )
            return response.choices[0].message.content
        except Exception as e:
            if "429" in str(e) or "rate_limit" in str(e).lower():
                delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                print(f"[Groq 429] Rate limit hit. Retrying in {delay:.2f}s (Attempt {attempt+1}/{max_retries})...")
                time.sleep(delay)
            else:
                raise e
    raise RuntimeError("Groq API rate limit retries exhausted.")

def call_gemini_api(prompt: str, api_key: str) -> str:
    """Call Google Gemini Free Tier API with error and rate-limit handling."""
    if not genai:
        raise ImportError("Please install google-generativeai: pip install google-generativeai")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=LEXI_SYSTEM_PROMPT)
    max_retries = 5
    base_delay = 2.0

    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower() or "resourceexhausted" in str(e).lower():
                delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                print(f"[Gemini 429] Quota exceeded. Retrying in {delay:.2f}s (Attempt {attempt+1}/{max_retries})...")
                time.sleep(delay)
            else:
                raise e
    raise RuntimeError("Gemini API rate limit retries exhausted.")

def generate_lexi_dataset(
    num_samples: int = 50,
    output_file: str = "lexi_dataset.jsonl",
    format_type: str = "sharegpt" # "sharegpt" or "alpaca" or "llama3"
):
    """Generates synthetic dataset to fine-tune LEXI AI using Free Tier APIs."""
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if not groq_key and not gemini_key:
        print("[WARNING] Neither GROQ_API_KEY nor GEMINI_API_KEY found in environment.")
        print("[INFO] Creating mock sample dataset for demonstration...")
        create_mock_dataset(output_file, format_type)
        return

    dataset = []
    print(f"Generating {num_samples} training samples for LEXI AI...")

    for i in range(num_samples):
        topic = random.choice(SAMPLE_TOPICS)
        prompt_user_gen = f"Generate a technical, real-world user question about: {topic}. Return ONLY the question string."
        
        try:
            if groq_key:
                user_question = call_groq_api(prompt_user_gen, groq_key).strip('" ')
                lexi_answer = call_groq_api(f"Answer this as LEXI AI:\n{user_question}", groq_key)
            else:
                user_question = call_gemini_api(prompt_user_gen, gemini_key).strip('" ')
                lexi_answer = call_gemini_api(f"Answer this as LEXI AI:\n{user_question}", gemini_key)

            if format_type == "sharegpt":
                entry = {
                    "conversations": [
                        {"from": "system", "value": LEXI_SYSTEM_PROMPT},
                        {"from": "human", "value": user_question},
                        {"from": "gpt", "value": lexi_answer}
                    ]
                }
            elif format_type == "alpaca":
                entry = {
                    "instruction": user_question,
                    "input": "",
                    "output": lexi_answer,
                    "system": LEXI_SYSTEM_PROMPT
                }
            else: # llama3 chat template format
                entry = {
                    "messages": [
                        {"role": "system", "content": LEXI_SYSTEM_PROMPT},
                        {"role": "user", "content": user_question},
                        {"role": "assistant", "content": lexi_answer}
                    ]
                }

            dataset.append(entry)
            print(f"[{i+1}/{num_samples}] Sample generated successfully.")
            time.sleep(1.0) # Respect rate limits

        except Exception as e:
            print(f"Error on sample {i+1}: {e}")
            continue

    with open(output_file, "w", encoding="utf-8") as f:
        for item in dataset:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"✅ Successfully saved dataset ({len(dataset)} items) to {output_file}")

def create_mock_dataset(output_file: str, format_type: str):
    """Fallback generator when API keys are not provided."""
    mock_data = [
        ("Who are you and what is your purpose?", "I am LEXI, an elite AI assistant designed for high-precision technical reasoning, software engineering, and multi-step architectural design."),
        ("How can I build AI apps for 100% free?", "You can combine Google Colab T4 for fine-tuning via Unsloth, Groq & Gemini APIs for ultra-fast free inference, and Hugging Face Spaces for free serverless backend hosting."),
        ("Explain QLoRA fine-tuning.", "QLoRA (Quantized Low-Rank Adaptation) quantizes base model weights into 4-bit NormalFloat while adding small trainable 16-bit LoRA adapter matrices, reducing GPU memory by up to 70%.")
    ]

    with open(output_file, "w", encoding="utf-8") as f:
        for user_q, lexi_a in mock_data:
            if format_type == "sharegpt":
                entry = {
                    "conversations": [
                        {"from": "system", "value": LEXI_SYSTEM_PROMPT},
                        {"from": "human", "value": user_q},
                        {"from": "gpt", "value": lexi_a}
                    ]
                }
            else:
                entry = {
                    "messages": [
                        {"role": "system", "content": LEXI_SYSTEM_PROMPT},
                        {"role": "user", "content": user_q},
                        {"role": "assistant", "content": lexi_a}
                    ]
                }
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"✅ Mock dataset saved to {output_file}")

if __name__ == "__main__":
    generate_lexi_dataset(num_samples=10, output_file="lexi_dataset.jsonl", format_type="sharegpt")
