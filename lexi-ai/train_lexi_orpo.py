"""
ORPO (Odds Ratio Preference Optimization) Alignment Script for LEXI AI
-----------------------------------------------------------------------
Eliminates the need for separate Reward and Reference models.
Performs SFT + Preference Alignment in a single pass on Colab T4 GPU (15GB VRAM).
"""

import os
import torch
from datasets import load_dataset
from unsloth import FastLanguageModel
from trl import ORPOTrainer, ORPOConfig
from unsloth.chat_templates import get_chat_template

MAX_SEQ_LENGTH = 4096
MODEL_NAME = "unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit"
DATASET_PATH = "lexi_orpo.jsonl"
OUTPUT_DIR = "lexi_ai_orpo_aligned"

def train_orpo_alignment():
    print("🚀 Initializing ORPO Alignment Engine with Unsloth...")

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = MODEL_NAME,
        max_seq_length = MAX_SEQ_LENGTH,
        dtype = None,
        load_in_4bit = True,
    )

    model = FastLanguageModel.get_peft_model(
        model,
        r = 16,
        target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_alpha = 16,
        lora_dropout = 0,
        bias = "none",
        use_gradient_checkpointing = "unsloth",
        random_state = 3407,
    )

    tokenizer = get_chat_template(
        tokenizer,
        chat_template = "llama-3.1",
    )

    print(f"📥 Loading ORPO dataset from {DATASET_PATH}...")
    dataset = load_dataset("json", data_files={"train": DATASET_PATH}, split="train")

    def format_orpo_samples(example):
        formatted_prompt = f"<|start_header_id|>system<|end_header_id|>\n\nYou are LEXI, an elite AI assistant.<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{example['prompt']}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
        return {
            "prompt": formatted_prompt,
            "chosen": example["chosen"] + "<|eot_id|>",
            "rejected": example["rejected"] + "<|eot_id|>"
        }

    dataset = dataset.map(format_orpo_samples)

    # Configure ORPOTrainer
    orpo_args = ORPOConfig(
        per_device_train_batch_size = 1,
        gradient_accumulation_steps = 8,
        beta = 0.1, # Odds ratio penalty weight
        learning_rate = 8e-6, # Lower LR for preference tuning
        max_steps = 60,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 5,
        optim = "adamw_8bit",
        lr_scheduler_type = "cosine",
        output_dir = OUTPUT_DIR,
    )

    trainer = ORPOTrainer(
        model = model,
        args = orpo_args,
        train_dataset = dataset,
        tokenizer = tokenizer,
        max_length = MAX_SEQ_LENGTH,
        max_prompt_length = 1024,
    )

    print("🔥 Starting ORPO Preference Alignment...")
    trainer.train()
    print("✅ ORPO Alignment Completed Successfully!")

    # Save Aligned Model
    model.save_pretrained(f"{OUTPUT_DIR}_final")
    tokenizer.save_pretrained(f"{OUTPUT_DIR}_final")
    print(f"💾 Aligned model saved to {OUTPUT_DIR}_final")

if __name__ == "__main__":
    train_orpo_alignment()
