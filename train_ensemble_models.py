#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
  AI RUNTIME GOVERNOR — ENSEMBLE LEARNING ENGINE & BENCHMARK SUITE
  PBL-III Review 3 Demonstration | Supervised Model Tier Routing
═══════════════════════════════════════════════════════════════════════════════
Evaluates 7 Machine Learning Models on 500 Task Telemetry Records:
  1. Baseline: Decision Tree Classifier
  2. Bagging 1: Random Forest Classifier
  3. Bagging 2: Extra Trees Classifier
  4. Boosting 1: AdaBoost Classifier
  5. Boosting 2: Gradient Boosting Classifier
  6. Heterogeneous Ensemble: Soft Voting Classifier
  7. Meta-Ensemble: Stacking Classifier (Meta-Learner: Logistic Regression)

Key Technical Safeguards:
  • Reproducible Stratified 80/20 Train-Test Split (random_state=42)
  • Zero Data Leakage: Preprocessing Scaler fit strictly on Training data
  • Full multi-class metrics: Accuracy, Precision, Recall, F1, ROC-AUC, Latency
  • Publication-grade figures saved to figures_pbl3/
  • Model persistence to saved_models/
  • Non-destructive update to ml_results.json
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import time
import json
import random
import math
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import joblib

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, label_binarize
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, roc_curve, auc
)
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (
    RandomForestClassifier, ExtraTreesClassifier,
    AdaBoostClassifier, GradientBoostingClassifier,
    VotingClassifier, StackingClassifier
)
from sklearn.linear_model import LogisticRegression
from bma import BayesianModelAveragingClassifier

# ── 1. CONFIGURATION & DIRECTORIES ───────────────────────────────────────────
SEED = 42
np.random.seed(SEED)
random.seed(SEED)

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(PROJECT_DIR, 'saved_models')
FIGURES_DIR = os.path.join(PROJECT_DIR, 'figures_pbl3')
DATASET_CSV = os.path.join(PROJECT_DIR, 'tasks_dataset.csv')
JSON_PATH = os.path.join(PROJECT_DIR, 'ml_results.json')

os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
os.makedirs(FIGURES_DIR, exist_ok=True)

# Pricing table for cost simulations (₹ per 1,000 tokens)
PRICING = {
    'Small':  {'input': 0.02, 'output': 0.06},
    'Medium': {'input': 0.08, 'output': 0.24},
    'Large':  {'input': 0.30, 'output': 0.90},
}

TASK_TYPES = [
    'Classification', 'Summary', 'Extraction', 'Conversational',
    'Coding', 'Reasoning', 'Agentic'
]
DIFFICULTIES = ['Easy', 'Medium', 'Hard']
CLASSES = ['Small', 'Medium', 'Large']
CLASS_ORDER = ['Small', 'Medium', 'Large']

TYPE_TO_ENC = {t: i for i, t in enumerate(TASK_TYPES)}
DIFF_TO_ENC = {'Easy': 0, 'Medium': 1, 'Hard': 2}
MODEL_TO_INT = {'Small': 0, 'Medium': 1, 'Large': 2}
INT_TO_MODEL = {0: 'Small', 1: 'Medium', 2: 'Large'}

def compute_cost(inp_tok, out_tok, model):
    rate = PRICING[model]
    return (inp_tok * rate['input'] + out_tok * rate['output']) / 1000.0


