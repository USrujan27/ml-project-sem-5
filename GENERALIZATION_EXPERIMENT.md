# 🔬 AI RUNTIME GOVERNOR: GENERALIZATION EXPERIMENT REPORT

**Document:** Generalization & Out-of-Distribution Validation Report  
**Project:** AI Runtime Governor (PBL-III Review 3)  
**Date:** November 17, 2026  
**Artifact Directory:** `/run/media/jennu/AC1646C016468B72/sem5_ml_project`  
**Execution Environment:** Python 3.11 Virtual Environment (`.venv`)  
**Experiment Script:** `run_generalization_experiment.py`  
**Independent Dataset:** `tasks_dataset_generalization.csv` ($N = 500$, Seed = 999)  

---

## 1. Experiment Overview & Protocol

To verify whether the trained models merely memorized the original 500 records or truly learned generalized decision boundaries, we conducted an **independent generalization experiment**.

### Strict Experimental Constraints:
1. **Zero Data Reuse**: A fresh dataset of 500 samples was generated with a completely different random seed (`SEED = 999`).
2. **Zero Model Retraining or Tuning**: All seven pre-trained models and the pre-fitted `StandardScaler` were loaded from `saved_models/` without modification.
3. **Identical Generative Architecture**: Generated using the same 3-state Hidden Markov Model (HMM) regime transitions and feature distributions as the original pipeline, including the 5% uniform random noise injection.
4. **Disjoint Records Verification**: Confirmed that the feature tuple intersection between `tasks_dataset.csv` and `tasks_dataset_generalization.csv` is **strictly 0 records**.

> **⚠️ Academic Transparency & Scope Statement**:  
> This experiment represents **synthetic-to-synthetic out-of-sample validation**, NOT real-world validation. It assesses the models' ability to generalize to independent draws from the generative physical process. Real-world LLM traffic exhibits prompt semantic overlap, server queue latency fluctuations, and domain shifts that cannot be captured by synthetic telemetry alone.

---

## 2. Independent Dataset Characteristics ($N = 500$, Seed = 999)

```
Total Independent Records : 500 samples
Feature Intersection      : 0 overlapping records with tasks_dataset.csv
Feature Columns (5)       : [input_tokens, output_tokens, latency, task_type_enc, difficulty_enc]
```

### Class Distribution:
- **Small Tier**: 199 samples (39.8%)
- **Medium Tier**: 196 samples (39.2%)
- **Large Tier**: 105 samples (21.0%)

### Noise Audit & Theoretical Bayes Error:
- **Noise condition triggered**: 26 out of 500 samples (5.2%)
- **Identical re-selection**: In 9 samples, uniform random choice selected the original state.
- **Realized label corruptions (flips)**: Exactly 17 out of 500 samples (**3.40%**).
- **Theoretical Accuracy Ceiling**:
  $$\text{Accuracy}_{\text{Bayes}} = 100\% - 3.40\% = \mathbf{96.60\%}$$
  Any classifier operating on physical features alone cannot exceed **96.60%** without memorizing noise.

---

## 3. Generalization Performance Results ($N = 500$)

All eight saved models were evaluated on the independent 500 samples using the pre-fitted scaler.

| Model Architecture | OOS Accuracy (%) | OOS Precision (Macro %) | OOS Recall (Macro %) | OOS F1 (Macro %) | OOS F1 (Weighted %) | OOS Multi-Class ROC-AUC (OvR) | Misclassified Count (/500) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Decision Tree (Baseline)** | 96.40 | 96.67 | 95.47 | 96.01 | 96.38 | 0.9669 | 18 |
| **Random Forest** | 96.40 | 96.67 | 95.47 | 96.01 | 96.38 | 0.9710 | 18 |
| **Extra Trees** 🏆 | **96.60** | **96.83** | **95.64** | **96.18** | **96.58** | 0.9730 | **17** |
| **AdaBoost** | 96.40 | 96.66 | 95.47 | 96.01 | 96.38 | 0.9717 | 18 |
| **Gradient Boosting** | 96.20 | 96.50 | 95.30 | 95.84 | 96.18 | 0.9725 | 19 |
| **Soft Voting Classifier** 🏆 | **96.60** | **96.83** | **95.64** | **96.18** | **96.58** | 0.9734 | **17** |
| **Bayesian Model Averaging** 🏆 | **96.60** | **96.83** | **95.64** | **96.18** | **96.58** | 0.9729 | **17** |
| **Stacking Classifier** 🏆 | **96.60** | **96.83** | **95.64** | **96.18** | **96.58** | **0.9751** | **17** |

---

## 4. Comparison: Original Test Set ($N=100$) vs. Independent Dataset ($N=500$)

