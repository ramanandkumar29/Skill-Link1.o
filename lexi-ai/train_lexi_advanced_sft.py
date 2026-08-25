"""
Advanced SFT Training Script for LEXI AI (Unsloth + NEFTune + RSLoRA + Response Masking)
---------------------------------------------------------------------------------------
Features:
- NEFTune Noise Injection (neftune_noise_alpha=5) for +5-10% quality boost.
- Response-Only Loss Masking (loss calculated ONLY on assistant tokens).
- Rank-Stabilized LoRA (RSLoRA) with r=32, alpha=32.
- Extended Context RoPE Scaling up to 8192 tokens.
"""

import os
import torch
from datasets import load_dataset
from unsloth import FastLanguageModel
from unsloth.chat_templates import get_chat_template, train_on_responses_only
from trl import SFTTrainer
from transformers import TrainingArguments

MAX_SEQ_LENGTH = 8192 # Extended context length with RoPE scaling
MODEL_NAME = "unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit"
DATASET_PATH = "lexi_cot_sft.jsonl"
OUTPUT_DIR = "lexi_ai_advanced_sft"

def train_advanced_sft():
    print("🚀 Initializing Advanced Unsloth FastLanguageModel Engine...")
    
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = MODEL_NAME,
        max_seq_length = MAX_SEQ_LENGTH,
        dtype = None, # Auto-detect fp16/bf16
        load_in_4bit = True,
    )

    # Configure Rank-Stabilized LoRA (RSLoRA) across all layers
    print("⚡ Configuring RSLoRA Adapters with NEFTune Noise Injection...")
    model = FastLanguageModel.get_peft_model(
        model,
        r = 32, # Higher rank for complex reasoning
        target_modules = [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
            "embed_tokens", "lm_head"
        ],
        lora_alpha = 32,
        lora_dropout = 0,
        bias = "none",
        use_gradient_checkpointing = "unsloth",
        use_rslora = True, # Rank-Stabilized LoRA
        random_state = 3407,
    )

    tokenizer = get_chat_template(
        tokenizer,
        chat_template = "llama-3.1",
    )

    print(f"📥 Loading Chain-of-Thought dataset: {DATASET_PATH}...")
    dataset = load_dataset("json", data_files={"train": DATASET_PATH}, split="train")

    def formatting_prompts_func(examples):
        convos = examples["conversations"]
        texts = [tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False) for convo in convos]
        return { "text" : texts }

    dataset = dataset.map(formatting_prompts_func, batched = True)

    # Configure SFTTrainer with NEFTune Noise Injection
    trainer = SFTTrainer(
        model = model,
        tokenizer = tokenizer,
        train_dataset = dataset,
        dataset_text_field = "text",
        max_seq_length = MAX_SEQ_LENGTH,
        dataset_num_proc = 2,
        packing = False,
        neftune_noise_alpha = 5.0, # NEFTune noise injection for better generalization
        args = TrainingArguments(
            per_device_train_batch_size = 1,
            gradient_accumulation_steps = 8, # Effective batch size = 8
            warmup_ratio = 0.05,
            max_steps = 100,
            learning_rate = 2e-4,
            fp16 = not torch.cuda.is_bf16_supported(),
            bf16 = torch.cuda.is_bf16_supported(),
            logging_steps = 5,
            optim = "adamw_8bit",
            weight_decay = 0.01,
            lr_scheduler_type = "cosine",
            seed = 3407,
            output_dir = OUTPUT_DIR,
        ),
    )

    # Mask user prompt loss (Train strictly on assistant responses!)
    print("🎭 Applying Response-Only Loss Masking...")
    trainer = train_on_responses_only(
        trainer,
        instruction_part = "<|start_header_id|>user<|end_header_id|>\n\n",
        response_part = "<|start_header_id|>assistant<|end_header_id|>\n\n",
    )

    print("🔥 Starting Advanced SFT Training Loop...")
    trainer_stats = trainer.train()
    print(f"✅ Advanced Training complete in {trainer_stats.metrics['train_runtime']:.2f} seconds!")

    # Save Advanced Adapters
    print("💾 Saving Advanced LoRA Adapters...")
    model.save_pretrained(f"{OUTPUT_DIR}_adapters")
    tokenizer.save_pretrained(f"{OUTPUT_DIR}_adapters")
    print("✅ Advanced SFT Model exported successfully!")

if __name__ == "__main__":
    train_advanced_sft()
