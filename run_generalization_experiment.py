#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
  AI RUNTIME GOVERNOR — GENERALIZATION EXPERIMENT RUNNER
  Evaluates pre-trained, serialized models on an entirely independent, unseen
  synthetic dataset (N=500, Seed=999) generated using the same physical laws.
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import random
import time
from datetime import datetime, timedelta
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)
from sklearn.preprocessing import label_binarize
from bma import BayesianModelAveragingClassifier

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, 'saved_models')
NEW_DATASET_CSV = os.path.join(BASE_DIR, 'tasks_dataset_generalization.csv')
ORIGINAL_DATASET_CSV = os.path.join(BASE_DIR, 'tasks_dataset.csv')

# Cost Model (₹ per 1K tokens)
COST_PER_1K = {'Small': 0.0012, 'Medium': 0.0080, 'Large': 0.0350}

TYPE_TO_ENC = {
    'Classification': 0, 'QA': 1, 'Summary': 2, 'Extraction': 3,
    'Reasoning': 4, 'Coding': 5, 'Agentic': 6, 'Analysis': 7, 'Creative': 8
}
DIFF_TO_ENC = {'Easy': 0, 'Medium': 1, 'Hard': 2}
CLASS_ORDER = ['Small', 'Medium', 'Large']

def compute_cost(inp_tok, out_tok, model):
    rate = COST_PER_1K.get(model, 0.0080)
    return (inp_tok + out_tok) / 1000.0 * rate

# ── 1. GENERATE INDEPENDENT DATASET (N=500, SEED=999) ─────────────────────────
def generate_independent_dataset(n_samples=500, seed=999):
    print("═" * 74)
    print(f"  STEP 1: GENERATING INDEPENDENT SYNTHETIC DATASET (N={n_samples}, SEED={seed})")
    print("═" * 74)
    random.seed(seed)
    np.random.seed(seed)

    states = ['Lean', 'Balanced', 'Premium']
    transition_matrix = [
        [0.70, 0.22, 0.08],
        [0.18, 0.68, 0.14],
        [0.08, 0.24, 0.68]
    ]

    current_state = 0
    records = []
    base_time = datetime(2026, 6, 1, 9, 0, 0)

    for i in range(n_samples):
        r = random.random()
        probs = transition_matrix[current_state]
        if r < probs[0]:
            current_state = 0
        elif r < probs[0] + probs[1]:
            current_state = 1
        else:
            current_state = 2

        if current_state == 0:
            diff = 'Easy' if random.random() < 0.80 else 'Medium'
            ttype = random.choice(['Summary', 'Classification', 'Extraction'])
            inp_tok = random.randint(800, 2000)
            out_tok = random.randint(80, 250)
            latency = round(random.uniform(0.40, 1.40), 2)
            ground_truth_model = 'Small'
        elif current_state == 1:
            diff = 'Medium' if random.random() < 0.80 else ('Easy' if random.random() < 0.5 else 'Hard')
            ttype = random.choice(['Summary', 'Coding', 'Extraction', 'Reasoning'])
            inp_tok = random.randint(2200, 4200)
            out_tok = random.randint(250, 600)
            latency = round(random.uniform(1.20, 3.10), 2)
            ground_truth_model = 'Medium'
        else:
            diff = 'Hard' if random.random() < 0.80 else 'Medium'
            ttype = random.choice(['Reasoning', 'Coding', 'Agentic'])
            inp_tok = random.randint(4800, 8800)
            out_tok = random.randint(600, 1600)
            latency = round(random.uniform(2.80, 6.20), 2)
            ground_truth_model = 'Large'

        # Inject 5% label noise
        is_noisy = False
        if random.random() < 0.05:
            ground_truth_model = random.choice(['Small', 'Medium', 'Large'])
            is_noisy = True

        cost_actual = compute_cost(inp_tok, out_tok, ground_truth_model)
        cost_baseline = compute_cost(inp_tok, out_tok, 'Large')
        savings_pct = round((1.0 - (cost_actual / cost_baseline)) * 100, 1) if cost_baseline > 0 else 0.0

        records.append({
            'id': f'GEN-OOS-{i+1:04d}',
            'task_name': f'{ttype} — {diff} #{i+1}',
            'task_type': ttype,
            'task_type_enc': TYPE_TO_ENC.get(ttype, 0),
            'difficulty': diff,
            'difficulty_enc': DIFF_TO_ENC.get(diff, 0),
            'input_tokens': inp_tok,
            'output_tokens': out_tok,
            'total_tokens': inp_tok + out_tok,
            'latency': latency,
            'selected_model': ground_truth_model,
            'actual_cost': round(cost_actual, 4),
            'baseline_cost': round(cost_baseline, 4),
            'savings_pct': savings_pct,
            'simulated_state': current_state,
            'is_label_noise': is_noisy
        })

    new_df = pd.DataFrame(records)
    new_df.to_csv(NEW_DATASET_CSV, index=False)
    print(f"✓ Saved {len(new_df)} independent records to {NEW_DATASET_CSV}")

    # Check for zero overlap with original dataset
    orig_df = pd.read_csv(ORIGINAL_DATASET_CSV)
    orig_pairs = set(zip(orig_df['input_tokens'], orig_df['output_tokens'], orig_df['latency']))
    new_pairs = set(zip(new_df['input_tokens'], new_df['output_tokens'], new_df['latency']))
    intersection = orig_pairs.intersection(new_pairs)
    print(f"✓ Original vs Independent feature tuples intersection: {len(intersection)} overlapping records.")
    print("  Class Distribution in Independent Dataset:")
    for cls in CLASS_ORDER:
        cnt = (new_df['selected_model'] == cls).sum()
        pct = cnt / len(new_df) * 100.0
        print(f"    • {cls:<6}: {cnt:>3} samples ({pct:5.1f}%)")

    noisy_cnt = new_df['is_label_noise'].sum()
    state_to_model = {0: 'Small', 1: 'Medium', 2: 'Large'}
    new_df['expected_from_state'] = new_df['simulated_state'].map(state_to_model)
    actual_flipped = (new_df['expected_from_state'] != new_df['selected_model']).sum()
    print(f"\n  Noise Audit:")
    print(f"    • Noise branch triggered : {noisy_cnt} / 500 samples ({noisy_cnt/500*100:.1f}%)")
    print(f"    • Realized label flips   : {actual_flipped} / 500 samples ({actual_flipped/500*100:.1f}%)")
    print(f"    • Theoretical Bayes ceiling on this dataset: {100.0 - (actual_flipped/500*100):.2f}%")

    return new_df, actual_flipped


