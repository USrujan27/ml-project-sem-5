#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
  AI RUNTIME GOVERNOR — BAYESIAN MODEL AVERAGING (BMA) MODULE
  PBL-III Review 3 Demonstration | Supervised Model Tier Routing
═══════════════════════════════════════════════════════════════════════════════
Implements a mathematically rigorous, statistically defensible Bayesian Model
Averaging (BMA) Classifier for multi-class model tier routing:

Mathematical Principle:
  Let candidate base models be M_1, M_2, ..., M_K.
  1. Prior Model Probabilities:
     P(M_k) = 1 / K  (uniform, non-informative prior across architectures)
  2. Model Evidence / Likelihood Estimation:
     Estimated via 5-Fold Stratified Cross-Validation strictly on the training set
     (zero data leakage into unseen test samples). For each base learner M_k:
         log L(M_k | D_train) = sum_{i=1}^{N_train} log( P(y_i | x_i, M_k) )
     where P(y_i | x_i, M_k) is the out-of-fold predicted probability for true label y_i.
  3. Posterior Model Probabilities (Bayes' Rule):
     P(M_k | D_train) = P(D_train | M_k) * P(M_k) / sum_j [ P(D_train | M_j) * P(M_j) ]
     Computed in log-space with calibrated per-sample log-evidence:
         ell_k = (1 / N_train) * log L(M_k | D_train)
         w_k = exp((ell_k - max_j ell_j) / tau) / sum_m exp((ell_m - max_j ell_m) / tau)
  4. Posterior Predictive Distribution:
     P(y = c | x, D) = sum_{k=1}^K w_k * P(y = c | x, M_k)
     y_hat = argmax_c P(y = c | x, D)
═══════════════════════════════════════════════════════════════════════════════
"""

import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import log_loss


class BayesianModelAveragingClassifier(BaseEstimator, ClassifierMixin):
    """
    Bayesian Model Averaging (BMA) Classifier for Multi-Class Model Routing.
    """
    def __init__(self, estimators, cv=5, temperature=0.08, random_state=42):
        self.estimators = estimators  # List of (name, estimator_instance) tuples
        self.cv = cv
        self.temperature = temperature
        self.random_state = random_state
        self.named_estimators_ = {}
        self.classes_ = None
        self.log_likelihoods_ = {}
        self.log_likelihoods_per_sample_ = {}
        self.posterior_weights_ = {}
        self.raw_weights_ = {}
        self.oof_accuracy_ = {}

    def fit(self, X, y):
        X_arr = np.asarray(X)
        y_arr = np.asarray(y)
        self.classes_ = np.unique(y_arr)
        N = len(X_arr)

        # 1. Estimate out-of-fold probabilities via Stratified K-Fold CV (Zero Test Leakage)
        skf = StratifiedKFold(n_splits=self.cv, shuffle=True, random_state=self.random_state)
        oof_probs = {name: np.zeros((N, len(self.classes_))) for name, _ in self.estimators}

        for train_idx, val_idx in skf.split(X_arr, y_arr):
            X_tr, y_tr = X_arr[train_idx], y_arr[train_idx]
            X_va = X_arr[val_idx]
            for name, est in self.estimators:
                clone_est = est.__class__(**est.get_params())
                clone_est.fit(X_tr, y_tr)
                oof_probs[name][val_idx] = clone_est.predict_proba(X_va)

        # 2. Compute out-of-fold categorical cross-entropy log-likelihood:
        #    log L = sum_{i=1}^N log P(y_i | x_i, M_k) = - N * log_loss(y, oof_probs)
        self.log_likelihoods_ = {}
        self.log_likelihoods_per_sample_ = {}
        self.oof_accuracy_ = {}

        for name, _ in self.estimators:
            probs = np.clip(oof_probs[name], 1e-15, 1.0 - 1e-15)
            probs /= probs.sum(axis=1, keepdims=True)
            ll = -float(log_loss(y_arr, probs, normalize=False, labels=self.classes_))
            self.log_likelihoods_[name] = ll
            self.log_likelihoods_per_sample_[name] = ll / float(N)

            preds = self.classes_[np.argmax(probs, axis=1)]
            self.oof_accuracy_[name] = float(np.mean(preds == y_arr))

        # 3. Compute Bayesian posterior weights via Bayes' Theorem
        # A. Calibrated per-sample predictive log-evidence posterior
        max_sample_ll = max(self.log_likelihoods_per_sample_.values())
        exp_ll = {
            name: np.exp((s_ll - max_sample_ll) / self.temperature)
            for name, s_ll in self.log_likelihoods_per_sample_.items()
        }
        sum_exp = sum(exp_ll.values())
        self.posterior_weights_ = {name: float(exp_ll[name] / sum_exp) for name, _ in self.estimators}

        # B. Raw asymptotic Bayes factor weights (uncalibrated, tau = 1.0 on total evidence)
        max_total_ll = max(self.log_likelihoods_.values())
        raw_exp = {
            name: np.exp(np.clip(t_ll - max_total_ll, -500.0, 0.0))
            for name, t_ll in self.log_likelihoods_.items()
        }
        sum_raw = sum(raw_exp.values())
        self.raw_weights_ = {name: float(raw_exp[name] / sum_raw) for name, _ in self.estimators}

        # 4. Train each base estimator on the entire training set
        self.named_estimators_ = {}
        for name, est in self.estimators:
            clone_est = est.__class__(**est.get_params())
            clone_est.fit(X_arr, y_arr)
            self.named_estimators_[name] = clone_est

        return self

    def predict_proba(self, X):
        X_arr = np.asarray(X)
        N = len(X_arr)
        C = len(self.classes_)
        combined_prob = np.zeros((N, C))
        for name, est in self.named_estimators_.items():
            w = self.posterior_weights_[name]
            combined_prob += w * est.predict_proba(X_arr)
        row_sums = combined_prob.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1.0
        return combined_prob / row_sums

    def predict(self, X):
        probs = self.predict_proba(X)
        return self.classes_[np.argmax(probs, axis=1)]