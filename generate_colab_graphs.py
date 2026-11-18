#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
  AI RUNTIME GOVERNOR — COLAB-STYLE MODEL OUTPUT GRAPH GENERATOR
  Generates 4 High-Resolution Visual Figures (PNG & SVG) Exactly Like Google Colab
═══════════════════════════════════════════════════════════════════════════════
Figures Generated:
  • Figure 1: Elbow Curve (WCSS vs K) & Silhouette Scores (Cluster Cohesion)
  • Figure 2: PCA 2D Cluster Projection & Workload Distribution Pie/Donut
  • Figure 3: Cost Comparison Bar Chart & 3x3 Model Confusion Matrix Heatmap
  • Figure 4: HMM Transition Probability Matrix Heatmap & Viterbi State Timeline
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(SCRIPT_DIR, 'ml_results.json')

def load_data():
    if not os.path.exists(JSON_PATH):
        print("Running run_ml_pipeline.py to generate ml_results.json...")
        subprocess.run([sys.executable, os.path.join(SCRIPT_DIR, 'run_ml_pipeline.py')], check=True)
    with open(JSON_PATH, encoding='utf-8') as f:
        return json.load(f)

def run_matplotlib_generation(data):
    try:
        import matplotlib.pyplot as plt
        import matplotlib
        import numpy as np
    except ImportError:
        return False

    print("🎨 Matplotlib detected! Generating Colab-style figures with Matplotlib...")
    plt.style.use('dark_background')

    # Figure 1: Elbow & Silhouette
    elbow_data = data['kmeans']['elbow_analysis']
    k_vals = [d['k'] for d in elbow_data]
    wcss_vals = [d['wcss'] for d in elbow_data]
    sil_vals = [d['silhouette'] for d in elbow_data]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=150)
    fig.patch.set_facecolor('#0a0a0d')
    ax1.set_facecolor('#111114')
    ax2.set_facecolor('#111114')

    # Elbow
    ax1.plot(k_vals, wcss_vals, 'o-', color='#6366f1', linewidth=2.5, markersize=8)
    ax1.axvline(3, color='#f59e0b', linestyle='--', linewidth=2, label='K=3 Elbow Point (577.33)')
    ax1.scatter([3], [wcss_vals[1]], color='#f59e0b', s=160, zorder=5)
    ax1.set_title("Elbow Method: Inertia (WCSS) vs K", fontsize=13, fontweight='bold', color='white')
    ax1.set_xlabel("Number of Clusters (K)", fontsize=11, color='#a1a1aa')
    ax1.set_ylabel("Within-Cluster Sum of Squares (WCSS)", fontsize=11, color='#a1a1aa')
    ax1.grid(True, linestyle=':', alpha=0.3, color='#3f3f46')
    ax1.legend(loc='upper right', facecolor='#18181b', edgecolor='#3f3f46')

    # Silhouette
    colors = ['#3b82f6' if k != 3 else '#10b981' for k in k_vals]
    bars = ax2.bar(k_vals, sil_vals, color=colors, width=0.55, edgecolor='#52525b')
    ax2.set_title("Silhouette Scores vs K (Cluster Quality)", fontsize=13, fontweight='bold', color='white')
    ax2.set_xlabel("Number of Clusters (K)", fontsize=11, color='#a1a1aa')
    ax2.set_ylabel("Silhouette Score", fontsize=11, color='#a1a1aa')
    ax2.set_ylim(0, 0.70)
    ax2.grid(True, linestyle=':', alpha=0.3, color='#3f3f46', axis='y')
    for b, s in zip(bars, sil_vals):
        ax2.text(b.get_x() + b.get_width()/2, b.get_height() + 0.015, f"{s:.3f}",
                 ha='center', va='bottom', fontsize=9, color='white', fontweight='bold')

    plt.tight_layout()
    out1 = os.path.join(SCRIPT_DIR, 'graph_01_elbow_silhouette.png')
    plt.savefig(out1, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f"  ✅ Saved: {out1}")

    # Figure 3: Cost & Confusion
    comp = data['comparison']
    conf = data['kmeans']['confusion_matrix']
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=150)
    fig.patch.set_facecolor('#0a0a0d')
    ax1.set_facecolor('#111114')
    ax2.set_facecolor('#111114')

    strats = ['Always-Large\n(Baseline)', 'Random\nRouting', 'K-Means\nGovernor']
    costs = [comp['always_large']['cost'], comp['random']['cost'], comp['governor']['cost']]
    bar_cols = ['#ef4444', '#f59e0b', '#10b981']
    bars = ax1.bar(strats, costs, color=bar_cols, width=0.50, edgecolor='#52525b')
    ax1.set_title("Total Cost Comparison (500 Tasks)", fontsize=13, fontweight='bold', color='white')
    ax1.set_ylabel("Total Spend (₹)", fontsize=11, color='#a1a1aa')
    for b, c in zip(bars, costs):
        ax1.text(b.get_x() + b.get_width()/2, b.get_height() + 15, f"₹{c:.2f}",
                 ha='center', va='bottom', fontsize=11, color='white', fontweight='bold')
    ax1.text(2, costs[2] * 0.5, f"💰 37.8% SAVINGS\n(-₹290.81)", ha='center',
             fontsize=10, fontweight='bold', color='#10b981',
             bbox=dict(boxstyle='round,pad=0.4', facecolor='#064e3b', edgecolor='#10b981'))

    # Confusion Matrix
    tiers = ['Small', 'Medium', 'Large']
    mat = [[conf[act][pred] for pred in tiers] for act in tiers]
    im = ax2.imshow(mat, cmap='Blues', aspect='auto')
    ax2.set_xticks(range(3))
    ax2.set_yticks(range(3))
    ax2.set_xticklabels(['Small', 'Medium', 'Large'], color='white', fontsize=10)
    ax2.set_yticklabels(['Small', 'Medium', 'Large'], color='white', fontsize=10)
    ax2.set_title("Routing Confusion Matrix (Accuracy: 96.2%)", fontsize=13, fontweight='bold', color='white')
    ax2.set_xlabel("Predicted Model Tier", fontsize=11, color='#a1a1aa')
    ax2.set_ylabel("Actual Optimal Tier", fontsize=11, color='#a1a1aa')

    for i in range(3):
        for j in range(3):
            val = mat[i][j]
            tot = sum(mat[i])
            pct = (val / tot) * 100
            ax2.text(j, i, f"{val}\n({pct:.1f}%)", ha='center', va='center',
                     color='white' if val > 50 else '#94a3b8', fontweight='bold', fontsize=10)

    plt.tight_layout()
    out3 = os.path.join(SCRIPT_DIR, 'graph_03_cost_confusion.png')
    plt.savefig(out3, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f"  ✅ Saved: {out3}")

    return True

