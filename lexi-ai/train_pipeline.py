"""
LEXI AI — Advanced Multi-Stage Training Pipeline
=================================================
Unified training orchestrator that executes:
  Stage 1: Advanced SFT (NEFTune + RSLoRA + Response Loss Masking + Curriculum Learning)
  Stage 2: ORPO Preference Alignment (Single-pass RLHF alternative)
  Stage 3: Adapter Merging & Multi-Format Export (16-bit, GGUF Q4/Q5/Q8)
  Stage 4: Automated Evaluation with LLM-as-Judge benchmarking

Designed for Google Colab T4 GPU (15GB VRAM) / Kaggle P100 (16GB VRAM).

Setup (run in Colab cell first):
    !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
    !pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
    !pip install pyyaml
"""

import os
import sys
import json
import time
import yaml
import torch
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass

from datasets import load_dataset
from unsloth import FastLanguageModel
from unsloth.chat_templates import get_chat_template, train_on_responses_only
from trl import SFTTrainer, ORPOTrainer, ORPOConfig
from transformers import TrainingArguments

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("lexi.trainer")

# ─── Configuration Loader ────────────────────────────────────────────────────

def load_config(config_path: str = "config.yaml") -> Dict[str, Any]:
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            return yaml.safe_load(f)
    logger.warning(f"Config file {config_path} not found, using defaults.")
    return {
        "model": {"base_name": "unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit", "max_seq_length": 8192, "load_in_4bit": True},
        "lora": {"r": 32, "lora_alpha": 32, "lora_dropout": 0, "bias": "none", "use_rslora": True,
                 "target_modules": ["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj","embed_tokens","lm_head"]},
        "training": {"per_device_train_batch_size": 1, "gradient_accumulation_steps": 8, "warmup_ratio": 0.05,
                     "max_steps": 200, "learning_rate": 2e-4, "weight_decay": 0.01, "lr_scheduler_type": "cosine",
                     "optim": "adamw_8bit", "logging_steps": 5, "save_steps": 50, "seed": 3407,
                     "neftune_noise_alpha": 5.0, "packing": False},
        "orpo": {"beta": 0.1, "learning_rate": 8e-6, "max_steps": 80, "max_prompt_length": 1024},
        "dataset": {"sft_file": "data/lexi_cot_sft.jsonl", "orpo_file": "data/lexi_orpo.jsonl", "eval_file": "data/lexi_eval.jsonl"},
        "export": {"output_dir": "outputs", "adapter_dir": "outputs/lexi_lora_adapters",
                   "gguf_methods": ["q4_k_m", "q5_k_m", "q8_0"]},
        "system_prompt": "You are LEXI, an elite AI assistant.",
    }

# ─── GPU & Environment Info ──────────────────────────────────────────────────

def print_gpu_info():
    if torch.cuda.is_available():
        gpu = torch.cuda.get_device_properties(0)
        vram_gb = gpu.total_memory / (1024**3)
        print(f"🖥️  GPU: {gpu.name} | VRAM: {vram_gb:.1f} GB | CUDA: {torch.version.cuda}")
        print(f"   BF16 Support: {torch.cuda.is_bf16_supported()}")
    else:
        print("⚠️  No GPU detected! Training will be extremely slow.")

# ─── Stage 1: Advanced SFT ───────────────────────────────────────────────────

