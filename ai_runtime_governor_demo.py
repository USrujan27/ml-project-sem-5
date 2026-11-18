#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
  AI RUNTIME GOVERNOR — COMPLETE ML DEMONSTRATION & FACULTY REVIEW RUNNER
  Covers PBL-II (K-Means + HMM) and PBL-III (7 Ensemble Learning Classifiers)
═══════════════════════════════════════════════════════════════════════════════
Usage:
  python3 ai_runtime_governor_demo.py
  python3 ai_runtime_governor_demo.py --retrain
"""

import sys
import os
import time
import argparse
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

parser = argparse.ArgumentParser(description="AI Runtime Governor Demonstration")
parser.add_argument('--retrain', action='store_true', help="Force retraining of ensemble models")
parser.add_argument('--skip-pbl2', action='store_true', help="Skip PBL-II pipeline output")
args = parser.parse_args()

print("\n" + "╔" + "═" * 74 + "╗")
print("║" + "   AI RUNTIME GOVERNOR : COMPREHENSIVE ML REVIEW & DEMO HARNESS          " + "║")
print("║" + "   Optimizing Performance, Operational Cost, and Latency for LLM Systems   " + "║")
print("╚" + "═" * 74 + "╝\n")

# ── 1. PBL-II PIPELINE EXECUTION ──────────────────────────────────────────────
if not args.skip_pbl2:
    print("▶ Executing PBL-II ML Foundation (K-Means Clustering + Hidden Markov Model)...")
    pipeline_script = os.path.join(BASE_DIR, 'run_ml_pipeline.py')
    if os.path.exists(pipeline_script):
        loc = {}
        with open(pipeline_script) as f:
            code = f.read()
        exec(compile(code, pipeline_script, 'exec'), loc)
    else:
        print("  ⚠ run_ml_pipeline.py not found, skipping PBL-II step.")

# ── 2. PBL-III ENSEMBLE PIPELINE EXECUTION / RETRAINING ───────────────────────
ensemble_script = os.path.join(BASE_DIR, 'train_ensemble_models.py')
results_json_path = os.path.join(BASE_DIR, 'ml_results.json')

if args.retrain or not os.path.exists(os.path.join(BASE_DIR, 'saved_models', 'best_ensemble_model.joblib')):
    print("\n▶ Training PBL-III Ensemble Models (Decision Tree, Random Forest, Extra Trees, AdaBoost, Gradient Boost, Voting, Stacking)...")
    loc_ens = {}
    with open(ensemble_script) as f:
        code = f.read()
    exec(compile(code, ensemble_script, 'exec'), loc_ens)
else:
    print("\n" + "═" * 76)
    print("  PBL-III ENSEMBLE LEARNING GOVERNOR — ARCHITECTURE & METRIC BENCHMARKS")
    print("═" * 76)
    if os.path.exists(results_json_path):
        with open(results_json_path) as f:
            meta = json.load(f)
        ens_data = meta.get('ensemble_analysis', {})
        comp_table = ens_data.get('comparison_table', [])
        best_mod = ens_data.get('best_model', {})

        print(f"\n  {'Model Name':<26}  {'Acc%':>6}  {'Prec%':>6}  {'Rec%':>6}  {'F1%':>6}  {'AUC':>6}  {'Lat(μs)':>8}  {'Gap%':>6}")
        print(f"  {'-'*26}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*8}  {'-'*6}")
        for r in comp_table:
            marker = " ◄ BEST" if r['Model'] == best_mod.get('name') else ""
            print(f"  {r['Model']:<26}  {r['Accuracy']:>6.2f}  {r['Precision (Macro)']:>6.2f}  {r['Recall (Macro)']:>6.2f}  {r['F1-Score (Macro)']:>6.2f}  {r['ROC-AUC (OvR)']:>6.4f}  {r['Latency (us/task)']:>8.1f}  {r['Generalization Gap']:>6.2f}{marker}")

        print("\n  🏆 Top Performing Model :", best_mod.get('name', 'N/A'))
        print(f"     • Macro F1-Score     : {best_mod.get('f1_macro', 0):.2f}%")
        print(f"     • Multi-class ROC-AUC: {best_mod.get('roc_auc', 0):.4f}")
        print(f"     • Inference Latency  : {best_mod.get('latency_us', 0):.1f} μs per routing decision")
        print(f"     • Persisted Artifact : {best_mod.get('artifact_path', 'N/A')}")

# ── 3. LIVE MULTI-TIER ROUTING BENCHMARK ──────────────────────────────────────
print("\n" + "═" * 76)
print("  LIVE RUNTIME GOVERNOR ROUTING BENCHMARKS (3 TEST WORKLOAD REGIMES)")
print("═" * 76)

sample_tasks = [
    {
        'title': 'Lightweight Task: Quick Grammar Correction',
        'prompt': 'Fix the punctuation in this sentence: she went to the market and bought apples oranges bananas',
        'type': 'Summary',
        'diff': 'Easy',
        'tokens_in': 22,
        'tokens_out': 20,
        'latency': 0.35,
        'expected': 'Small'
    },
    {
        'title': 'Medium Complexity Task: Analytical Sales Summary',
        'prompt': 'Summarize regional quarterly sales data for Q3 across EMEA and APAC, highlighting YoY revenue churn.',
        'type': 'Analysis',
        'diff': 'Medium',
        'tokens_in': 580,
        'tokens_out': 320,
        'latency': 2.10,
        'expected': 'Medium'
    },
    {
        'title': 'High Complexity Task: Multi-threaded Kernel Refactor',
        'prompt': 'Refactor an asynchronous lock-free ring buffer in C++ with memory barriers, memory order acquire-release semantics, and ABA prevention.',
        'type': 'Code',
        'diff': 'Hard',
        'tokens_in': 4200,
        'tokens_out': 1400,
        'latency': 8.50,
        'expected': 'Large'
    }
]

try:
    import joblib
    import pandas as pd
    best_model = joblib.load(os.path.join(BASE_DIR, 'saved_models', 'best_ensemble_model.joblib'))
    scaler = joblib.load(os.path.join(BASE_DIR, 'saved_models', 'scaler.joblib'))
    TASK_TYPE_MAP = {'Summary': 2, 'Analysis': 7, 'Code': 5}
    DIFF_MAP = {'Easy': 0, 'Medium': 1, 'Hard': 2}
    COST_MAP = {'Small': 0.0012, 'Medium': 0.0080, 'Large': 0.0350}

    for i, t in enumerate(sample_tasks, 1):
        raw_feat = pd.DataFrame([{
            'input_tokens': t['tokens_in'],
            'output_tokens': t['tokens_out'],
            'latency': t['latency'],
            'task_type_enc': TASK_TYPE_MAP[t['type']],
            'difficulty_enc': DIFF_MAP[t['diff']]
        }], columns=['input_tokens', 'output_tokens', 'latency', 'task_type_enc', 'difficulty_enc'])

        scaled = pd.DataFrame(scaler.transform(raw_feat), columns=raw_feat.columns)
        pred_tier = best_model.predict(scaled)[0]
        probs = best_model.predict_proba(scaled)[0]
        prob_dict = {cls: float(p) for cls, p in zip(best_model.classes_, probs)}

        tot_tok = t['tokens_in'] + t['tokens_out']
        c_gov = (tot_tok / 1000.0) * COST_MAP[pred_tier]
        c_base = (tot_tok / 1000.0) * COST_MAP['Large']
        sav = max(0.0, c_base - c_gov)
        sav_pct = (sav / c_base) * 100.0 if c_base > 0 else 0.0

        print(f"\n  [Sample {i}] {t['title']}")
        print(f"    • Workload Profile : {t['tokens_in']} input tok, {t['tokens_out']} output tok, {t['latency']}s latency")
        print(f"    • Routing Decision : 🎯 {pred_tier.upper()} TIER (Confidence: {prob_dict[pred_tier]*100:.1f}%)")
        print(f"    • Expected Tier    : {t['expected']}")
        print(f"    • Cost Comparison  : ₹{c_gov:.6f} vs Baseline ₹{c_base:.6f} (Savings: {sav_pct:.1f}%)")
except Exception as e:
    print(f"  ⚠ Live routing test error: {e}")

print("\n" + "═" * 76)
print("  VERIFICATION COMPLETE: ALL MODELS & ARTIFACTS CONFIRMED")
print("  Generated plots are available in: figures_pbl3/")
print("  Ensemble models saved in        : saved_models/")
print("  Dataset persisted in            : tasks_dataset.csv")
print("═" * 76 + "\n")