# ── 2. DATASET GENERATION & SERIALIZATION (tasks_dataset.csv) ─────────────────
def generate_or_load_dataset():
    """
    Generates 500 tasks matching the exact telemetry distributions from PBL-II
    and exports them to tasks_dataset.csv for transparency and reproducibility.
    """
    random.seed(SEED)
    current_state = 0
    transition_prior = [
        [0.76, 0.18, 0.06],  # Lean
        [0.22, 0.65, 0.13],  # Balanced
        [0.10, 0.18, 0.72],  # Premium
    ]

    records = []
    base_time = datetime.now() - timedelta(days=20)

    for i in range(500):
        # State transition
        r_trans = random.random()
        cum = 0.0
        for next_st, prob in enumerate(transition_prior[current_state]):
            cum += prob
            if r_trans <= cum:
                current_state = next_st
                break

        if current_state == 0:  # Lean regime
            diff = 'Easy' if random.random() < 0.85 else 'Medium'
            ttype = random.choice(['Classification', 'Extraction', 'Conversational', 'Summary'])
            inp_tok = random.randint(600, 2200)
            out_tok = random.randint(60, 260)
            latency = round(random.uniform(0.35, 1.40), 2)
            ground_truth_model = 'Small'
        elif current_state == 1:  # Balanced regime
            diff = 'Medium' if random.random() < 0.80 else ('Easy' if random.random() < 0.5 else 'Hard')
            ttype = random.choice(['Summary', 'Coding', 'Extraction', 'Reasoning'])
            inp_tok = random.randint(2200, 4200)
            out_tok = random.randint(250, 600)
            latency = round(random.uniform(1.20, 3.10), 2)
            ground_truth_model = 'Medium'
        else:  # Premium regime
            diff = 'Hard' if random.random() < 0.80 else 'Medium'
            ttype = random.choice(['Reasoning', 'Coding', 'Agentic'])
            inp_tok = random.randint(4800, 8800)
            out_tok = random.randint(600, 1600)
            latency = round(random.uniform(2.80, 6.20), 2)
            ground_truth_model = 'Large'

        # Inject 5% label noise to simulate real-world edge case escalations
        is_noisy = False
        if random.random() < 0.05:
            ground_truth_model = random.choice(['Small', 'Medium', 'Large'])
            is_noisy = True

        cost_actual = compute_cost(inp_tok, out_tok, ground_truth_model)
        cost_baseline = compute_cost(inp_tok, out_tok, 'Large')
        savings_pct = round((1.0 - (cost_actual / cost_baseline)) * 100, 1) if cost_baseline > 0 else 0.0

        r_jitter = random.randint(0, 15)
        task_time = base_time + timedelta(minutes=i * 50 + r_jitter)
        status = 'Success' if random.random() > 0.035 else 'Failed'

        records.append({
            'id': f'EXEC-{8400 + i}',
            'task_id': f'TASK-{(i % 50) + 1:03d}',
            'task_name': f'{ttype} — {diff} #{i+1}',
            'task_type': ttype,
            'task_type_enc': TYPE_TO_ENC[ttype],
            'difficulty': diff,
            'difficulty_enc': DIFF_TO_ENC[diff],
            'input_tokens': inp_tok,
            'output_tokens': out_tok,
            'total_tokens': inp_tok + out_tok,
            'latency': latency,
            'selected_model': ground_truth_model,
            'actual_cost': round(cost_actual, 4),
            'baseline_cost': round(cost_baseline, 4),
            'savings_pct': savings_pct,
            'status': status,
            'simulated_state': current_state,
            'is_label_noise': is_noisy,
            'created_at': task_time.isoformat()
        })

    df = pd.DataFrame(records)
    df.to_csv(DATASET_CSV, index=False)
    print(f"✓ Saved 500 task records to {DATASET_CSV}")
    return df


# ── 3. DATA PREPROCESSING & STRATIFIED SPLIT ─────────────────────────────────
def prepare_data(df):
    feature_cols = ['input_tokens', 'output_tokens', 'latency', 'task_type_enc', 'difficulty_enc']
    X = df[feature_cols].copy()
    y = df['selected_model'].copy()

    # Stratified 80/20 train/test split (random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=SEED, stratify=y
    )

    print("\n" + "═" * 70)
    print("  DATASET SPLIT & STRATIFICATION VERIFICATION")
    print("═" * 70)
    print(f"  Total Samples : {len(df)}")
    print(f"  Training Set  : {len(X_train)} samples (80.0%)")
    print(f"  Test Set      : {len(X_test)} samples (20.0%)")
    print("\n  Class Distribution (Stratification Check):")
    for cls in CLASS_ORDER:
        tr_cnt = (y_train == cls).sum()
        te_cnt = (y_test == cls).sum()
        tr_pct = tr_cnt / len(y_train) * 100
        te_pct = te_cnt / len(y_test) * 100
        print(f"    • {cls:<8}: Train = {tr_cnt:>3} ({tr_pct:5.1f}%) | Test = {te_cnt:>2} ({te_pct:5.1f}%)")

    # Fit scaler EXCLUSIVELY on training data to prevent data leakage
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=feature_cols, index=X_train.index)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=feature_cols, index=X_test.index)

    # Persist the fitted scaler
    joblib.dump(scaler, os.path.join(SAVED_MODELS_DIR, 'scaler.joblib'))
    print(f"✓ Fitted StandardScaler saved to {os.path.join(SAVED_MODELS_DIR, 'scaler.joblib')}")

    return X_train_scaled, X_test_scaled, y_train, y_test, feature_cols, scaler


