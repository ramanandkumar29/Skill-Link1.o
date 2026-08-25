"""
LEXI AI Fine-Tuning Script
---------------------------
Designed to run on Google Colab Free Tier (T4 GPU - 15GB VRAM) or Kaggle P100/T4.
Uses Unsloth + QLoRA for 2x faster training and 60% less memory consumption.

Instructions for Google Colab:
1. Change Runtime -> T4 GPU.
2. Install Unsloth:
   !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
   !pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
3. Execute this script!
"""

import os
import torch
from datasets import load_dataset
from unsloth import FastLanguageModel
from unsloth.chat_templates import get_chat_template
from trl import SFTTrainer
from transformers import TrainingArguments

# Configuration Settings
MAX_SEQ_LENGTH = 2048
MODEL_NAME = "unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit" # Pre-quantized 4-bit base
DATASET_PATH = "lexi_dataset.jsonl"
HF_TOKEN = os.getenv("HF_TOKEN", "") # HuggingFace Token for pushing weights
OUTPUT_DIR = "lexi_ai_outputs"

def train_lexi_model():
    print("🚀 Initializing Unsloth FastLanguageModel...")
    
    # 1. Load Base Model in 4-bit Precision (Fits inside Colab 15GB VRAM)
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = MODEL_NAME,
        max_seq_length = MAX_SEQ_LENGTH,
        dtype = None, # Automatic detection (float16 for T4, bfloat16 for Ampere+)
        load_in_4bit = True,
    )

    # 2. Add LoRA Adapters for Parameter-Efficient Fine-Tuning
    print("⚡ Configuring QLoRA Adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r = 16, # Rank (Options: 8, 16, 32, 64)
        target_modules = [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ],
        lora_alpha = 16,
        lora_dropout = 0, # Optimized 0 dropout for Unsloth kernels
        bias = "none",
        use_gradient_checkpointing = "unsloth", # Reduces VRAM footprint drastically
        random_state = 3407,
    )

    # 3. Setup Llama-3.1 Chat Template
    tokenizer = get_chat_template(
        tokenizer,
        chat_template = "llama-3.1",
    )

    # 4. Load & Prepare Dataset
    print(f"📥 Loading dataset from {DATASET_PATH}...")
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset file '{DATASET_PATH}' not found. Please run dataset_prep.py first.")

    dataset = load_dataset("json", data_files={"train": DATASET_PATH}, split="train")

    def formatting_prompts_func(examples):
        convos = examples["conversations"]
        texts = [tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False) for convo in convos]
        return { "text" : texts }

    dataset = dataset.map(formatting_prompts_func, batched = True)

    # 5. Configure Trainer
    print("🏋️ Setting up SFTTrainer...")
    trainer = SFTTrainer(
        model = model,
        tokenizer = tokenizer,
        train_dataset = dataset,
        dataset_text_field = "text",
        max_seq_length = MAX_SEQ_LENGTH,
        dataset_num_proc = 2,
        packing = False, # Can set to True for larger datasets to speed up training
        args = TrainingArguments(
            per_device_train_batch_size = 2,
            gradient_accumulation_steps = 4, # Effective batch size = 8
            warmup_steps = 5,
            max_steps = 60, # Increase for full fine-tuning (e.g. 300-1000)
            learning_rate = 2e-4,
            fp16 = not torch.cuda.is_bf16_supported(),
            bf16 = torch.cuda.is_bf16_supported(),
            logging_steps = 10,
            optim = "adamw_8bit",
            weight_decay = 0.01,
            lr_scheduler_type = "linear",
            seed = 3407,
            output_dir = OUTPUT_DIR,
        ),
    )

    # 6. Execute Fine-Tuning
    print("🔥 Starting Training Loop...")
    trainer_stats = trainer.train()
    print(f"✅ Training completed in {trainer_stats.metrics['train_runtime']:.2f} seconds!")

    # 7. Test Inference
    print("\n🧠 Testing Fine-Tuned LEXI AI Response...")
    FastLanguageModel.for_inference(model)
    messages = [
        {"role": "system", "content": "You are LEXI, an elite AI assistant."},
        {"role": "user", "content": "Who are you and what makes you unique?"}
    ]
    inputs = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=True, return_tensors="pt").to("cuda")
    outputs = model.generate(input_ids=inputs, max_new_tokens=128, use_cache=True)
    response = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
    print(f"\n[LEXI Response]:\n{response}\n")

    # 8. Export Options
    print("💾 Saving fine-tuned LoRA Adapters...")
    model.save_pretrained("lexi_ai_lora")
    tokenizer.save_pretrained("lexi_ai_lora")

    if HF_TOKEN:
        print("Uploading LoRA adapters & GGUF quantized models to Hugging Face...")
        # Push LoRA Adapters
        model.push_to_hub("username/lexi-ai-8b-lora", token=HF_TOKEN)
        # Push GGUF 4-bit for local Ollama / LM Studio inference
        model.push_to_hub_gguf("username/lexi-ai-8b-gguf", tokenizer, quantization_method="q4_k_m", token=HF_TOKEN)
        print("✅ Models successfully uploaded to Hugging Face Hub!")

if __name__ == "__main__":
    train_lexi_model()
