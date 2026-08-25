"""
LEXI AI — Hugging Face Spaces Deployment (Gradio UI + API)
===========================================================
Single-file Gradio app for free deployment on Hugging Face Spaces.
Features:
  • Chat UI with conversation history
  • Multi-provider backend via ProviderHub
  • System prompt customization
  • Copy-paste-ready OpenAI-compatible API via /api/predict
  
Deployment:
  1. Create a new Space on huggingface.co/spaces (SDK: Gradio)
  2. Upload this file as app.py + providers.py
  3. Set secrets: GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY
  4. Done! Free serverless hosting with auto-sleep.
"""

import os
import time
import gradio as gr
from providers import ProviderHub, generate_sync

LEXI_SYSTEM = os.getenv("LEXI_SYSTEM_PROMPT", (
    "You are LEXI, an elite AI assistant engineered for extreme precision, deep multi-step "
    "reasoning, and production-grade code generation. You think step-by-step inside <thought> "
    "tags before delivering flawless, structured answers."
))

hub = ProviderHub()

def chat_with_lexi(message: str, history: list, system_prompt: str, temperature: float):
    """Gradio chat handler with conversation history."""
    messages = [{"role": "system", "content": system_prompt or LEXI_SYSTEM}]
    
    # Add conversation history
    for user_msg, bot_msg in history:
        if user_msg:
            messages.append({"role": "user", "content": user_msg})
        if bot_msg:
            messages.append({"role": "assistant", "content": bot_msg})
    
    messages.append({"role": "user", "content": message})

    try:
        import asyncio
        loop = asyncio.new_event_loop()
        result = loop.run_until_complete(
            hub.generate(messages=messages, temperature=temperature, max_tokens=1500)
        )
        loop.close()

        response = result.text
        provider_tag = f"\n\n---\n*Provider: {result.provider} | Model: {result.model} | Latency: {result.latency_ms:.0f}ms*"
        return response + provider_tag

    except Exception as e:
        return f"⚠️ Error: {str(e)}\n\nConfigured providers: {hub.available_providers}"

# ─── Gradio UI ────────────────────────────────────────────────────────────────

TITLE = "🤖 LEXI AI — Elite AI Assistant"
DESCRIPTION = """
**LEXI** is a state-of-the-art AI assistant powered by free-tier APIs (Groq, Gemini 2.0, OpenRouter, HuggingFace).
It features multi-step reasoning with `<thought>` tags, production-grade code generation, and zero fluff.

**Available Providers:** """ + ", ".join(hub.available_providers) if hub.available_providers else "No API keys configured"

CSS = """
.gradio-container { max-width: 900px !important; }
footer { display: none !important; }
"""

with gr.Blocks(css=CSS, title="LEXI AI", theme=gr.themes.Soft()) as demo:
    gr.Markdown(f"# {TITLE}")
    gr.Markdown(DESCRIPTION)

    with gr.Row():
        with gr.Column(scale=4):
            chatbot = gr.Chatbot(
                label="LEXI AI Chat",
                height=500,
                show_copy_button=True,
                bubble_full_width=False,
            )
            msg = gr.Textbox(
                label="Your message",
                placeholder="Ask LEXI anything... (code, architecture, debugging, ML)",
                lines=2,
                max_lines=5,
            )
            with gr.Row():
                submit_btn = gr.Button("🚀 Send", variant="primary", scale=3)
                clear_btn = gr.Button("🗑️ Clear", scale=1)

        with gr.Column(scale=1):
            system_prompt = gr.Textbox(
                label="System Prompt",
                value=LEXI_SYSTEM,
                lines=6,
                max_lines=10,
            )
            temperature = gr.Slider(
                minimum=0.0, maximum=1.5, value=0.7, step=0.1,
                label="Temperature",
            )
            gr.Markdown("### 📊 Provider Status")
            health_display = gr.JSON(value=hub.health_report, label="Health")
            refresh_btn = gr.Button("🔄 Refresh Status")

    def respond(message, history, sys_prompt, temp):
        response = chat_with_lexi(message, history, sys_prompt, temp)
        history.append((message, response))
        return "", history

    def refresh_health():
        return hub.health_report

    msg.submit(respond, [msg, chatbot, system_prompt, temperature], [msg, chatbot])
    submit_btn.click(respond, [msg, chatbot, system_prompt, temperature], [msg, chatbot])
    clear_btn.click(lambda: ([], ""), None, [chatbot, msg])
    refresh_btn.click(refresh_health, None, health_display)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, share=False)