# ── 4. MODEL INITIALIZATION & TRAINING ────────────────────────────────────────
def build_and_train_models(X_train, y_train):
    print("\n" + "═" * 70)
    print("  TRAINING 7 MACHINE LEARNING MODELS")
    print("═" * 70)

    # Base estimators for ensembles
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, min_samples_split=4, random_state=SEED)
    et = ExtraTreesClassifier(n_estimators=100, max_depth=6, min_samples_split=4, random_state=SEED)
    gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3, subsample=0.85, random_state=SEED)
    dt = DecisionTreeClassifier(max_depth=5, min_samples_split=5, random_state=SEED)
    ada = AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=2), n_estimators=80, learning_rate=0.8, random_state=SEED)

    # Voting Classifier (Soft Voting - probability average)
    voting_clf = VotingClassifier(
        estimators=[('rf', rf), ('et', et), ('gb', gb)],
        voting='soft'
    )

    # Bayesian Model Averaging (BMA - Posterior Model Probability Weighting)
    bma_clf = BayesianModelAveragingClassifier(
        estimators=[('rf', rf), ('et', et), ('gb', gb)],
        cv=5,
        temperature=0.08,
        random_state=SEED
    )

    # Stacking Classifier (Meta-Learner: Logistic Regression)
    stacking_clf = StackingClassifier(
        estimators=[('rf', rf), ('et', et), ('gb', gb)],
        final_estimator=LogisticRegression(max_iter=1000, random_state=SEED),
        cv=5,
        n_jobs=-1
    )

    models = {
        'Decision Tree (Baseline)': dt,
        'Random Forest': rf,
        'Extra Trees': et,
        'AdaBoost': ada,
        'Gradient Boosting': gb,
        'Soft Voting Classifier': voting_clf,
        'Bayesian Model Averaging': bma_clf,
        'Stacking Classifier': stacking_clf,
    }

    trained_models = {}
    train_times = {}

    for name, model in models.items():
        t0 = time.perf_counter()
        model.fit(X_train, y_train)
        t_fit = (time.perf_counter() - t0) * 1000.0  # ms
        train_times[name] = t_fit
        trained_models[name] = model
        print(f"  ✓ Trained: {name:<26} [fit time: {t_fit:6.1f} ms]")
        if name == 'Bayesian Model Averaging':
            print(f"     └─ BMA Log-Likelihoods (OOF): RF={model.log_likelihoods_['rf']:.2f}, ET={model.log_likelihoods_['et']:.2f}, GB={model.log_likelihoods_['gb']:.2f}")
            print(f"     └─ BMA Posterior Weights    : RF={model.posterior_weights_['rf']:.4f}, ET={model.posterior_weights_['et']:.4f}, GB={model.posterior_weights_['gb']:.4f}")
            print(f"     └─ Raw Bayes Factor Weights : RF={model.raw_weights_['rf']:.2e}, ET={model.raw_weights_['et']:.2e}, GB={model.raw_weights_['gb']:.2e}")

    return trained_models, train_times


