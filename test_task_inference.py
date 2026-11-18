#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
  AI RUNTIME GOVERNOR — ENTERPRISE TASK INFERENCE HARNESS
  Integrated with standalone inference engine (zero training re-execution)
═══════════════════════════════════════════════════════════════════════════════
Usage:
  # 1. Single Task Inference with default (Best Ensemble + K-Means):
  python3 test_task_inference.py --text "Translate to French" --type Summary --diff Easy

  # 2. Select any specific model:
  python3 test_task_inference.py --model random_forest
  python3 test_task_inference.py --model gradient_boosting
  python3 test_task_inference.py --model stacking

  # 3. Compare all 7 models side-by-side:
  python3 test_task_inference.py --model compare

  # 4. Batch Inference on multiple records:
  python3 test_task_inference.py --batch tasks_dataset_generalization.csv --n 5
"""

import sys
import os
import argparse
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
import inference

DEFAULT_TASK_TEXT = (
    "Artificial intelligence enables computers to perform tasks that typically "
    "require human intelligence. Machine learning allows systems to learn patterns "
    "from data and improve their predictions."
)

def run_batch_evaluation(file_path: str, limit: int = 10, model_key: str = 'best'):
    if not os.path.exists(file_path):
        print(f"\n❌ Error: Batch file '{file_path}' does not exist.\n")
        sys.exit(1)

    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith('.json'):
        df = pd.read_json(file_path)
    else:
        print("\n❌ Error: Unsupported batch file format. Must be .csv or .json\n")
        sys.exit(1)

    if limit and limit > 0:
        df = df.head(limit)

    model_display = inference.MODEL_REGISTRY.get(model_key, ('', model_key))[1]
    print("\n" + "═" * 86)
    print(f"  AI RUNTIME GOVERNOR — BATCH TASK INFERENCE (N={len(df)})")
    print(f"  Source File : {file_path}")
    print(f"  Model Engine: {model_display}")
    print("═" * 86)
    print(f"  {'Task ID':<12}  {'Category':<12}  {'Diff':<6}  {'InTok':>6}  {'OutTok':>6}  {'Pred Tier':<9}  {'Confidence':>10}  {'Cost':>10}  {'Savings%':>9}")
    print(f"  {'-'*12}  {'-'*12}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*9}  {'-'*10}  {'-'*10}  {'-'*9}")

    total_gov_cost = 0.0
    total_base_cost = 0.0

    for _, row in df.iterrows():
        t_id = str(row.get('id', f"TASK-{_}"))
        ttype = str(row.get('task_type', 'Summary'))
        diff = str(row.get('difficulty', 'Easy'))
        in_tok = int(row.get('input_tokens', 100))
        out_tok = int(row.get('output_tokens', 50))
        lat = float(row.get('latency', 0.5))

        res = inference.predict_ensemble_standalone(model_key, in_tok, out_tok, lat, ttype, diff)
        total_gov_cost += res['cost_governor']
        total_base_cost += res['cost_baseline']

        print(f"  {t_id:<12}  {ttype:<12}  {diff:<6}  {in_tok:>6d}  {out_tok:>6d}  {res['predicted_tier']:<9}  {res['confidence']*100:>9.1f}%  ₹{res['cost_governor']:>9.5f}  {res['savings_percent']:>8.1f}%")

    tot_saved = max(0.0, total_base_cost - total_gov_cost)
    pct_saved = (tot_saved / total_base_cost * 100.0) if total_base_cost > 0 else 0.0
    print("─" * 86)
    print(f"  BATCH SUMMARY: {len(df)} Tasks Processed")
    print(f"  • Governor Total Cost   : ₹{total_gov_cost:.5f}")
    print(f"  • Baseline Large Cost   : ₹{total_base_cost:.5f}")
    print(f"  • Total Cost Reduction  : ₹{tot_saved:.5f} ({pct_saved:.1f}% saved)")
    print("═" * 86 + "\n")


def main():
    parser = argparse.ArgumentParser(description="AI Runtime Governor Task Inference Harness")
    parser.add_argument('--text', type=str, default=DEFAULT_TASK_TEXT, help="Task prompt text")
    parser.add_argument('--type', type=str, default='Summary', help="Task type (Classification, QA, Summary, etc.)")
    parser.add_argument('--diff', type=str, default='Easy', help="Task difficulty (Easy, Medium, Hard)")
    parser.add_argument('--output_tokens', type=int, default=25, help="Estimated completion token count")
    parser.add_argument('--latency', type=float, default=0.45, help="Observed latency in seconds")
    parser.add_argument('--model', type=str, default='all',
                        choices=['all', 'ensemble', 'best', 'kmeans', 'compare',
                                 'decision_tree', 'random_forest', 'extra_trees',
                                 'adaboost', 'gradient_boosting', 'voting', 'bma', 'stacking'],
                        help="Governor model selection")
    parser.add_argument('--batch', type=str, default=None, help="Path to batch CSV or JSON file")
    parser.add_argument('--n', type=int, default=10, help="Number of records to process from batch file")
    args = parser.parse_args()

    # 1. Batch Mode
    if args.batch:
        model_key = args.model if args.model in inference.MODEL_REGISTRY else 'best'
        run_batch_evaluation(args.batch, limit=args.n, model_key=model_key)
        return

    # 2. Context & Input Validation
    errors, in_tok, out_tok, norm_type, norm_diff = inference.validate_task_context(
        args.text, args.type, args.diff, args.output_tokens, args.latency
    )

    if errors:
        print("\n" + "╔" + "═" * 70 + "╗")
        print("║" + "   ❌ CONTEXT & INPUT VALIDATION ERROR (AI RUNTIME GOVERNOR)           " + "║")
        print("╚" + "═" * 70 + "╝")
        for err in errors:
            print(f"  • {err}")
        print("\n  Please provide valid operational task arguments.\n")
        sys.exit(1)

    words = args.text.split()
    combined_tokens = in_tok + out_tok

    print("\n" + "═" * 74)
    print("  AI RUNTIME GOVERNOR — REAL-TIME TASK INFERENCE HARNESS")
    print("═" * 74)
    print(f"  Prompt Text Preview    : \"{args.text[:70]}...\"")
    print(f"  Prompt Word Count      : {len(words)} words")
    print(f"  Estimated Input Tokens : {in_tok} tokens")
    print(f"  Estimated Output Tokens: {out_tok} tokens")
    print(f"  Combined Context Length: {combined_tokens} tokens")
    print(f"  Task Category / Type   : {norm_type}")
    print(f"  Task Complexity / Diff : {norm_diff}")
    print(f"  Observed Latency       : {args.latency:.2f}s")
    print("─" * 74)

    # 3. Model Comparison Mode
    if args.model == 'compare':
        print(f"  COMPARING ALL 8 ENSEMBLE MODELS ON THIS TASK:")
        print(f"  {'Model Architecture':<26}  {'Prediction':<11}  {'Confidence':>10}  {'Cost':>10}  {'Savings%':>9}")
        print(f"  {'-'*26}  {'-'*11}  {'-'*10}  {'-'*10}  {'-'*9}")
        for m_key in ['decision_tree', 'random_forest', 'extra_trees', 'adaboost', 'gradient_boosting', 'voting', 'bma', 'stacking']:
            try:
                res = inference.predict_ensemble_standalone(m_key, in_tok, out_tok, args.latency, norm_type, norm_diff)
                print(f"  {res['model_name']:<26}  {res['predicted_tier']:<11}  {res['confidence']*100:>9.1f}%  ₹{res['cost_governor']:>9.6f}  {res['savings_percent']:>8.1f}%")
            except Exception as e:
                print(f"  {m_key:<26}  Error: {e}")
        print("═" * 74 + "\n")
        return

    # 4. Standard Ensemble Inference
    models_to_run = []
    if args.model in ['all', 'ensemble', 'best']:
        models_to_run.append(('best', 'PBL-III ENSEMBLE GOVERNOR'))
    elif args.model in inference.MODEL_REGISTRY:
        models_to_run.append((args.model, f"PBL-III {inference.MODEL_REGISTRY[args.model][1].upper()}"))

    for m_key, header_title in models_to_run:
        try:
            res = inference.predict_ensemble_standalone(m_key, in_tok, out_tok, args.latency, norm_type, norm_diff)
            tier = res['predicted_tier']
            conf = res['confidence'] * 100.0
            print(f"  [{header_title}]:")
            print(f"    • Architecture        : {res['model_name']}")
            print(f"    • Routing Decision    : 🎯 {tier.upper()} TIER")
            if res.get('context_escalated'):
                print(f"    • ⚠️ Context Escalation: {res['escalation_reason']}")
            print(f"    • Prediction Confidence: {conf:.2f}%")
            print(f"    • Class Probabilities :")
            for cls in ['Small', 'Medium', 'Large']:
                p_val = res['probabilities'].get(cls, 0.0) * 100.0
                bar = "█" * int(p_val / 5)
                print(f"        - {cls:<6}: {p_val:5.1f}%  |{bar:<20}|")
            print(f"    • Operational Cost     : ₹{res['cost_governor']:.6f}")
            print(f"    • Baseline Large Cost  : ₹{res['cost_baseline']:.6f}")
            print(f"    • Cost Reduction       : ₹{res['savings_rupees']:.6f} ({res['savings_percent']:.1f}% saved)")
        except Exception as e:
            print(f"  [{header_title}] Error: {e}")

    # 5. Standalone K-Means Inference (Zero re-execution of run_ml_pipeline.py)
    if args.model in ['all', 'kmeans']:
        try:
            k_res = inference.predict_kmeans_standalone(in_tok, out_tok, args.latency, norm_type, norm_diff)
            print("─" * 74)
            print(f"  [PBL-II K-MEANS CLUSTER GOVERNOR]:")
            print(f"    • Architecture        : {k_res['model_name']}")
            print(f"    • Routing Decision    : 📍 {k_res['assigned_model'].upper()} TIER (Cluster {k_res['assigned_cluster']})")
            print(f"    • Scaled Features     : {k_res['scaled_features']}")
            print(f"    • Operational Cost     : ₹{k_res['cost_governor']:.6f}")
            print(f"    • Baseline Large Cost  : ₹{k_res['cost_large']:.6f}")
            print(f"    • Cost Reduction       : ₹{k_res['savings_rupees']:.6f} ({k_res['savings_percent']:.1f}% saved)")
        except Exception as e:
            print(f"  [PBL-II K-Means] Error: {e}")

    print("═" * 74 + "\n")


if __name__ == '__main__':
    main()
