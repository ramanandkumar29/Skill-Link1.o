# 🤖 LEXI AI — Production ML Pipeline

> **End-to-end AI assistant: dataset forging → fine-tuning → quantization → deployment. 100% free-tier.**

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set your free API keys
cp .env.example .env
# Edit .env with at least one key (Groq or Gemini)

# 3. Generate training data
python advanced_dataset_engine.py

# 4. Fine-tune on Google Colab T4 GPU
# Upload train_pipeline.py + data/ folder to Colab
python train_pipeline.py --stages 1,2,3,4

# 5. Deploy locally
python app.py

# 6. Or deploy Gradio UI to Hugging Face Spaces
python gradio_app.py
```

---

## 📁 Project Structure

```
lexi-ai/
├── config.yaml                  # Central YAML config for all pipeline stages
├── .env.example                 # API key template
├── requirements.txt             # Python dependencies
│
├── providers.py                 # Multi-provider inference hub (Groq/Gemini/OpenRouter/HF/Local)
├── advanced_dataset_engine.py   # Synthetic data forge (CoT, ORPO, Multi-turn, Evol-Instruct)
├── train_pipeline.py            # 4-stage training orchestrator (SFT → ORPO → Export → Eval)
├── evaluate.py                  # LLM-as-Judge evaluation & benchmarking suite
│
├── app.py                       # FastAPI production server (streaming, cache, rate limit)
├── gradio_app.py                # Hugging Face Spaces Gradio deployment
├── lexi_client.py               # Python SDK client
│
├── data/                        # Generated datasets (auto-created)
│   ├── lexi_cot_sft.jsonl
│   ├── lexi_orpo.jsonl
│   └── lexi_eval.jsonl
│
└── outputs/                     # Training outputs (auto-created)
    ├── lexi_lora_adapters_sft/
    ├── lexi_lora_adapters_aligned/
    ├── lexi_merged_16bit/
    ├── lexi_gguf_q4_k_m/
    └── eval/
```

---

## 🔑 Free API Keys (Get All 4)

| Provider | Signup | Free Tier |
| :--- | :--- | :--- |
| **Groq** | [console.groq.com](https://console.groq.com) | 30 RPM, Llama 3.1 70B |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/apikey) | 15 RPM, 1M tokens/min |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | Free Llama 3.1 8B |
| **HuggingFace** | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) | Free serverless inference |

---

## 🏗️ Pipeline Stages

### Stage 1: Advanced SFT (NEFTune + RSLoRA + Response Masking)
### Stage 2: ORPO Preference Alignment (Single-Pass RLHF)
### Stage 3: Multi-Format Export (LoRA / 16-bit / GGUF Q4/Q5/Q8)
### Stage 4: Automated Evaluation (LLM-as-Judge + Win-Rate)

Run all stages:
```bash
python train_pipeline.py --stages 1,2,3,4
```

Run specific stages:
```bash
python train_pipeline.py --stages 1,3  # SFT + Export only
```