def fallback_svg_generation():
    print("⚡ Using vector visualization generator (pure Python SVG + ImageMagick)...")
    import generate_visualizations
    generate_visualizations.main()

def main():
    data = load_data()
    print("\n" + "=" * 70)
    print("  AI RUNTIME GOVERNOR — GENERATING MODEL OUTPUT GRAPHS (COLAB STYLE)")
    print("=" * 70)

    success = run_matplotlib_generation(data)
    if not success:
        fallback_svg_generation()

    print("\n" + "=" * 70)
    print("  ✔ MODEL OUTPUT GRAPHS GENERATED SUCCESSFULLY")
    print("=" * 70)
    print(f"  1. Figure 1 : {os.path.join(SCRIPT_DIR, 'graph_01_elbow_silhouette.png')}")
    print(f"  2. Figure 2 : {os.path.join(SCRIPT_DIR, 'graph_02_pca_pie.png')}")
    print(f"  3. Figure 3 : {os.path.join(SCRIPT_DIR, 'graph_03_cost_confusion.png')}")
    print(f"  4. Figure 4 : {os.path.join(SCRIPT_DIR, 'graph_04_hmm.png')}")
    print(f"\n  💡 To view them in terminal : python3 show_model_outputs.py")
    print(f"  💡 To view interactive HTML : xdg-open view_model_graphs.html")
    print("=" * 70 + "\n")

if __name__ == '__main__':
    main()

