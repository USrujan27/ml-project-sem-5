#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
  AI RUNTIME GOVERNOR — PRODUCTION INFERENCE ENGINE (STANDALONE MODULE)
  Zero training re-execution, sub-millisecond latency, strict context validation.
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List, Optional
from bma import BayesianModelAveragingClassifier

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, 'saved_models')

# ── PRICING & CONTEXT LIMITS PER MODEL TIER ──────────────────────────────────
TIER_SPECS = {
    'Small': {
        'rate_per_1k': 0.0012,     # ₹ per 1K tokens
        'context_limit': 8192,     # 8K context window (e.g. Llama-3-8B / Gemma-2B)
        'description': 'Edge/Distilled Fast Model'
    },
    'Medium': {
        'rate_per_1k': 0.0080,     # ₹ per 1K tokens
        'context_limit': 32768,    # 32K context window (e.g. GPT-4o-mini / Claude 3.5 Haiku)
        'description': 'Balanced General Reasoning Model'
    },
    'Large': {
        'rate_per_1k': 0.0350,     # ₹ per 1K tokens
        'context_limit': 128000,   # 128K context window (e.g. GPT-4o / Claude 3.5 Sonnet)
        'description': 'Frontier Reasoning Model'
    }
}

SYSTEM_MAX_CONTEXT = 128000

TASK_TYPE_MAP = {
    'Classification': 0, 'QA': 1, 'Summary': 2, 'Extraction': 3,
    'Reasoning': 4, 'Code': 5, 'Coding': 5, 'Creative': 6, 'Agentic': 6,
    'Analysis': 7
}

DIFFICULTY_MAP = {'Easy': 0, 'Medium': 1, 'Hard': 2}

MODEL_REGISTRY = {
    'decision_tree': ('decision_tree.joblib', 'Decision Tree (Baseline)'),
    'random_forest': ('random_forest.joblib', 'Random Forest'),
    'extra_trees': ('extra_trees.joblib', 'Extra Trees'),
    'adaboost': ('adaboost.joblib', 'AdaBoost'),
    'gradient_boosting': ('gradient_boosting.joblib', 'Gradient Boosting'),
    'voting': ('soft_voting.joblib', 'Soft Voting Classifier'),
    'soft_voting': ('soft_voting.joblib', 'Soft Voting Classifier'),
    'bma': ('bayesian_model_averaging.joblib', 'Bayesian Model Averaging'),
    'bayesian_model_averaging': ('bayesian_model_averaging.joblib', 'Bayesian Model Averaging'),
    'stacking': ('stacking.joblib', 'Stacking Classifier'),
    'best': ('best_ensemble_model.joblib', 'Best Ensemble Model (Random Forest)'),
    'ensemble': ('best_ensemble_model.joblib', 'Best Ensemble Model (Random Forest)'),
}


