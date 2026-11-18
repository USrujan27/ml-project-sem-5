#!/usr/bin/env python3
"""
AI Runtime Governor — Google Colab Style ML Graphs (K-Means & HMM)
==================================================================
Generates and displays standard Matplotlib publication graphs matching the
Google Colab notebook (`ai_runtime_governor_ml.ipynb`) from `ml_results.json`.

Figures:
  1. K-Means Clustering Analysis (2x2):
     - Elbow Method (WCSS vs K=2..8)
     - Silhouette Scores vs K
     - 2D PCA Cluster Projection (Real Eigen-decomposition + Centroids)
     - 3x3 Routing Confusion Matrix Heatmap (%)
  2. Hidden Markov Model (HMM) & Cost Impact Analysis (2x2):
     - Viterbi Decoded Hidden State Sequence (50 Tasks)
     - HMM Transition Probability Matrix A
     - HMM Emission Probability Matrix B
     - Total Cost Comparison & Savings Benchmark (500 Tasks)
"""

import json
import os
import sys

import matplotlib

if "--save-only" in sys.argv or not (os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY")):
    matplotlib.use("Agg")

import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(SCRIPT_DIR, "ml_results.json")
KMEANS_PNG = os.path.join(SCRIPT_DIR, "kmeans_colab_graph.png")
HMM_PNG = os.path.join(SCRIPT_DIR, "hmm_colab_graph.png")

TASK_TYPES = [
    "Classification", "Summary", "Extraction", "Conversational",
    "Coding", "Reasoning", "Agentic",
]
DIFF_ENC = {"Easy": 0.0, "Medium": 1.0, "Hard": 2.0}
COLOR_MAP = {"Small": "#00e676", "Medium": "#ff9800", "Large": "#f44336"}
REGIME_MAP = {"Lean Mode": "#00e676", "Balanced Mode": "#ff9800", "Premium Mode": "#f44336"}


def load_results():
    """Load evaluated model outputs from ml_results.json."""
    if not os.path.exists(JSON_PATH):
        raise FileNotFoundError(
            f"Missing {JSON_PATH}. Run run_ml_pipeline.py once to generate it."
        )
    with open(JSON_PATH, encoding="utf-8") as f:
        return json.load(f)


def compute_pca_2d(executions):
    """Standardize 5D task features and compute 2D PCA projection via NumPy."""
    features = []
    labels = []
    for ex in executions:
        t_enc = float(TASK_TYPES.index(ex["taskType"])) if ex["taskType"] in TASK_TYPES else 0.0
        d_enc = DIFF_ENC.get(ex["difficulty"], 1.0)
        features.append([
            float(ex["inputTokens"]),
            float(ex["outputTokens"]),
            float(ex["latency"]),
            t_enc,
            d_enc,
        ])
        labels.append(ex["selectedModel"])

    x = np.array(features, dtype=float)
    z = (x - x.mean(axis=0)) / np.where(x.std(axis=0) > 1e-9, x.std(axis=0), 1.0)

    cov = np.cov(z, rowvar=False)
    eigvals, eigvecs = np.linalg.eigh(cov)
    order = np.argsort(eigvals)[::-1]
    eigvals = np.maximum(eigvals[order], 0.0)
    eigvecs = eigvecs[:, order]

    x_pca = z @ eigvecs[:, :2]
    # Orient PC1 positively with prompt size so Small -> Medium -> Large runs left to right
    if np.corrcoef(x_pca[:, 0], x[:, 0])[0, 1] < 0:
        x_pca[:, 0] *= -1.0
    var_ratio = eigvals[:2] / eigvals.sum()
    return x_pca, np.array(labels), var_ratio


def annotate_heatmap(ax, mat, row_labels, col_labels, cmap, fmt=".3f",
                     vmin=None, vmax=None, cbar_label="Probability", title=""):
    """Render an annotated Matplotlib heatmap with colorbar (Colab/Seaborn style)."""
    im = ax.imshow(mat, cmap=cmap, aspect="auto", vmin=vmin, vmax=vmax)
    cbar = plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.set_label(cbar_label, color="white", fontsize=10)
    cbar.ax.yaxis.set_tick_params(color="white")
    plt.setp(cbar.ax.get_yticklabels(), color="white", fontsize=9)

    ax.set_xticks(np.arange(len(col_labels)))
    ax.set_yticks(np.arange(len(row_labels)))
    ax.set_xticklabels(col_labels, fontsize=10, color="white")
    ax.set_yticklabels(row_labels, fontsize=10, color="white")
    ax.set_title(title, fontsize=12.5, fontweight="bold", pad=10, color="white")

    # Subtle cell gridlines
    ax.set_xticks(np.arange(-0.5, len(col_labels), 1), minor=True)
    ax.set_yticks(np.arange(-0.5, len(row_labels), 1), minor=True)
    ax.grid(which="minor", color="#2a2a2a", linestyle="-", linewidth=1.2)
    ax.tick_params(which="minor", bottom=False, left=False)

    for i in range(mat.shape[0]):
        for j in range(mat.shape[1]):
            val = mat[i, j]
            r, g, b, _ = im.cmap(im.norm(val))
            luminance = 0.299 * r + 0.587 * g + 0.114 * b
            text_color = "#111111" if luminance > 0.52 else "white"
            ax.text(
                j, i, format(val, fmt),
                ha="center", va="center",
                color=text_color, fontsize=11, fontweight="bold",
            )


def plot_kmeans_graphs(data):
    """Plot Figure 1: K-Means Clustering Analysis (2x2 Colab grid)."""
    plt.style.use("dark_background")
    km = data["kmeans"]
    elbow = km["elbow_analysis"]
    k_vals = [d["k"] for d in elbow]
    wcss_vals = [d["wcss"] for d in elbow]
    sil_vals = [d["silhouette"] for d in elbow]

    fig, axes = plt.subplots(2, 2, figsize=(15, 10.5), dpi=130)
    fig.patch.set_facecolor("#121212")
    fig.suptitle(
        f"AI Runtime Governor — K-Means Clustering Analysis (K={km['optimal_k']}, "
        f"Accuracy={km['routing_accuracy']:.1f}%)",
        fontsize=15, fontweight="bold", color="white", y=0.98,
    )

    # 1. Elbow Curve (WCSS vs K)
    ax1 = axes[0, 0]
    ax1.set_facecolor("#1a1a1a")
    ax1.plot(k_vals, wcss_vals, "o-", color="#64b5f6", linewidth=2.5, markersize=8)
    ax1.axvline(x=3, color="#ffeb3b", linestyle="--", linewidth=2,
                label=f"Optimal K=3 (WCSS={km['wcss']:.2f})")
    ax1.fill_between(k_vals, wcss_vals, alpha=0.15, color="#64b5f6")
    for k, w in zip(k_vals, wcss_vals):
        if k == 3:
            ax1.text(k - 0.14, w - 35, f"{w:.0f}", ha="right", va="top", fontsize=9.5,
                     color="#ffeb3b", fontweight="bold")
        else:
            ax1.text(k, w + 25, f"{w:.0f}", ha="center", va="bottom", fontsize=9, color="#e0e0e0")
    ax1.set_title("Elbow Method (WCSS vs K)", fontsize=12.5, fontweight="bold", pad=10)
    ax1.set_xlabel("Number of Clusters (K)", fontsize=11)
    ax1.set_ylabel("WCSS (Inertia)", fontsize=11)
    ax1.set_xticks(k_vals)
    ax1.set_ylim(250, 1050)
    ax1.legend(fontsize=10, loc="upper right")
    ax1.grid(True, alpha=0.3)

    # 2. Silhouette Scores vs K
    ax2 = axes[0, 1]
    ax2.set_facecolor("#1a1a1a")
    bar_colors = ["#ffeb3b" if k == 3 else "#64b5f6" for k in k_vals]
    bars = ax2.bar(k_vals, sil_vals, color=bar_colors, edgecolor="white", linewidth=0.8, width=0.58)
    for bar, score in zip(bars, sil_vals):
        ax2.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
                 f"{score:.3f}", ha="center", va="bottom", fontsize=9.5, color="white", fontweight="bold")
    ax2.set_title("Silhouette Scores vs K", fontsize=12.5, fontweight="bold", pad=10)
    ax2.set_xlabel("Number of Clusters (K)", fontsize=11)
    ax2.set_ylabel("Silhouette Score", fontsize=11)
    ax2.set_xticks(k_vals)
    ax2.set_ylim(0, 0.68)
    ax2.grid(True, alpha=0.3, axis="y")

    # 3. PCA 2D Cluster Projection
    ax3 = axes[1, 0]
    ax3.set_facecolor("#1a1a1a")
    x_pca, labels, var_ratio = compute_pca_2d(data["executions"])
    for model in ["Small", "Medium", "Large"]:
        mask = labels == model
        ax3.scatter(
            x_pca[mask, 0], x_pca[mask, 1],
            c=COLOR_MAP[model], label=model, alpha=0.75, s=48, edgecolors="white", linewidths=0.4,
        )
        if np.any(mask):
            cx, cy = x_pca[mask, 0].mean(), x_pca[mask, 1].mean()
            ax3.scatter(
                cx, cy, c=COLOR_MAP[model], marker="*", s=380,
                edgecolors="white", linewidths=1.5, zorder=5,
            )
    ax3.set_title("K-Means Clusters — PCA 2D Projection", fontsize=12.5, fontweight="bold", pad=10)
    ax3.set_xlabel(f"PC1 ({var_ratio[0] * 100:.1f}% variance)", fontsize=11)
    ax3.set_ylabel(f"PC2 ({var_ratio[1] * 100:.1f}% variance)", fontsize=11)
    ax3.set_ylim(x_pca[:, 1].min() - 0.22, x_pca[:, 1].max() + 0.55)
    ax3.legend(title="Model Tier", fontsize=9.5, title_fontsize=10, loc="upper center", ncol=3)
    ax3.grid(True, alpha=0.25)

    # 4. Confusion Matrix Heatmap (%)
    ax4 = axes[1, 1]
    ax4.set_facecolor("#1a1a1a")
    tiers = ["Small", "Medium", "Large"]
    cm = np.array([[km["confusion_matrix"][a][p] for p in tiers] for a in tiers], dtype=float)
    cm_pct = cm / cm.sum(axis=1, keepdims=True) * 100.0
    annotate_heatmap(
        ax4, cm_pct, tiers, tiers, cmap="YlOrRd", fmt=".1f",
        vmin=0, vmax=100, cbar_label="% of Actual Class",
        title=f"K-Means Routing Confusion Matrix (Acc: {km['routing_accuracy']:.1f}%)",
    )
    ax4.set_xlabel("Predicted Model Tier", fontsize=11)
    ax4.set_ylabel("Actual Optimal Tier", fontsize=11)

    plt.tight_layout(rect=[0, 0, 1, 0.95])
    if getattr(fig.canvas, "manager", None) is not None:
        fig.canvas.manager.set_window_title("AI Runtime Governor — K-Means Graphs")
    fig.savefig(KMEANS_PNG, dpi=130, facecolor=fig.get_facecolor())
    return fig