# ── 5. EVALUATION & BENCHMARKING ──────────────────────────────────────────────
def evaluate_models(trained_models, X_test, y_test, X_train, y_train):
    print("\n" + "═" * 70)
    print("  COMPREHENSIVE MODEL EVALUATION ON UNSEEN TEST SET (N=100)")
    print("═" * 70)

    results = []
    confusion_matrices = {}
    roc_data = {}
    latencies = {}

    for name, model in trained_models.items():
        # Predictions
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)

        # Basic metrics
        acc = accuracy_score(y_test, y_pred)
        prec_macro = precision_score(y_test, y_pred, average='macro', zero_division=0)
        rec_macro = recall_score(y_test, y_pred, average='macro', zero_division=0)
        f1_macro = f1_score(y_test, y_pred, average='macro', zero_division=0)
        f1_weighted = f1_score(y_test, y_pred, average='weighted', zero_division=0)

        # Binarize labels matching exact model.classes_ ordering
        # Scikit-learn orders classes alphabetically: ['Large', 'Medium', 'Small']
        y_test_bin = label_binarize(y_test, classes=model.classes_)

        # ROC-AUC (One-vs-Rest, Macro average)
        roc_auc_macro = roc_auc_score(y_test_bin, y_prob, average='macro', multi_class='ovr')

        # Train accuracy to measure generalization gap (overfitting check)
        y_train_pred = model.predict(X_train)
        train_acc = accuracy_score(y_train, y_train_pred)
        gen_gap = (train_acc - acc) * 100.0

        # Latency Benchmark: 200 predictions (microsecond precision)
        single_sample = X_test.iloc[[0]]
        warmup = model.predict(single_sample)
        lat_runs = 200
        t0 = time.perf_counter()
        for _ in range(lat_runs):
            _ = model.predict(single_sample)
        total_time_s = time.perf_counter() - t0
        latency_us = (total_time_s / lat_runs) * 1e6  # microseconds per task
        throughput = lat_runs / total_time_s           # tasks/second
        latencies[name] = latency_us

        # Confusion Matrix (Standard class ordering: Small, Medium, Large)
        cm = confusion_matrix(y_test, y_pred, labels=CLASS_ORDER)
        confusion_matrices[name] = cm.tolist()

        # ROC curves per class (keyed by class name)
        roc_curves_dict = {}
        for idx, cls in enumerate(model.classes_):
            fpr, tpr, _ = roc_curve(y_test_bin[:, idx], y_prob[:, idx])
            roc_curves_dict[cls] = {
                'fpr': [round(x, 4) for x in fpr.tolist()],
                'tpr': [round(x, 4) for x in tpr.tolist()],
                'auc': round(auc(fpr, tpr), 4)
            }
        roc_data[name] = roc_curves_dict

        results.append({
            'Model': name,
            'Accuracy': round(acc * 100.0, 2),
            'Train Accuracy': round(train_acc * 100.0, 2),
            'Generalization Gap': round(gen_gap, 2),
            'Precision (Macro)': round(prec_macro * 100.0, 2),
            'Recall (Macro)': round(rec_macro * 100.0, 2),
            'F1-Score (Macro)': round(f1_macro * 100.0, 2),
            'F1-Score (Weighted)': round(f1_weighted * 100.0, 2),
            'ROC-AUC (OvR)': round(roc_auc_macro, 4),
            'Latency (us/task)': round(latency_us, 1),
            'Throughput (tasks/s)': round(throughput, 1)
        })

    results_df = pd.DataFrame(results)

    # Print Table
    print(f"\n  {'Model':<26}  {'Acc%':>6}  {'Prec%':>6}  {'Rec%':>6}  {'F1%':>6}  {'AUC':>6}  {'Lat(μs)':>8}  {'Gap%':>6}")
    print(f"  {'-'*26}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*8}  {'-'*6}")
    for _, r in results_df.iterrows():
        print(f"  {r['Model']:<26}  {r['Accuracy']:>6.2f}  {r['Precision (Macro)']:>6.2f}  {r['Recall (Macro)']:>6.2f}  {r['F1-Score (Macro)']:>6.2f}  {r['ROC-AUC (OvR)']:>6.4f}  {r['Latency (us/task)']:>8.1f}  {r['Generalization Gap']:>6.2f}")

    return results_df, confusion_matrices, roc_data, latencies


# ── 6. FEATURE IMPORTANCE ANALYSIS ───────────────────────────────────────────
def extract_feature_importances(trained_models, feature_cols):
    importance_dict = {}
    for name in ['Random Forest', 'Extra Trees', 'Gradient Boosting']:
        model = trained_models[name]
        imp = model.feature_importances_
        importance_dict[name] = {col: round(float(val), 4) for col, val in zip(feature_cols, imp)}

    print("\n" + "═" * 70)
    print("  FEATURE IMPORTANCE BREAKDOWN (Gini / Mean Decrease in Impurity)")
    print("═" * 70)
    print(f"  {'Feature':<18}  {'Random Forest':>14}  {'Extra Trees':>14}  {'Gradient Boost':>14}")
    print(f"  {'-'*18}  {'-'*14}  {'-'*14}  {'-'*14}")
    for col in feature_cols:
        rf_val = importance_dict['Random Forest'][col]
        et_val = importance_dict['Extra Trees'][col]
        gb_val = importance_dict['Gradient Boosting'][col]
        print(f"  {col:<18}  {rf_val:>14.4f}  {et_val:>14.4f}  {gb_val:>14.4f}")

    return importance_dict