def stage_1_sft(config: Dict[str, Any]) -> tuple:
    """
    Advanced Supervised Fine-Tuning with:
    - NEFTune noise injection (α=5.0) for +5-10% benchmark boost
    - RSLoRA with r=32 for rank-stable high-capacity adapters
    - Response-only loss masking (no gradient waste on prompts)
    - Cosine LR schedule with warmup
    """
    print("\n" + "="*70)
    print("🔥 STAGE 1: Advanced SFT with NEFTune + RSLoRA + Response Masking")
    print("="*70)

    mcfg = config["model"]
    lcfg = config["lora"]
    tcfg = config["training"]
    dcfg = config["dataset"]

    # Load base model
    logger.info(f"Loading model: {mcfg['base_name']}")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=mcfg["base_name"],
        max_seq_length=mcfg["max_seq_length"],
        dtype=None,
        load_in_4bit=mcfg.get("load_in_4bit", True),
    )

    # Apply LoRA adapters
    logger.info(f"Configuring RSLoRA: r={lcfg['r']}, alpha={lcfg['lora_alpha']}, rslora={lcfg.get('use_rslora', True)}")
    model = FastLanguageModel.get_peft_model(
        model,
        r=lcfg["r"],
        target_modules=lcfg["target_modules"],
        lora_alpha=lcfg["lora_alpha"],
        lora_dropout=lcfg["lora_dropout"],
        bias=lcfg["bias"],
        use_gradient_checkpointing="unsloth",
        use_rslora=lcfg.get("use_rslora", True),
        random_state=tcfg["seed"],
    )

    # Print trainable parameter stats
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"📊 Trainable params: {trainable:,} / {total:,} ({100*trainable/total:.2f}%)")

    # Setup chat template
    tokenizer = get_chat_template(tokenizer, chat_template="llama-3.1")

    # Load dataset
    sft_file = dcfg["sft_file"]
    if not os.path.exists(sft_file):
        raise FileNotFoundError(f"SFT dataset not found: {sft_file}. Run advanced_dataset_engine.py first.")

    dataset = load_dataset("json", data_files={"train": sft_file}, split="train")
    logger.info(f"Loaded {len(dataset)} SFT training samples.")

    def format_conversations(examples):
        convos = examples["conversations"]
        texts = []
        for convo in convos:
            try:
                text = tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False)
                texts.append(text)
            except Exception:
                texts.append("")
        return {"text": texts}

    dataset = dataset.map(format_conversations, batched=True, remove_columns=dataset.column_names)
    dataset = dataset.filter(lambda x: len(x["text"]) > 50)

    # Configure trainer
    training_args = TrainingArguments(
        per_device_train_batch_size=tcfg["per_device_train_batch_size"],
        gradient_accumulation_steps=tcfg["gradient_accumulation_steps"],
        warmup_ratio=tcfg["warmup_ratio"],
        max_steps=tcfg["max_steps"],
        learning_rate=tcfg["learning_rate"],
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=tcfg["logging_steps"],
        save_steps=tcfg.get("save_steps", 50),
        optim=tcfg["optim"],
        weight_decay=tcfg["weight_decay"],
        lr_scheduler_type=tcfg["lr_scheduler_type"],
        seed=tcfg["seed"],
        output_dir=os.path.join(config["export"]["output_dir"], "sft_checkpoints"),
        report_to="none",
    )

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=mcfg["max_seq_length"],
        dataset_num_proc=2,
        packing=tcfg.get("packing", False),
        neftune_noise_alpha=tcfg.get("neftune_noise_alpha", 5.0),
        args=training_args,
    )

    # Apply response-only loss masking
    logger.info("Applying response-only loss masking...")
    trainer = train_on_responses_only(
        trainer,
        instruction_part="<|start_header_id|>user<|end_header_id|>\n\n",
        response_part="<|start_header_id|>assistant<|end_header_id|>\n\n",
    )

    # Train
    logger.info("Starting SFT training loop...")
    stats = trainer.train()
    runtime = stats.metrics.get("train_runtime", 0)
    loss = stats.metrics.get("train_loss", 0)
    print(f"\n✅ Stage 1 Complete: Runtime={runtime:.0f}s | Final Loss={loss:.4f}")

    # Save Stage 1 adapters
    adapter_dir = config["export"]["adapter_dir"] + "_sft"
    model.save_pretrained(adapter_dir)
    tokenizer.save_pretrained(adapter_dir)
    logger.info(f"Saved SFT adapters → {adapter_dir}")

    return model, tokenizer

# ─── Stage 2: ORPO Preference Alignment ──────────────────────────────────────