def plot_hmm_graphs(data):
    """Plot Figure 2: HMM Workload Analysis & Cost Impact (2x2 Colab grid)."""
    plt.style.use("dark_background")
    hmm = data["hmm"]
    comp = data["comparison"]

    fig, axes = plt.subplots(2, 2, figsize=(15, 10.5), dpi=130)
    fig.patch.set_facecolor("#121212")
    fig.suptitle(
        f"AI Runtime Governor — Hidden Markov Model (HMM) Analysis "
        f"(Log-Likelihood={hmm['log_likelihood']:.2f}, Premium Persistence={hmm['premium_persistence_pct']:.1f}%)",
        fontsize=14.5, fontweight="bold", color="white", y=0.98,
    )

    # 1. HMM Hidden State Sequence (Viterbi Decoded)
    ax1 = axes[0, 0]
    ax1.set_facecolor("#1a1a1a")
    regimes = [ex["traceSteps"][2]["metadata"]["regime"] for ex in data["executions"]]
    y_lookup = {"Lean Mode": 0, "Balanced Mode": 1, "Premium Mode": 2}
    ts_y = [y_lookup.get(r, 1) for r in regimes]
    n_show = len(regimes)

    for i in range(n_show - 1):
        col = REGIME_MAP.get(regimes[i], "#78909c")
        ax1.plot([i, i + 1], [ts_y[i], ts_y[i]], color=col, linewidth=3, solid_capstyle="round")
        if ts_y[i] != ts_y[i + 1]:
            ax1.plot([i + 1, i + 1], [ts_y[i], ts_y[i + 1]], color="#90a4ae",
                     linewidth=1.4, linestyle="--", alpha=0.6)

    for reg, yv in y_lookup.items():
        idx = [i for i, r in enumerate(regimes) if r == reg]
        ax1.scatter(idx, [yv] * len(idx), color=REGIME_MAP[reg], s=26, zorder=5)

    ax1.set_yticks([0, 1, 2])
    ax1.set_yticklabels(["Lean\n(Small)", "Balanced\n(Medium)", "Premium\n(Large)"], fontsize=10)
    ax1.set_xlabel("Task Index (Chronological Execution Sequence)", fontsize=11)
    ax1.set_title(f"HMM Viterbi Hidden State Sequence ({n_show} Tasks)", fontsize=12.5, fontweight="bold", pad=10)
    ax1.set_xlim(-1, n_show)
    ax1.set_ylim(-0.35, 2.75)
    ax1.grid(True, alpha=0.25, axis="x")
    patches = [mpatches.Patch(color=c, label=r.replace(" Mode", "")) for r, c in REGIME_MAP.items()]
    ax1.legend(handles=patches, fontsize=9.5, loc="upper center", ncol=3, frameon=True)

    # 2. HMM Transition Matrix A
    ax2 = axes[0, 1]
    ax2.set_facecolor("#1a1a1a")
    states = ["Lean", "Balanced", "Premium"]
    trans_mat = np.array(hmm["transition_matrix"], dtype=float)
    annotate_heatmap(
        ax2, trans_mat, states, states, cmap="RdYlGn", fmt=".3f",
        vmin=0.0, vmax=1.0, cbar_label="Transition Probability",
        title="HMM Transition Matrix A  P(State_t+1 | State_t)",
    )
    ax2.set_xlabel("To State (t + 1)", fontsize=11)
    ax2.set_ylabel("From State (t)", fontsize=11)

    # 3. HMM Emission Matrix B
    ax3 = axes[1, 0]
    ax3.set_facecolor("#1a1a1a")
    tiers = ["Small", "Medium", "Large"]
    emit_mat = np.array(hmm["emission_matrix"], dtype=float)
    annotate_heatmap(
        ax3, emit_mat, states, tiers, cmap="Blues", fmt=".2f",
        vmin=0.0, vmax=1.0, cbar_label="Emission Probability",
        title="HMM Emission Matrix B  P(Model_t | State_t)",
    )
    ax3.set_xlabel("Observed Model Tier", fontsize=11)
    ax3.set_ylabel("Hidden Workload State", fontsize=11)

    # 4. Total Cost Comparison Bar Chart
    ax4 = axes[1, 1]
    ax4.set_facecolor("#1a1a1a")
    strategies = ["Always-Large\n(Baseline)", "Random\nRouting", "K-Means + HMM\nGovernor"]
    costs = [comp["always_large"]["cost"], comp["random"]["cost"], comp["governor"]["cost"]]
    bar_cols = ["#f44336", "#ff9800", "#00e676"]

    bars = ax4.bar(strategies, costs, color=bar_cols, edgecolor="white", linewidth=0.9, width=0.48)
    for bar, cost in zip(bars, costs):
        ax4.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 14,
                 f"₹{cost:.2f}", ha="center", va="bottom", fontsize=11.5, fontweight="bold", color="white")

    ax4.set_title("Total Cost Comparison (₹) — 500 Tasks", fontsize=12.5, fontweight="bold", pad=10)
    ax4.set_ylabel("Total Cost (₹)", fontsize=11)
    ax4.set_ylim(0, max(costs) * 1.18)
    ax4.grid(True, alpha=0.3, axis="y")

    ax4.annotate(
        f"  {comp['savings']['percent']:.1f}% savings!\n  (-₹{comp['savings']['rupees']:.2f})",
        xy=(2, costs[2] + 55),
        xytext=(1.32, costs[0] * 0.88),
        fontsize=10.5, color="#ffeb3b", fontweight="bold",
        arrowprops=dict(arrowstyle="->", color="#ffeb3b", lw=2),
    )

    plt.tight_layout(rect=[0, 0, 1, 0.95])
    if getattr(fig.canvas, "manager", None) is not None:
        fig.canvas.manager.set_window_title("AI Runtime Governor — HMM Graphs")
    fig.savefig(HMM_PNG, dpi=130, facecolor=fig.get_facecolor())
    return fig


def main():
    args = set(sys.argv[1:])
    run_kmeans = "--kmeans" in args or "--hmm" not in args
    run_hmm = "--hmm" in args or "--kmeans" not in args

    data = load_results()
    if run_kmeans:
        plot_kmeans_graphs(data)
        print(f"Generated K-Means Matplotlib figure : {KMEANS_PNG}")
    if run_hmm:
        plot_hmm_graphs(data)
        print(f"Generated HMM Matplotlib figure     : {HMM_PNG}")

    if "--save-only" not in args and matplotlib.get_backend().lower() != "agg":
        plt.show()


if __name__ == "__main__":
    main()