# ── 7. GENERATE PUBLICATION-QUALITY PLOTS ─────────────────────────────────────
def generate_all_plots(results_df, confusion_matrices, roc_data, importance_dict, feature_cols, trained_models=None):
    plt.style.use('dark_background')
    colors = ['#00e676', '#29b6f6', '#ab47bc', '#ffa726', '#ef5350', '#26a69a', '#e91e63', '#7e57c2']

    # ── Figure 1: 4-Metric Model Comparison Bar Chart ─────────────────────────
    fig, ax = plt.subplots(figsize=(15, 6))
    x = np.arange(len(results_df))
    w = 0.20

    m1 = ax.bar(x - 1.5*w, results_df['Accuracy'], w, label='Accuracy', color='#00e676', alpha=0.9)
    m2 = ax.bar(x - 0.5*w, results_df['Precision (Macro)'], w, label='Precision', color='#29b6f6', alpha=0.9)
    m3 = ax.bar(x + 0.5*w, results_df['Recall (Macro)'], w, label='Recall', color='#ffa726', alpha=0.9)
    m4 = ax.bar(x + 1.5*w, results_df['F1-Score (Macro)'], w, label='F1-Score', color='#ab47bc', alpha=0.9)

    ax.set_xticks(x)
    ax.set_xticklabels([m.replace(' ', '\n') for m in results_df['Model']], fontsize=9)
    ax.set_ylim(80, 102)
    ax.set_ylabel('Percentage Score (%)', fontsize=12, fontweight='bold', color='#f4f4f5')
    ax.set_title('AI Runtime Governor — Model Evaluation Comparison Across 8 Algorithms (PBL-III)', fontsize=14, fontweight='bold', pad=15)
    ax.legend(loc='lower right', framealpha=0.4)
    ax.grid(axis='y', alpha=0.2, linestyle='--')
    plt.tight_layout()
    fig1_path = os.path.join(FIGURES_DIR, 'pbl3_ensemble_comparison_bar.png')
    fig.savefig(fig1_path, dpi=300)
    plt.close(fig)
    print(f"✓ Saved Figure 1: {fig1_path}")

    # ── Figure 2: 8-Panel Confusion Matrix Grid ───────────────────────────────
    fig, axes = plt.subplots(2, 4, figsize=(18, 9))
    axes_flat = axes.flatten()

    for idx, (name, cm) in enumerate(confusion_matrices.items()):
        if idx >= len(axes_flat):
            break
        ax = axes_flat[idx]
        sns.heatmap(
            cm, annot=True, fmt='d', cmap='Blues', cbar=False,
            xticklabels=CLASS_ORDER, yticklabels=CLASS_ORDER,
            ax=ax, annot_kws={'fontsize': 12, 'fontweight': 'bold'}
        )
        ax.set_title(f"{name}", fontsize=11, fontweight='bold', color='#f4f4f5')
        ax.set_xlabel('Predicted Model Tier', fontsize=9, color='#a1a1aa')
        ax.set_ylabel('Actual Ground Truth', fontsize=9, color='#a1a1aa')

    fig.suptitle('Confusion Matrix Multi-Model Grid (Test Set N=100)', fontsize=15, fontweight='bold', y=0.98)
    plt.tight_layout()
    fig2_path = os.path.join(FIGURES_DIR, 'pbl3_confusion_matrices.png')
    fig.savefig(fig2_path, dpi=300)
    plt.close(fig)
    print(f"✓ Saved Figure 2: {fig2_path}")

    # ── Figure 3: Multi-Class ROC-AUC Curves ──────────────────────────────────
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    class_colors = {'Small': '#00e676', 'Medium': '#ffa726', 'Large': '#ef5350'}

    for idx, cls in enumerate(CLASS_ORDER):
        ax = axes[idx]
        ax.plot([0, 1], [0, 1], 'k--', alpha=0.4, label='Chance')
        for m_name, color in zip(results_df['Model'], colors):
            fpr = roc_data[m_name][cls]['fpr']
            tpr = roc_data[m_name][cls]['tpr']
            c_auc = roc_data[m_name][cls]['auc']
            ax.plot(fpr, tpr, label=f"{m_name} (AUC={c_auc:.3f})", linewidth=1.5)
        ax.set_title(f"ROC Curves — Tier: {cls.upper()}", fontsize=12, fontweight='bold', color=class_colors[cls])
        ax.set_xlabel('False Positive Rate', fontsize=10)
        ax.set_ylabel('True Positive Rate', fontsize=10)
        ax.legend(fontsize=7, loc='lower right', framealpha=0.3)
        ax.grid(alpha=0.2)

    fig.suptitle('Multi-Class One-vs-Rest (OvR) ROC Curves across 8 Models', fontsize=14, fontweight='bold')
    plt.tight_layout()
    fig3_path = os.path.join(FIGURES_DIR, 'pbl3_roc_curves.png')
    fig.savefig(fig3_path, dpi=300)
    plt.close(fig)
    print(f"✓ Saved Figure 3: {fig3_path}")

    # ── Figure 4: Feature Importance Comparison ──────────────────────────────
    fig, ax = plt.subplots(figsize=(10, 5))
    x_feat = np.arange(len(feature_cols))
    w_feat = 0.25

    ax.bar(x_feat - w_feat, [importance_dict['Random Forest'][c] for c in feature_cols], w_feat, label='Random Forest', color='#00e676', alpha=0.9)
    ax.bar(x_feat,          [importance_dict['Extra Trees'][c] for c in feature_cols],   w_feat, label='Extra Trees',   color='#29b6f6', alpha=0.9)
    ax.bar(x_feat + w_feat, [importance_dict['Gradient Boosting'][c] for c in feature_cols], w_feat, label='Gradient Boosting', color='#ffa726', alpha=0.9)

    ax.set_xticks(x_feat)
    ax.set_xticklabels(feature_cols, fontsize=11, fontweight='bold')
    ax.set_ylabel('Gini Importance (Normalized)', fontsize=11, fontweight='bold')
    ax.set_title('Feature Importance Decomposition Across Tree Ensembles', fontsize=13, fontweight='bold', pad=12)
    ax.legend(framealpha=0.4)
    ax.grid(axis='y', alpha=0.2, linestyle='--')
    plt.tight_layout()
    fig4_path = os.path.join(FIGURES_DIR, 'pbl3_feature_importance.png')
    fig.savefig(fig4_path, dpi=300)
    plt.close(fig)
    print(f"✓ Saved Figure 4: {fig4_path}")

    # ── Figure 5: Pareto Frontier (Accuracy vs Inference Latency) ────────────
    fig, ax = plt.subplots(figsize=(9, 5))
    for i, row in results_df.iterrows():
        ax.scatter(row['Latency (us/task)'], row['Accuracy'], s=160, color=colors[i], label=row['Model'], zorder=4)
        ax.annotate(
            row['Model'], (row['Latency (us/task)'], row['Accuracy']),
            textcoords="offset points", xytext=(8, -4), fontsize=9, color='#f4f4f5'
        )

    ax.set_xlabel('Inference Latency per Task (microseconds, log scale)', fontsize=11, fontweight='bold')
    ax.set_ylabel('Test Accuracy (%)', fontsize=11, fontweight='bold')
    ax.set_xscale('log')
    ax.set_ylim(85, 100)
    ax.set_title('AI Runtime Governor — Latency vs Accuracy Tradeoff Frontier', fontsize=13, fontweight='bold', pad=12)
    ax.grid(alpha=0.2, linestyle='--')
    plt.tight_layout()
    fig5_path = os.path.join(FIGURES_DIR, 'pbl3_latency_vs_accuracy.png')
    fig.savefig(fig5_path, dpi=300)
    plt.close(fig)
    print(f"✓ Saved Figure 5: {fig5_path}")

    # ── Figure 6: Bayesian Model Averaging (BMA) Posterior Weight Distribution ─
    if trained_models and 'Bayesian Model Averaging' in trained_models:
        bma_model = trained_models['Bayesian Model Averaging']
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
        base_names = ['Random Forest', 'Extra Trees', 'Gradient Boosting']
        short_keys = ['rf', 'et', 'gb']
        bar_colors = ['#29b6f6', '#ab47bc', '#ffa726']

        # Panel 1: Out-of-Fold Cross-Entropy Log-Likelihoods
        ll_vals = [bma_model.log_likelihoods_[k] for k in short_keys]
        bars1 = ax1.bar(base_names, ll_vals, color=bar_colors, alpha=0.85, width=0.45)
        ax1.set_ylabel('Out-of-Fold Log-Likelihood (log L)', fontsize=11, fontweight='bold')
        ax1.set_title('Base Model Empirical Evidence on Validation Folds (N=400)', fontsize=12, fontweight='bold')
        ax1.grid(axis='y', alpha=0.2, linestyle='--')
        for bar in bars1:
            yval = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2.0, yval - 12, f"{yval:.1f}", ha='center', va='top', fontsize=10, fontweight='bold', color='white')

        # Panel 2: Soft Voting (Uniform 1/3) vs. BMA Posterior Weights P(M_k|D)
        w_bma = [bma_model.posterior_weights_[k] for k in short_keys]
        w_uniform = [1.0/3.0, 1.0/3.0, 1.0/3.0]
        x_idx = np.arange(len(base_names))
        bw = 0.35

        ax2.bar(x_idx - bw/2, w_uniform, bw, label='Uniform Prior / Soft Voting (1/3)', color='#757575', alpha=0.7)
        ax2.bar(x_idx + bw/2, w_bma, bw, label='BMA Posterior Weight P(M_k|D)', color='#00e676', alpha=0.9)
        ax2.set_xticks(x_idx)
        ax2.set_xticklabels(base_names, fontsize=10, fontweight='bold')
        ax2.set_ylabel('Model Weight', fontsize=11, fontweight='bold')
        ax2.set_ylim(0, 1.05)
        ax2.set_title('Soft Voting (Fixed 1/3) vs BMA Posterior Weight Allocation', fontsize=12, fontweight='bold')
        ax2.legend(loc='upper left', framealpha=0.4)
        ax2.grid(axis='y', alpha=0.2, linestyle='--')
        for idx_b, val in enumerate(w_bma):
            ax2.text(idx_b + bw/2, val + 0.02, f"{val*100:.1f}%", ha='center', va='bottom', fontsize=10, fontweight='bold', color='#00e676')

        fig.suptitle('Bayesian Model Averaging (BMA) — Statistical Evidence & Weight Formulation', fontsize=14, fontweight='bold', y=0.98)
        plt.tight_layout()
        fig6_path = os.path.join(FIGURES_DIR, 'pbl3_bma_posterior_weights.png')
        fig.savefig(fig6_path, dpi=300)
        plt.close(fig)
        print(f"✓ Saved Figure 6: {fig6_path}")