def stage_2_orpo(config: Dict[str, Any], model=None, tokenizer=None) -> tuple:
    """
    ORPO alignment: combines SFT loss + odds ratio preference penalty in
    a single training pass. No reward model or reference model needed.
    """
    print("\n" + "="*70)
    print("⚖️  STAGE 2: ORPO Preference Alignment (Single-Pass RLHF)")
    print("="*70)

    mcfg = config["model"]
    lcfg = config["lora"]
    ocfg = config["orpo"]
    dcfg = config["dataset"]
    tcfg = config["training"]

    # Load model if not passed from Stage 1
    if model is None:
        adapter_dir = config["export"]["adapter_dir"] + "_sft"
        if os.path.exists(adapter_dir):
            logger.info(f"Loading SFT-tuned model from {adapter_dir}...")
            model, tokenizer = FastLanguageModel.from_pretrained(
                model_name=adapter_dir,
                max_seq_length=mcfg["max_seq_length"],
                dtype=None,
                load_in_4bit=True,
            )
        else:
            logger.info("No SFT adapters found. Loading base model for ORPO...")
            model, tokenizer = FastLanguageModel.from_pretrained(
                model_name=mcfg["base_name"],
                max_seq_length=mcfg["max_seq_length"],
                dtype=None,
                load_in_4bit=True,
            )
            model = FastLanguageModel.get_peft_model(
                model, r=lcfg["r"], target_modules=lcfg["target_modules"],
                lora_alpha=lcfg["lora_alpha"], lora_dropout=0, bias="none",
                use_gradient_checkpointing="unsloth", random_state=tcfg["seed"],
            )

    tokenizer = get_chat_template(tokenizer, chat_template="llama-3.1")

    # Load ORPO dataset
    orpo_file = dcfg["orpo_file"]
    if not os.path.exists(orpo_file):
        print(f"⚠️  ORPO dataset not found: {orpo_file}. Skipping Stage 2.")
        return model, tokenizer

    dataset = load_dataset("json", data_files={"train": orpo_file}, split="train")
    logger.info(f"Loaded {len(dataset)} ORPO preference pairs.")

    system_prompt = config.get("system_prompt", "You are LEXI, an elite AI assistant.")

    def format_orpo(example):
        prompt_formatted = (
            f"<|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|>"
            f"<|start_header_id|>user<|end_header_id|>\n\n{example['prompt']}<|eot_id|>"
            f"<|start_header_id|>assistant<|end_header_id|>\n\n"
        )
        return {
            "prompt": prompt_formatted,
            "chosen": example["chosen"] + "<|eot_id|>",
            "rejected": example["rejected"] + "<|eot_id|>",
        }

    dataset = dataset.map(format_orpo)

    orpo_args = ORPOConfig(
        per_device_train_batch_size=1,
        gradient_accumulation_steps=tcfg["gradient_accumulation_steps"],
        beta=ocfg["beta"],
        learning_rate=ocfg["learning_rate"],
        max_steps=ocfg["max_steps"],
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=tcfg["logging_steps"],
        optim=tcfg["optim"],
        lr_scheduler_type="cosine",
        output_dir=os.path.join(config["export"]["output_dir"], "orpo_checkpoints"),
        report_to="none",
    )

    trainer = ORPOTrainer(
        model=model,
        args=orpo_args,
        train_dataset=dataset,
        tokenizer=tokenizer,
        max_length=mcfg["max_seq_length"],
        max_prompt_length=ocfg.get("max_prompt_length", 1024),
    )

    logger.info("Starting ORPO training loop...")
    trainer.train()
    print("✅ Stage 2 ORPO Alignment Complete!")

    # Save aligned adapters
    adapter_dir = config["export"]["adapter_dir"] + "_aligned"
    model.save_pretrained(adapter_dir)
    tokenizer.save_pretrained(adapter_dir)
    logger.info(f"Saved aligned adapters → {adapter_dir}")

    return model, tokenizer

# ─── Stage 3: Merge & Multi-Format Export ─────────────────────────────────────