# ── 2. LOAD SAVED ARTIFACTS AND EVALUATE ───────────────────────────────────────
def evaluate_generalization(new_df, actual_flipped):
    print("\n" + "═" * 74)
    print("  STEP 2: EVALUATING SAVED PRE-TRAINED MODELS (ZERO RETRAINING)")
    print("═" * 74)

    feature_cols = ['input_tokens', 'output_tokens', 'latency', 'task_type_enc', 'difficulty_enc']
    X_new = new_df[feature_cols]
    y_new = new_df['selected_model']

    # Load fitted StandardScaler
    scaler_path = os.path.join(SAVED_MODELS_DIR, 'scaler.joblib')
    scaler = joblib.load(scaler_path)
    X_new_scaled = pd.DataFrame(scaler.transform(X_new), columns=feature_cols)
    print(f"✓ Loaded StandardScaler from {scaler_path}")

    # Model filenames
    model_files = {
        'Decision Tree (Baseline)': 'decision_tree.joblib',
        'Random Forest': 'random_forest.joblib',
        'Extra Trees': 'extra_trees.joblib',
        'AdaBoost': 'adaboost.joblib',
        'Gradient Boosting': 'gradient_boosting.joblib',
        'Soft Voting Classifier': 'soft_voting.joblib',
        'Bayesian Model Averaging': 'bayesian_model_averaging.joblib',
        'Stacking Classifier': 'stacking.joblib',
    }

    results = []
    predictions = {}

    for name, fname in model_files.items():
        fpath = os.path.join(SAVED_MODELS_DIR, fname)
        if not os.path.exists(fpath):
            print(f"  ⚠ Missing model file: {fpath}")
            continue
        model = joblib.load(fpath)

        y_pred = model.predict(X_new_scaled)
        y_prob = model.predict_proba(X_new_scaled)
        predictions[name] = y_pred

        acc = accuracy_score(y_new, y_pred)
        prec = precision_score(y_new, y_pred, average='macro', zero_division=0)
        rec = recall_score(y_new, y_pred, average='macro', zero_division=0)
        f1_macro = f1_score(y_new, y_pred, average='macro', zero_division=0)
        f1_weighted = f1_score(y_new, y_pred, average='weighted', zero_division=0)

        # Multi-class One-vs-Rest ROC-AUC
        y_new_bin = label_binarize(y_new, classes=model.classes_)
        roc_auc = roc_auc_score(y_new_bin, y_prob, average='macro', multi_class='ovr')

        results.append({
            'Model': name,
            'OOS Accuracy (%)': round(acc * 100.0, 2),
            'OOS Precision (%)': round(prec * 100.0, 2),
            'OOS Recall (%)': round(rec * 100.0, 2),
            'OOS F1 (Macro %)': round(f1_macro * 100.0, 2),
            'OOS F1 (Weighted %)': round(f1_weighted * 100.0, 2),
            'OOS ROC-AUC (OvR)': round(roc_auc, 4),
            'Misclassified Count': int((y_pred != y_new).sum())
        })

    results_df = pd.DataFrame(results)

    print("\n" + "═" * 74)
    print("  GENERALIZATION EXPERIMENT RESULTS (UNSEEN DATASET N=500)")
    print("═" * 74)
    print(f"  {'Model Architecture':<26}  {'Acc%':>6}  {'Prec%':>6}  {'Rec%':>6}  {'F1%':>6}  {'AUC':>6}  {'Errors':>6}")
    print(f"  {'-'*26}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*6}")
    for _, r in results_df.iterrows():
        print(f"  {r['Model']:<26}  {r['OOS Accuracy (%)']:>6.2f}  {r['OOS Precision (%)']:>6.2f}  {r['OOS Recall (%)']:>6.2f}  {r['OOS F1 (Macro %)']:>6.2f}  {r['OOS ROC-AUC (OvR)']:>6.4f}  {r['Misclassified Count']:>6d}")

    # Check pair-wise equality of predictions on the 500 samples
    print("\n  Pairwise Prediction Consistency across Ensembles (N=500):")
    p_rf = predictions['Random Forest']
    for name in ['Extra Trees', 'AdaBoost', 'Gradient Boosting', 'Soft Voting Classifier', 'Stacking Classifier']:
        diff = (p_rf != predictions[name]).sum()
        print(f"    • Random Forest vs {name:<24}: {diff} disagreements out of 500 samples")

    dt_diff = (p_rf != predictions['Decision Tree (Baseline)']).sum()
    print(f"    • Random Forest vs Decision Tree (Baseline): {dt_diff} disagreements out of 500 samples")

    return results_df


if __name__ == '__main__':
    new_df, actual_flipped = generate_independent_dataset(n_samples=500, seed=999)
    results_df = evaluate_generalization(new_df, actual_flipped)