# ── CONTEXT & INPUT VALIDATION ───────────────────────────────────────────────
def validate_task_context(
    text: Optional[str],
    task_type: str,
    difficulty: str,
    output_tokens: int,
    latency: float
) -> Tuple[List[str], int, int, str, str]:
    """
    Validates input tokens, output tokens, combined context length,
    and taxonomy constraints.
    Returns: (errors_list, input_tokens, output_tokens, normalized_type, normalized_diff)
    """
    errors = []
    est_in_tokens = 0

    # 1. Text & Input Tokens
    if text is None or not str(text).strip():
        errors.append("Input prompt text cannot be empty.")
    else:
        words = str(text).split()
        est_in_tokens = int(len(words) * 1.35) + 14
        if est_in_tokens <= 0:
            errors.append(f"Computed input tokens must be positive, got: {est_in_tokens}")
        elif est_in_tokens > SYSTEM_MAX_CONTEXT:
            errors.append(f"Input tokens ({est_in_tokens}) exceed system context ceiling ({SYSTEM_MAX_CONTEXT} tokens).")

    # 2. Output Tokens
    if output_tokens is None or not isinstance(output_tokens, int):
        errors.append(f"Output tokens must be an integer, got: {type(output_tokens).__name__}")
    elif output_tokens <= 0:
        errors.append(f"Output tokens must be positive (> 0), got: {output_tokens}")
    elif output_tokens > SYSTEM_MAX_CONTEXT:
        errors.append(f"Output tokens ({output_tokens}) exceed system context ceiling ({SYSTEM_MAX_CONTEXT} tokens).")

    # 3. Combined Context Length
    combined_tokens = est_in_tokens + (output_tokens if isinstance(output_tokens, int) and output_tokens > 0 else 0)
    if combined_tokens > SYSTEM_MAX_CONTEXT:
        errors.append(
            f"Combined context length ({combined_tokens} tokens = {est_in_tokens} input + {output_tokens} output) "
            f"exceeds maximum frontier context limit ({SYSTEM_MAX_CONTEXT} tokens)."
        )

    # 4. Latency
    if latency is None or not isinstance(latency, (int, float)):
        errors.append(f"Latency must be a numeric value, got: {type(latency).__name__}")
    elif latency <= 0:
        errors.append(f"Latency must be positive (> 0.0s), got: {latency}s")
    elif latency > 300.0:
        errors.append(f"Latency ({latency}s) exceeds API timeout limit of 300.0s.")

    # 5. Task Type Normalization
    norm_type = None
    if task_type:
        for k in TASK_TYPE_MAP:
            if str(task_type).strip().lower() == k.lower():
                norm_type = 'Code' if k in ['Coding', 'Code'] else ('Agentic' if k in ['Agentic', 'Creative'] else k)
                break
    if norm_type is None:
        valid_types = sorted(list(set(TASK_TYPE_MAP.keys())))
        errors.append(f"Invalid task type '{task_type}'. Valid choices: {', '.join(valid_types)}")

    # 6. Difficulty Normalization
    norm_diff = None
    if difficulty:
        for k in DIFFICULTY_MAP:
            if str(difficulty).strip().lower() == k.lower():
                norm_diff = k
                break
    if norm_diff is None:
        valid_diffs = list(DIFFICULTY_MAP.keys())
        errors.append(f"Invalid difficulty '{difficulty}'. Valid choices: {', '.join(valid_diffs)}")

    return errors, est_in_tokens, (output_tokens if isinstance(output_tokens, int) else 0), norm_type or 'Summary', norm_diff or 'Easy'


# ── STANDALONE K-MEANS INFERENCE ─────────────────────────────────────────────
def predict_kmeans_standalone(input_tokens: int, output_tokens: int, latency: float, task_type: str, difficulty: str) -> Dict[str, Any]:
    """
    Sub-millisecond K-Means inference loading pre-saved centroids and scaling vectors.
    Zero re-execution of run_ml_pipeline.py.
    """
    params_file = os.path.join(SAVED_MODELS_DIR, 'kmeans_params.json')
    if not os.path.exists(params_file):
        raise FileNotFoundError(f"K-Means parameters file '{params_file}' missing. Run run_ml_pipeline.py once to generate.")

    with open(params_file, 'r') as f:
        params = json.load(f)

    centroids = params['centroids']
    means = params['means']
    stds = params['stds']
    cluster_map = {int(k): v for k, v in params['cluster_map'].items()}

    diff_val = DIFFICULTY_MAP.get(difficulty, 0)
    type_val = TASK_TYPE_MAP.get(task_type, 0)
    feat = [float(input_tokens), float(output_tokens), float(latency), float(type_val), float(diff_val)]

    scaled = [(feat[j] - means[j]) / stds[j] for j in range(5)]
    dists = [sum((scaled[j] - c[j])**2 for j in range(5)) for c in centroids]
    chosen_c = dists.index(min(dists))
    assigned_tier = cluster_map[chosen_c]

    tot_tokens = input_tokens + output_tokens
    cost_assigned = (tot_tokens / 1000.0) * TIER_SPECS[assigned_tier]['rate_per_1k']
    cost_large_eq = (tot_tokens / 1000.0) * TIER_SPECS['Large']['rate_per_1k']
    savings = max(0.0, cost_large_eq - cost_assigned)
    sav_pct = (savings / cost_large_eq) * 100.0 if cost_large_eq > 0 else 0.0

    return {
        'model_name': 'K-Means Cluster Governor (Centroid Euclidean Mapping)',
        'assigned_cluster': chosen_c,
        'assigned_model': assigned_tier,
        'predicted_tier': assigned_tier,
        'scaled_features': [round(x, 4) for x in scaled],
        'distances_to_centroids': [round(d, 4) for d in dists],
        'cost_governor': round(cost_assigned, 6),
        'cost_baseline': round(cost_large_eq, 6),
        'cost_large': round(cost_large_eq, 6),
        'savings_rupees': round(savings, 6),
        'savings_percent': round(sav_pct, 2)
    }