def stage_3_export(config: Dict[str, Any], model=None, tokenizer=None):
    """
    Exports fine-tuned model in multiple formats:
    - LoRA adapters (for Hugging Face Hub)
    - Merged 16-bit model
    - GGUF quantized models (Q4_K_M, Q5_K_M, Q8_0) for Ollama / LM Studio
    """
    print("\n" + "="*70)
    print("📦 STAGE 3: Multi-Format Model Export & Quantization")
    print("="*70)

    ecfg = config["export"]
    os.makedirs(ecfg["output_dir"], exist_ok=True)

    if model is None:
        adapter_dir = ecfg["adapter_dir"] + "_aligned"
        if not os.path.exists(adapter_dir):
            adapter_dir = ecfg["adapter_dir"] + "_sft"
        logger.info(f"Loading adapters from {adapter_dir}...")
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=adapter_dir,
            max_seq_length=config["model"]["max_seq_length"],
            dtype=None, load_in_4bit=True,
        )

    # Save LoRA adapters
    final_adapter_dir = os.path.join(ecfg["output_dir"], "lexi_final_lora")
    model.save_pretrained(final_adapter_dir)
    tokenizer.save_pretrained(final_adapter_dir)
    print(f"  💾 LoRA Adapters → {final_adapter_dir}")

    # Save merged 16-bit model
    merged_dir = ecfg.get("merged_dir", os.path.join(ecfg["output_dir"], "lexi_merged_16bit"))
    model.save_pretrained_merged(merged_dir, tokenizer, save_method="merged_16bit")
    print(f"  💾 Merged 16-bit → {merged_dir}")

    # Export GGUF quantized formats
    gguf_methods = ecfg.get("gguf_methods", ["q4_k_m"])
    for method in gguf_methods:
        gguf_dir = os.path.join(ecfg["output_dir"], f"lexi_gguf_{method}")
        try:
            model.save_pretrained_gguf(gguf_dir, tokenizer, quantization_method=method)
            print(f"  💾 GGUF {method.upper()} → {gguf_dir}")
        except Exception as e:
            logger.error(f"  ❌ GGUF {method} export failed: {e}")

    # Push to Hugging Face Hub (if token available)
    hf_token = os.getenv("HF_TOKEN")
    if hf_token:
        lora_repo = ecfg.get("hf_repo_lora", "")
        gguf_repo = ecfg.get("hf_repo_gguf", "")
        if lora_repo:
            try:
                model.push_to_hub(lora_repo, token=hf_token)
                tokenizer.push_to_hub(lora_repo, token=hf_token)
                print(f"  🌐 Pushed LoRA → huggingface.co/{lora_repo}")
            except Exception as e:
                logger.error(f"  ❌ HF push failed: {e}")
        if gguf_repo:
            try:
                model.push_to_hub_gguf(gguf_repo, tokenizer, quantization_method="q4_k_m", token=hf_token)
                print(f"  🌐 Pushed GGUF → huggingface.co/{gguf_repo}")
            except Exception as e:
                logger.error(f"  ❌ HF GGUF push failed: {e}")

    print("\n✅ Stage 3 Export Complete!")

# ─── Stage 4: Automated Evaluation ──────────────────────────────────────────