# ── 8. PERSIST BEST MODEL & UPDATE ml_results.json ────────────────────────────
def persist_and_integrate(trained_models, results_df, confusion_matrices, roc_data, importance_dict, latencies):
    # Select best model based on F1-Score (Macro)
    best_row = results_df.sort_values(by=['F1-Score (Macro)', 'Accuracy'], ascending=False).iloc[0]
    best_model_name = best_row['Model']
    best_model = trained_models[best_model_name]

    model_save_path = os.path.join(SAVED_MODELS_DIR, 'best_ensemble_model.joblib')
    joblib.dump(best_model, model_save_path)
    print(f"\n✓ Best model selected: '{best_model_name}' (F1={best_row['F1-Score (Macro)']:.2f}%)")
    print(f"✓ Saved best model artifact to {model_save_path}")

    # Also persist each individual model artifact for independent generalization evaluation
    model_filenames = {
        'Decision Tree (Baseline)': 'decision_tree.joblib',
        'Random Forest': 'random_forest.joblib',
        'Extra Trees': 'extra_trees.joblib',
        'AdaBoost': 'adaboost.joblib',
        'Gradient Boosting': 'gradient_boosting.joblib',
        'Soft Voting Classifier': 'soft_voting.joblib',
        'Bayesian Model Averaging': 'bayesian_model_averaging.joblib',
        'Stacking Classifier': 'stacking.joblib',
    }
    for m_name, m_obj in trained_models.items():
        fname = model_filenames.get(m_name)
        if fname:
            fpath = os.path.join(SAVED_MODELS_DIR, fname)
            joblib.dump(m_obj, fpath)
    print(f"✓ Saved all 8 individual model artifacts to {SAVED_MODELS_DIR}/")

    # Update existing ml_results.json without breaking any PBL-II keys
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, 'r') as f:
            existing_data = json.load(f)
    else:
        existing_data = {}

    bma_info = {}
    if 'Bayesian Model Averaging' in trained_models:
        bma_obj = trained_models['Bayesian Model Averaging']
        bma_info = {
            'log_likelihoods': bma_obj.log_likelihoods_,
            'posterior_weights': bma_obj.posterior_weights_,
            'raw_weights': bma_obj.raw_weights_,
            'oof_accuracy': bma_obj.oof_accuracy_
        }

    ensemble_payload = {
        'status': 'verified',
        'generated_at': datetime.now().isoformat(),
        'best_model': {
            'name': best_model_name,
            'accuracy': float(best_row['Accuracy']),
            'f1_macro': float(best_row['F1-Score (Macro)']),
            'roc_auc': float(best_row['ROC-AUC (OvR)']),
            'latency_us': float(best_row['Latency (us/task)']),
            'artifact_path': 'saved_models/best_ensemble_model.joblib'
        },
        'comparison_table': results_df.to_dict(orient='records'),
        'confusion_matrices': confusion_matrices,
        'feature_importances': importance_dict,
        'bma_analysis': bma_info,
        'class_order': CLASS_ORDER
    }

    existing_data['ensemble_analysis'] = ensemble_payload

    export_json_paths = [
        JSON_PATH,
        os.path.join(PROJECT_DIR, 'scratch', 'ai-runtime-governor', 'src', 'data', 'ml_results.json'),
        os.path.join(PROJECT_DIR, 'scratch', 'ai-runtime-governor', 'public', 'ml_results.json')
    ]

    for p in export_json_paths:
        if os.path.exists(os.path.dirname(p)):
            try:
                target_data = existing_data
                if os.path.exists(p) and p != JSON_PATH:
                    with open(p, 'r') as f_target:
                        target_data = json.load(f_target)
                    target_data['ensemble_analysis'] = ensemble_payload
                with open(p, 'w') as f_out:
                    json.dump(target_data, f_out, indent=2)
                print(f"✓ Updated {p} with 'ensemble_analysis' section")
            except Exception as e:
                print(f"⚠ Could not update {p}: {e}")