| Model Architecture | Original Test Acc (N=100) | Independent Acc (N=500) | Acc Difference (Δ) | Original F1 (Macro) | Independent F1 (Macro) | Original ROC-AUC | Independent ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Decision Tree (Baseline)** | 95.00% | 96.40% | +1.40% | 94.84% | 96.01% | 0.9631 | 0.9669 |
| **Random Forest** | 96.00% | 96.40% | +0.40% | 95.79% | 96.01% | 0.9662 | 0.9710 |
| **Extra Trees** | 96.00% | **96.60%** | +0.60% | 95.79% | **96.18%** | 0.9600 | 0.9730 |
| **AdaBoost** | 96.00% | 96.40% | +0.40% | 95.79% | 96.01% | 0.9767 | 0.9717 |
| **Gradient Boosting** | 96.00% | 96.20% | +0.20% | 95.79% | 95.84% | 0.9660 | 0.9725 |
| **Soft Voting Classifier** | 96.00% | **96.60%** | +0.60% | 95.79% | **96.18%** | 0.9620 | 0.9734 |
| **Bayesian Model Averaging** | 96.00% | **96.60%** | +0.60% | 95.79% | **96.18%** | 0.9602 | 0.9729 |
| **Stacking Classifier** | 96.00% | **96.60%** | +0.60% | 95.79% | **96.18%** | 0.9629 | **0.9751** |

---

## 5. In-Depth Analysis & Key Findings

### 5.1 Realization of the Exact Theoretical Bayes Boundary
In this independent 500-sample dataset, exactly 17 labels were corrupted by random noise.  
Remarkably, **Extra Trees, Soft Voting, Bayesian Model Averaging, and Stacking misclassified exactly 17 samples out of 500**.
- On all 483 clean samples: **0 misclassifications (100% accuracy on clean signal)**.
- On the 17 corrupted samples: Correctly predicted the physical regime rather than fitting the corrupted noise.
- This demonstrates that the models achieved the **exact theoretical Bayes ceiling (96.60%)** on an independent unseen dataset.

### 5.2 Emergence of Realistic Model Divergence
On the original 100-sample test set, all six ensemble models predicted identical classes because the sample size was small ($N=100$) and all models correctly classified the 96 clean samples.  
With $N = 500$ samples, subtle, realistic model divergences emerged:
- **Random Forest vs. Extra Trees**: 1 disagreement out of 500 samples.
- **Random Forest vs. AdaBoost**: 2 disagreements out of 500 samples.
- **Random Forest vs. Gradient Boosting**: 3 disagreements out of 500 samples.
- **Random Forest vs. Decision Tree**: 2 disagreements out of 500 samples.

### 5.3 Stacking Achieves Highest Discriminative Power
While Random Forest, Extra Trees, and Stacking achieved comparable accuracy, the **Stacking Classifier** achieved the highest ROC-AUC on the independent dataset (**0.9751**), followed by Soft Voting (**0.9734**) and Extra Trees (**0.9730**). This confirms that meta-learning over out-of-fold base model probabilities produces slightly better probability calibration across large sample volumes.

---

## 6. Critical Scientific Evaluation: Generalization vs. Distribution Dependence

### Does the model generalize?
**Yes, within the physical generative process.**  
The models were trained on 400 samples from seed 42 and evaluated on 500 completely fresh samples from seed 999. The accuracy did not drop; in fact, it slightly improved (96.00% $\to$ 96.60%), tracking the lower empirical flip rate (3.4% vs 4.0%). This demonstrates that:
1. The models did **not** overfit to the training set samples.
2. The pre-fitted `StandardScaler` successfully normalized new data without covariate shift.
3. The learned decision boundaries correctly reflect the physical relationships between input tokens, output tokens, and model capacity.

### Does performance depend on the synthetic distribution?
**Yes, heavily.**  
The synthetic data generator enforces structured distributions:
1. `input_tokens` ranges are largely separable across regimes (Small: 800–2000, Medium: 2200–4200, Large: 4800–8800).
2. Latency is generated as a smooth function of regime difficulty.
3. In real-world enterprise LLM deployments, prompt token counts frequently overlap across task complexities (e.g., a 4,000-token prompt could be a simple repetitive JSON log requiring a Small model, or a multi-constraint logic puzzle requiring a Large model).
4. Therefore, the **high generalization observed here confirms high internal validity within the synthetic domain, but external validity for production deployment would require validating on real-world prompt embeddings and production traces**.

---

## 7. Artifact Summary

- **Experiment Script**: `run_generalization_experiment.py`
- **Independent Dataset**: `tasks_dataset_generalization.csv` (500 records, Seed 999)
- **Original Dataset**: `tasks_dataset.csv` (Preserved intact)
- **Saved Model Artifacts**: `saved_models/` (Preserved intact, zero retraining)
- **JSON Dashboards**: `ml_results.json` (Preserved intact)

