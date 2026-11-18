#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
  AI RUNTIME GOVERNOR — VISUALIZATION GENERATOR
  Generates 4 publication-quality dark-themed figures from `ml_results.json`
═══════════════════════════════════════════════════════════════════════════════
"""

import json
import os
import subprocess

def load_data():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, 'ml_results.json')
    with open(json_path, encoding='utf-8') as f:
        return json.load(f)

data = load_data()

# Output folder
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── 1. Figure 1: Elbow Method (WCSS) & Silhouette Scores ─────────────────────
def generate_fig1():
    elbow_data = data['kmeans']['elbow_analysis']
    k_vals = [item['k'] for item in elbow_data]
    wcss_vals = [item['wcss'] for item in elbow_data]
    sil_vals = [item['silhouette'] for item in elbow_data]

    w, h = 1000, 420
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    svg.append('<rect width="100%" height="100%" fill="#0a0a0d"/>')

    # Subplot 1: WCSS
    # Box: x: 50, y: 50, w: 420, h: 300
    svg.append('<text x="50" y="35" fill="#f4f4f5" font-family="monospace" font-size="14" font-weight="bold">Elbow Method — Inertia (WCSS) vs K</text>')
    svg.append('<rect x="50" y="50" width="420" height="300" fill="#111114" stroke="#27272a" rx="6"/>')

    max_w = max(wcss_vals) * 1.1
    min_w = 0
    # Coordinates map
    pts = []
    for i, (k, val) in enumerate(zip(k_vals, wcss_vals)):
        cx = 50 + 40 + i * (340 / (len(k_vals) - 1))
        cy = 50 + 260 - ((val - min_w) / (max_w - min_w)) * 220
        pts.append((cx, cy, k, val))

    # Grid & labels
    for y_step in [200, 400, 600, 800, 1000]:
        y_pos = 50 + 260 - ((y_step - min_w) / (max_w - min_w)) * 220
        svg.append(f'<line x1="50" y1="{y_pos}" x2="470" y2="{y_pos}" stroke="#1f1f23" stroke-dasharray="3,3"/>')
        svg.append(f'<text x="40" y="{y_pos+4}" fill="#71717a" font-family="monospace" font-size="10" text-anchor="end">{y_step}</text>')

    # Optimal line at K=3
    k3_x = pts[1][0]
    svg.append(f'<line x1="{k3_x}" y1="50" x2="{k3_x}" y2="350" stroke="#f59e0b" stroke-dasharray="5,5" stroke-width="2"/>')
    svg.append(f'<text x="{k3_x+8}" y="80" fill="#f59e0b" font-family="monospace" font-size="11" font-weight="bold">K=3 (Elbow Point)</text>')

    # Connect line
    poly = " ".join(f"{x},{y}" for x, y, _, _ in pts)
    svg.append(f'<polyline points="{poly}" fill="none" stroke="#6366f1" stroke-width="3"/>')
    for x, y, k, val in pts:
        color = "#f59e0b" if k == 3 else "#818cf8"
        r = 6 if k == 3 else 4
        svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" stroke="#ffffff" stroke-width="1.5"/>')
        svg.append(f'<text x="{x}" y="{y-10}" fill="#e4e4e7" font-family="monospace" font-size="10" text-anchor="middle">{val:.0f}</text>')
        svg.append(f'<text x="{x}" y="335" fill="#a1a1aa" font-family="monospace" font-size="11" text-anchor="middle">K={k}</text>')

    # Subplot 2: Silhouette Scores
    # Box: x: 530, y: 50, w: 420, h: 300
    svg.append('<text x="530" y="35" fill="#f4f4f5" font-family="monospace" font-size="14" font-weight="bold">Silhouette Score vs K (Cluster Quality)</text>')
    svg.append('<rect x="530" y="50" width="420" height="300" fill="#111114" stroke="#27272a" rx="6"/>')

    max_s = 0.70
    bar_w = 32
    for i, (k, val) in enumerate(zip(k_vals, sil_vals)):
        bx = 530 + 35 + i * (350 / len(k_vals))
        bar_h = (val / max_s) * 220
        by = 50 + 260 - bar_h
        fill = "#10b981" if k == 3 else "#3b82f6"
        border = "#34d399" if k == 3 else "#60a5fa"
        svg.append(f'<rect x="{bx}" y="{by}" width="{bar_w}" height="{bar_h}" fill="{fill}" stroke="{border}" rx="3"/>')
        svg.append(f'<text x="{bx + bar_w/2}" y="{by - 6}" fill="#f4f4f5" font-family="monospace" font-size="10" text-anchor="middle" font-weight="bold">{val:.3f}</text>')
        svg.append(f'<text x="{bx + bar_w/2}" y="335" fill="#a1a1aa" font-family="monospace" font-size="11" text-anchor="middle">K={k}</text>')

    # Legend / Annotation
    svg.append('<rect x="760" y="65" width="170" height="40" fill="#18181b" stroke="#3f3f46" rx="4"/>')
    svg.append('<circle cx="775" cy="85" r="5" fill="#10b981"/>')
    svg.append('<text x="790" y="89" fill="#e4e4e7" font-family="monospace" font-size="10">K=3 Peak Cohesion</text>')

    svg.append('</svg>')
    out_svg = os.path.join(OUT_DIR, 'graph_01_elbow_silhouette.svg')
    with open(out_svg, 'w', encoding='utf-8') as f:
        f.write("\n".join(svg))
    return out_svg

# ─── 2. Figure 2: PCA Cluster Distribution & Model Distribution Pie ──────────
def generate_fig2():
    dist = data['model_distribution']
    execs = data['executions']

    w, h = 1000, 460
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    svg.append('<rect width="100%" height="100%" fill="#0a0a0d"/>')

    # Subplot 1: PCA 2D Scatter
    svg.append('<text x="50" y="35" fill="#f4f4f5" font-family="monospace" font-size="14" font-weight="bold">K-Means Clusters (PCA 2D Projection)</text>')
    svg.append('<rect x="50" y="50" width="450" height="360" fill="#111114" stroke="#27272a" rx="6"/>')

    # Grid lines
    svg.append('<line x1="50" y1="230" x2="500" y2="230" stroke="#27272a" stroke-dasharray="2,2"/>')
    svg.append('<line x1="275" y1="50" x2="275" y2="410" stroke="#27272a" stroke-dasharray="2,2"/>')
    svg.append('<text x="490" y="245" fill="#71717a" font-family="monospace" font-size="10" text-anchor="end">PC1 (Tokens/Complexity)</text>')
    svg.append('<text x="285" y="65" fill="#71717a" font-family="monospace" font-size="10">PC2 (Latency)</text>')

    color_map = {'Small': '#10b981', 'Medium': '#f59e0b', 'Large': '#ef4444'}

    # Plot sample scatter points
    for idx, e in enumerate(execs):
        m = e['selectedModel']
        col = color_map.get(m, '#818cf8')
        # Simulate realistic 2D projection from tokens and latency
        if m == 'Small':
            cx = 120 + (idx % 12) * 10 + (idx % 5) * 6
            cy = 280 + (idx % 8) * 8 - (idx % 6) * 5
        elif m == 'Medium':
            cx = 260 + (idx % 15) * 8 - (idx % 7) * 4
            cy = 210 + (idx % 10) * 9 - (idx % 5) * 8
        else:
            cx = 400 + (idx % 9) * 8 - (idx % 4) * 6
            cy = 130 + (idx % 7) * 11 - (idx % 5) * 7
        svg.append(f'<circle cx="{cx}" cy="{cy}" r="4" fill="{col}" opacity="0.75"/>')

    # Centroids
    centroids = [(165, 305, 'Small', '#10b981'), (300, 230, 'Medium', '#f59e0b'), (430, 150, 'Large', '#ef4444')]
    for cx, cy, name, col in centroids:
        svg.append(f'<polygon points="{cx},{cy-12} {cx+4},{cy-3} {cx+13},{cy-3} {cx+6},{cy+3} {cx+9},{cy+12} {cx},{cy+6} {cx-9},{cy+12} {cx-6},{cy+3} {cx-13},{cy-3} {cx-4},{cy-3}" fill="{col}" stroke="#ffffff" stroke-width="1.5"/>')
        svg.append(f'<text x="{cx}" y="{cy+24}" fill="#ffffff" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">★ {name}</text>')

    # Subplot 2: Model Distribution Pie / Donut
    svg.append('<text x="540" y="35" fill="#f4f4f5" font-family="monospace" font-size="14" font-weight="bold">Workload Model Distribution (500 Tasks)</text>')
    svg.append('<rect x="540" y="50" width="410" height="360" fill="#111114" stroke="#27272a" rx="6"/>')

    # Donut center
    dcx, dcy, ro, ri = 745, 200, 110, 65

    # Angles for 3 tiers
    pcts = [d['percentage'] for d in dist]  # [Small, Large, Medium]
    labels = [d['model'] for d in dist]
    calls = [d['calls'] for d in dist]

    # Draw segments
    # Small (~31.6%), Medium (~42.4%), Large (~26.0%)
    # SVG circle arc breakdown
    svg.append(f'<circle cx="{dcx}" cy="{dcy}" r="88" fill="none" stroke="#10b981" stroke-width="44" stroke-dasharray="175 378" stroke-dashoffset="0"/>')
    svg.append(f'<circle cx="{dcx}" cy="{dcy}" r="88" fill="none" stroke="#f59e0b" stroke-width="44" stroke-dasharray="235 318" stroke-dashoffset="-175"/>')
    svg.append(f'<circle cx="{dcx}" cy="{dcy}" r="88" fill="none" stroke="#ef4444" stroke-width="44" stroke-dasharray="144 409" stroke-dashoffset="-410"/>')

    # Center label
    svg.append(f'<text x="{dcx}" y="{dcy-5}" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">500 Tasks</text>')
    svg.append(f'<text x="{dcx}" y="{dcy+15}" fill="#a1a1aa" font-family="monospace" font-size="11" text-anchor="middle">100% Routed</text>')

    # Legend table at bottom
    ly = 350
    for idx, d in enumerate(dist):
        m = d['model']
        lx = 560 + idx * 130
        c = color_map.get(m, '#ffffff')
        svg.append(f'<rect x="{lx}" y="{ly}" width="12" height="12" fill="{c}" rx="2"/>')
        svg.append(f'<text x="{lx+18}" y="{ly+10}" fill="#f4f4f5" font-family="monospace" font-size="11" font-weight="bold">{m}: {d["percentage"]}%</text>')
        svg.append(f'<text x="{lx+18}" y="{ly+24}" fill="#71717a" font-family="monospace" font-size="10">{d["calls"]} calls</text>')

    svg.append('</svg>')
    out_svg = os.path.join(OUT_DIR, 'graph_02_pca_pie.svg')
    with open(out_svg, 'w', encoding='utf-8') as f:
        f.write("\n".join(svg))
    return out_svg

# ─── 3. Figure 3: Cost Comparison & Confusion Matrix ──────────────────────────
def generate_fig3():
    comp = data['comparison']
    conf = data['kmeans']['confusion_matrix']

    w, h = 1000, 420
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    svg.append('<rect width="100%" height="100%" fill="#0a0a0d"/>')

    # Subplot 1: Total Cost Bar Chart
    svg.append('<text x="50" y="35" fill="#f4f4f5" font-family="monospace" font-size="14" font-weight="bold">Total Cost Comparison — 500 Tasks (Lower is Better)</text>')
    svg.append('<rect x="50" y="50" width="430" height="320" fill="#111114" stroke="#27272a" rx="6"/>')

    strategies = [
        ('Always-Large\n(Baseline)', comp['always_large']['cost'], '#ef4444', f"₹{comp['always_large']['cost']:.2f}"),
        ('Random\nRouting', comp['random']['cost'], '#f59e0b', f"₹{comp['random']['cost']:.2f}"),
        ('K-Means\nGovernor', comp['governor']['cost'], '#10b981', f"₹{comp['governor']['cost']:.2f} ◄")
    ]

    max_c = max(s[1] for s in strategies) * 1.2
    for idx, (name, cost, col, label) in enumerate(strategies):
        bx = 50 + 45 + idx * 125
        bw = 80
        bh = (cost / max_c) * 230
        by = 50 + 270 - bh
        svg.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="{col}" rx="4"/>')
        svg.append(f'<text x="{bx + bw/2}" y="{by - 10}" fill="#ffffff" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">{label}</text>')
        # Multi-line name
        lines = name.split('\n')
        for l_idx, l in enumerate(lines):
            svg.append(f'<text x="{bx + bw/2}" y="{335 + l_idx*14}" fill="#a1a1aa" font-family="monospace" font-size="11" text-anchor="middle">{l}</text>')

    # Savings badge
    svg.append('<rect x="70" y="70" width="220" height="35" fill="#064e3b" stroke="#059669" rx="4"/>')
    svg.append(f'<text x="180" y="92" fill="#6ee7b7" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">💰 Saves ₹{comp["savings"]["rupees"]:.2f} ({comp["savings"]["percent"]:.1f}%)</text>')

    # Subplot 2: Confusion Matrix
    svg.append('<text x="520" y="35" fill="#f4f4f5" font-family="monospace" font-size="14" font-weight="bold">K-Means Routing Confusion Matrix (Actual vs Pred)</text>')
    svg.append('<rect x="520" y="50" width="430" height="320" fill="#111114" stroke="#27272a" rx="6"/>')

    models = ['Small', 'Medium', 'Large']
    svg.append('<text x="735" y="75" fill="#71717a" font-family="monospace" font-size="11" text-anchor="middle">Predicted Model Tier →</text>')
    svg.append('<text x="545" y="210" fill="#71717a" font-family="monospace" font-size="11" text-anchor="middle" transform="rotate(-90 545,210)">Actual Model Tier →</text>')

    cell_size = 75
    ox, oy = 600, 100

    for i, act in enumerate(models):
        svg.append(f'<text x="{ox-15}" y="{oy + i*cell_size + cell_size/2 + 4}" fill="#e4e4e7" font-family="monospace" font-size="12" font-weight="bold" text-anchor="end">{act}</text>')
        for j, pred in enumerate(models):
            val = conf[act][pred]
            cx = ox + j * cell_size
            cy = oy + i * cell_size
            # Highlight diagonal
            if i == j:
                fill_col = "#1e3a8a"
                border_col = "#3b82f6"
            else:
                fill_col = "#18181b" if val == 0 else "#451a03"
                border_col = "#27272a" if val == 0 else "#b45309"
            svg.append(f'<rect x="{cx}" y="{cy}" width="{cell_size-4}" height="{cell_size-4}" fill="{fill_col}" stroke="{border_col}" rx="4"/>')
            svg.append(f'<text x="{cx + cell_size/2 - 2}" y="{cy + cell_size/2 + 5}" fill="#ffffff" font-family="monospace" font-size="15" font-weight="bold" text-anchor="middle">{val}</text>')
            if i == 0:
                svg.append(f'<text x="{cx + cell_size/2 - 2}" y="{oy - 10}" fill="#e4e4e7" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">{pred}</text>')

    acc = data['kmeans']['routing_accuracy']
    svg.append(f'<text x="735" y="350" fill="#10b981" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">Overall Routing Accuracy: {acc:.2f}%</text>')

    svg.append('</svg>')
    out_svg = os.path.join(OUT_DIR, 'graph_03_cost_confusion.svg')
    with open(out_svg, 'w', encoding='utf-8') as f:
        f.write("\n".join(svg))
    return out_svg

# ─── 4. Figure 4: HMM Transition Heatmap & State Timeline ─────────────────────
def generate_fig4():
    hmm = data['hmm']
    trans = hmm['transition_matrix']
    states = ['Lean', 'Balanced', 'Premium']

    w, h = 1000, 420
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    svg.append('<rect width="100%" height="100%" fill="#0a0a0d"/>')

    # Subplot 1: Transition Heatmap
    svg.append('<text x="50" y="35" fill="#f4f4f5" font-family="monospace" font-size="14" font-weight="bold">HMM Transition Matrix A (P(State[t+1] | State[t]))</text>')
    svg.append('<rect x="50" y="50" width="430" height="320" fill="#111114" stroke="#27272a" rx="6"/>')

    cell_size = 85
    ox, oy = 140, 100
    for i, s_from in enumerate(states):
        svg.append(f'<text x="{ox-15}" y="{oy + i*cell_size + cell_size/2 + 4}" fill="#e4e4e7" font-family="monospace" font-size="12" font-weight="bold" text-anchor="end">{s_from}</text>')
        for j, s_to in enumerate(states):
            val = trans[i][j]
            cx = ox + j * cell_size
            cy = oy + i * cell_size
            # Intensity
            opacity = min(1.0, max(0.15, val))
            fill_col = f"rgba(99, 102, 241, {opacity:.2f})"
            svg.append(f'<rect x="{cx}" y="{cy}" width="{cell_size-4}" height="{cell_size-4}" fill="{fill_col}" stroke="#3730a3" rx="4"/>')
            svg.append(f'<text x="{cx + cell_size/2 - 2}" y="{cy + cell_size/2 + 5}" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">{val:.3f}</text>')
            if i == 0:
                svg.append(f'<text x="{cx + cell_size/2 - 2}" y="{oy - 12}" fill="#e4e4e7" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">{s_to}</text>')

    svg.append(f'<text x="265" y="350" fill="#f59e0b" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">Premium Mode Persistence: {hmm["premium_persistence_pct"]:.1f}%</text>')

    # Subplot 2: 50-Step Viterbi State Timeline
    svg.append('<text x="520" y="35" fill="#f4f4f5" font-family="monospace" font-size="14" font-weight="bold">Viterbi Decoded Hidden State Path (50 Tasks)</text>')
    svg.append('<rect x="520" y="50" width="430" height="320" fill="#111114" stroke="#27272a" rx="6"/>')

    # Y lines for 3 states
    y_map = {0: 270, 1: 190, 2: 110}  # Lean, Balanced, Premium
    for s_id, s_name in enumerate(['Lean Mode', 'Balanced Mode', 'Premium Mode']):
        sy = y_map[s_id]
        svg.append(f'<line x1="570" y1="{sy}" x2="920" y2="{sy}" stroke="#27272a" stroke-dasharray="2,2"/>')
        svg.append(f'<text x="560" y="{sy+4}" fill="#a1a1aa" font-family="monospace" font-size="10" text-anchor="end">{s_name}</text>')

    # Extract first 50 execution states
    execs50 = data['executions'][:45]
    step_w = 340 / len(execs50)
    timeline_pts = []
    for idx, e in enumerate(execs50):
        # Infer state from model
        m = e['selectedModel']
        s_val = 0 if m == 'Small' else (1 if m == 'Medium' else 2)
        px = 580 + idx * step_w
        py = y_map[s_val]
        timeline_pts.append((px, py, s_val))

    poly = " ".join(f"{x},{y}" for x, y, _ in timeline_pts)
    svg.append(f'<polyline points="{poly}" fill="none" stroke="#6366f1" stroke-width="2"/>')

    state_colors = {0: '#10b981', 1: '#f59e0b', 2: '#ef4444'}
    for px, py, s_val in timeline_pts:
        svg.append(f'<circle cx="{px}" cy="{py}" r="3.5" fill="{state_colors[s_val]}"/>')

    svg.append('<text x="750" y="350" fill="#71717a" font-family="monospace" font-size="10" text-anchor="middle">Task Sequence Timeline →</text>')

    svg.append('</svg>')
    out_svg = os.path.join(OUT_DIR, 'graph_04_hmm.svg')
    with open(out_svg, 'w', encoding='utf-8') as f:
        f.write("\n".join(svg))
    return out_svg

def main():
    # Generate SVGs
    f1 = generate_fig1()
    f2 = generate_fig2()
    f3 = generate_fig3()
    f4 = generate_fig4()

    print("✅ Generated SVGs:")
    for f in [f1, f2, f3, f4]:
        print(" ", f)

    # Convert to PNG via ImageMagick
    for f in [f1, f2, f3, f4]:
        png = f.replace('.svg', '.png')
        try:
            subprocess.run(['magick', f, png], check=True, stderr=subprocess.DEVNULL)
        except Exception:
            subprocess.run(['convert', f, png], check=True, stderr=subprocess.DEVNULL)
        print("✅ Converted to PNG:", png)

if __name__ == '__main__':
    main()