# ── STANDALONE ENSEMBLE INFERENCE ────────────────────────────────────────────
def predict_ensemble_standalone(
    model_key: str,
    input_tokens: int,
    output_tokens: int,
    latency: float,
    task_type: str,
    difficulty: str
) -> Dict[str, Any]:
    """
    Sub-millisecond supervised ensemble inference with model-specific context escalation.
    """
    scaler_path = os.path.join(SAVED_MODELS_DIR, 'scaler.joblib')
    if not os.path.exists(scaler_path):
        raise FileNotFoundError(f"Scaler artifact missing at {scaler_path}")
    scaler = joblib.load(scaler_path)

    fname, display_name = MODEL_REGISTRY.get(model_key, ('best_ensemble_model.joblib', 'Best Ensemble Model'))
    model_path = os.path.join(SAVED_MODELS_DIR, fname)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model artifact '{fname}' not found at {model_path}")
    model = joblib.load(model_path)

    feat_names = ['input_tokens', 'output_tokens', 'latency', 'task_type_enc', 'difficulty_enc']
    raw_df = pd.DataFrame([{
        'input_tokens': input_tokens,
        'output_tokens': output_tokens,
        'latency': latency,
        'task_type_enc': TASK_TYPE_MAP.get(task_type, 0),
        'difficulty_enc': DIFFICULTY_MAP.get(difficulty, 0)
    }], columns=feat_names)

    scaled_df = pd.DataFrame(scaler.transform(raw_df), columns=feat_names)
    raw_pred_tier = model.predict(scaled_df)[0]
    probs = model.predict_proba(scaled_df)[0]
    prob_dict = {cls: float(p) for cls, p in zip(model.classes_, probs)}

    # Model-Specific Context Enforcement & Escalation Check
    combined_tokens = input_tokens + output_tokens
    final_tier = raw_pred_tier
    escalated = False
    escalation_reason = ""

    # Check if raw predicted tier can physically support this combined token length
    if combined_tokens > TIER_SPECS[raw_pred_tier]['context_limit']:
        escalated = True
        if combined_tokens <= TIER_SPECS['Medium']['context_limit']:
            final_tier = 'Medium'
        else:
            final_tier = 'Large'
        escalation_reason = (
            f"Combined tokens ({combined_tokens}) exceed {raw_pred_tier} context limit "
            f"({TIER_SPECS[raw_pred_tier]['context_limit']} tokens). "
            f"Auto-escalated to {final_tier} tier to prevent prompt truncation."
        )

    cost_gov = (combined_tokens / 1000.0) * TIER_SPECS[final_tier]['rate_per_1k']
    cost_base = (combined_tokens / 1000.0) * TIER_SPECS['Large']['rate_per_1k']
    savings = max(0.0, cost_base - cost_gov)
    sav_pct = (savings / cost_base) * 100.0 if cost_base > 0 else 0.0

    return {
        'model_name': display_name,
        'raw_predicted_tier': raw_pred_tier,
        'final_routed_tier': final_tier,
        'predicted_tier': final_tier,
        'confidence': prob_dict[raw_pred_tier],
        'probabilities': prob_dict,
        'cost_governor': cost_gov,
        'cost_baseline': cost_base,
        'savings_rupees': savings,
        'savings_percent': sav_pct,
        'combined_tokens': combined_tokens,
        'context_escalated': escalated,
        'escalation_reason': escalation_reason,
        'features_scaled': scaled_df.iloc[0].to_dict()
    }


# ── UNIFIED ENTRY POINT ──────────────────────────────────────────────────────
def route_task(
    text: str,
    task_type: str = 'Summary',
    difficulty: str = 'Easy',
    output_tokens: int = 25,
    latency: float = 0.45,
    model: str = 'best'
) -> Dict[str, Any]:
    """
    Unified public API for task routing inference.
    """
    errors, in_tok, out_tok, norm_type, norm_diff = validate_task_context(
        text, task_type, difficulty, output_tokens, latency
    )
    if errors:
        return {'status': 'error', 'errors': errors}

    if model == 'kmeans':
        res = predict_kmeans_standalone(in_tok, out_tok, latency, norm_type, norm_diff)
    else:
        m_key = model if model in MODEL_REGISTRY else 'best'
        res = predict_ensemble_standalone(m_key, in_tok, out_tok, latency, norm_type, norm_diff)

    res['status'] = 'success'
    res['input_tokens'] = in_tok
    res['output_tokens'] = out_tok
    res['task_type'] = norm_type
    res['difficulty'] = norm_diff
    return res