# ── 9. MAIN PIPELINE EXECUTION ────────────────────────────────────────────────
def main():
    print("═" * 70)
    print("  AI RUNTIME GOVERNOR — PBL-III ENSEMBLE PIPELINE START")
    print("═" * 70)

    # 1. Dataset
    df = generate_or_load_dataset()

    # 2. Preprocess & Stratified Split
    X_train, X_test, y_train, y_test, feature_cols, scaler = prepare_data(df)

    # 3. Build & Train Models
    trained_models, train_times = build_and_train_models(X_train, y_train)

    # 4. Evaluate & Benchmark
    results_df, confusion_matrices, roc_data, latencies = evaluate_models(
        trained_models, X_test, y_test, X_train, y_train
    )

    # 5. Feature Importance
    importance_dict = extract_feature_importances(trained_models, feature_cols)

    # 6. Generate Figures
    generate_all_plots(results_df, confusion_matrices, roc_data, importance_dict, feature_cols, trained_models=trained_models)

    # 7. Model Persistence & JSON Update
    persist_and_integrate(trained_models, results_df, confusion_matrices, roc_data, importance_dict, latencies)

    print("\n" + "═" * 70)
    print("  AI RUNTIME GOVERNOR — ENSEMBLE PIPELINE COMPLETED SUCCESSFULLY")
    print("═" * 70 + "\n")


if __name__ == '__main__':
    main()