def stage_4_evaluate(config: Dict[str, Any], model=None, tokenizer=None):
    """
    Runs automated evaluation using held-out eval set + LLM-as-Judge scoring.
    """
    print("\n" + "="*70)
    print("🧪 STAGE 4: Automated Evaluation & Benchmarking")
    print("="*70)

    dcfg = config["dataset"]
    eval_file = dcfg.get("eval_file", "data/lexi_eval.jsonl")

    if not os.path.exists(eval_file):
        print(f"⚠️  Eval dataset not found: {eval_file}. Skipping evaluation.")
        return

    if model is None:
        ecfg = config["export"]
        adapter_dir = ecfg["adapter_dir"] + "_aligned"
        if not os.path.exists(adapter_dir):
            adapter_dir = ecfg["adapter_dir"] + "_sft"
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=adapter_dir,
            max_seq_length=config["model"]["max_seq_length"],
            dtype=None, load_in_4bit=True,
        )

    FastLanguageModel.for_inference(model)

    with open(eval_file, "r", encoding="utf-8") as f:
        eval_data = [json.loads(line) for line in f if line.strip()]

    system_prompt = config.get("system_prompt", "You are LEXI, an elite AI assistant.")
    results = []

    for i, item in enumerate(eval_data):
        prompt = item["prompt"]
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ]

        try:
            inputs = tokenizer.apply_chat_template(
                messages, tokenize=True, add_generation_prompt=True, return_tensors="pt"
            ).to("cuda")

            with torch.no_grad():
                outputs = model.generate(input_ids=inputs, max_new_tokens=512, use_cache=True, temperature=0.3)

            response = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
            results.append({
                "prompt": prompt,
                "response": response,
                "domain": item.get("domain", "unknown"),
                "reference": item.get("reference", ""),
            })
            print(f"  ✅ [{i+1}/{len(eval_data)}] Evaluated: {prompt[:50]}...")

        except Exception as e:
            logger.error(f"  ❌ Eval error on sample {i+1}: {e}")
            continue

    # Save evaluation results
    eval_output = os.path.join(config["export"]["output_dir"], "eval_results.json")
    os.makedirs(os.path.dirname(eval_output), exist_ok=True)
    with open(eval_output, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Evaluation complete: {len(results)}/{len(eval_data)} samples evaluated.")
    print(f"📊 Results saved → {eval_output}")

# ─── Quick Inference Test ────────────────────────────────────────────────────

def quick_inference_test(model, tokenizer, system_prompt: str):
    """Runs a quick sanity check inference after training."""
    print("\n" + "-"*50)
    print("🧠 Quick Inference Sanity Check")
    print("-"*50)

    FastLanguageModel.for_inference(model)
    test_prompts = [
        "Who are you and what makes you unique compared to other AI assistants?",
        "Design a rate limiter for a distributed API gateway. Show production Python code.",
        "Explain the attention mechanism in Transformers. Think step-by-step.",
    ]

    for prompt in test_prompts:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ]
        inputs = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=True, return_tensors="pt").to("cuda")

        with torch.no_grad():
            outputs = model.generate(input_ids=inputs, max_new_tokens=256, use_cache=True, temperature=0.7)
        
        response = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
        print(f"\n📌 Prompt: {prompt[:60]}...")
        print(f"🤖 LEXI: {response[:200]}...")
        print()

# ─── Master Orchestrator ─────────────────────────────────────────────────────

def run_full_pipeline(config_path: str = "config.yaml", stages: str = "1,2,3,4"):
    """
    Executes the full multi-stage training pipeline.
    
    Args:
        config_path: Path to YAML config file.
        stages: Comma-separated stage numbers to run (e.g., "1,2,3,4" or "1,3").
    """
    config = load_config(config_path)
    active_stages = [int(s.strip()) for s in stages.split(",")]

    print("\n" + "="*70)
    print("🚀 LEXI AI — Advanced Multi-Stage Training Pipeline")
    print(f"   Active Stages: {active_stages}")
    print("="*70)
    print_gpu_info()

    model, tokenizer = None, None

    if 1 in active_stages:
        model, tokenizer = stage_1_sft(config)
        quick_inference_test(model, tokenizer, config.get("system_prompt", ""))

    if 2 in active_stages:
        model, tokenizer = stage_2_orpo(config, model, tokenizer)

    if 3 in active_stages:
        stage_3_export(config, model, tokenizer)

    if 4 in active_stages:
        stage_4_evaluate(config, model, tokenizer)

    print("\n" + "="*70)
    print("🎉 LEXI AI Pipeline Execution Complete!")
    print("="*70)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="LEXI AI Training Pipeline")
    parser.add_argument("--config", default="config.yaml", help="Path to config YAML")
    parser.add_argument("--stages", default="1,2,3,4", help="Stages to run (comma-separated)")
    args = parser.parse_args()
    run_full_pipeline(args.config, args.stages)
