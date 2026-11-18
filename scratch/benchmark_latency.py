#!/usr/bin/env python3
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (
    RandomForestClassifier, ExtraTreesClassifier,
    AdaBoostClassifier, GradientBoostingClassifier,
    VotingClassifier, StackingClassifier
)
from sklearn.linear_model import LogisticRegression

df = pd.read_csv('/run/media/jennu/AC1646C016468B72/sem5_ml_project/tasks_dataset.csv')
feature_cols = ['input_tokens', 'output_tokens', 'latency', 'task_type_enc', 'difficulty_enc']
X = df[feature_cols]
y = df['selected_model']

SEED = 42
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=SEED, stratify=y)
scaler = StandardScaler()
X_train_s = pd.DataFrame(scaler.fit_transform(X_train), columns=feature_cols)
X_test_s = pd.DataFrame(scaler.transform(X_test), columns=feature_cols)

rf = RandomForestClassifier(n_estimators=100, max_depth=6, min_samples_split=4, random_state=SEED)
et = ExtraTreesClassifier(n_estimators=100, max_depth=6, min_samples_split=4, random_state=SEED)
gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3, subsample=0.85, random_state=SEED)
dt = DecisionTreeClassifier(max_depth=5, min_samples_split=5, random_state=SEED)
ada = AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=2), n_estimators=80, learning_rate=0.8, random_state=SEED)
voting = VotingClassifier(estimators=[('rf', rf), ('et', et), ('gb', gb)], voting='soft')
stacking = StackingClassifier(estimators=[('rf', rf), ('et', et), ('gb', gb)], final_estimator=LogisticRegression(max_iter=1000, random_state=SEED), cv=5, n_jobs=-1)

models = {
    'Decision Tree (Baseline)': dt,
    'Random Forest': rf,
    'Extra Trees': et,
    'AdaBoost': ada,
    'Gradient Boosting': gb,
    'Soft Voting Classifier': voting,
    'Stacking Classifier': stacking
}

for name, m in models.items():
    m.fit(X_train_s, y_train)

single_sample = X_test_s.iloc[[0]]

col_m = "Model"
col_mean = "Mean (us)"
col_med = "Median (us)"
col_std = "Std Dev (us)"
col_p95 = "P95 (us)"

print("═" * 82)
print("  INDEPENDENT LATENCY BENCHMARK (50 WARMUPS, 1000 REPEATS)")
print("═" * 82)
header = f"  {col_m:<26}  {col_mean:>12}  {col_med:>12}  {col_std:>13}  {col_p95:>10}"
sep = f"  {'-'*26}  {'-'*12}  {'-'*12}  {'-'*13}  {'-'*10}"
print(header)
print(sep)

for name, m in models.items():
    for _ in range(50):
        _ = m.predict(single_sample)
    
    times = []
    for _ in range(1000):
        t0 = time.perf_counter_ns()
        _ = m.predict(single_sample)
        t1 = time.perf_counter_ns()
        times.append((t1 - t0) / 1000.0) # us
    
    times = np.array(times)
    mean_lat = np.mean(times)
    med_lat = np.median(times)
    std_lat = np.std(times)
    p95_lat = np.percentile(times, 95)
    row = f"  {name:<26}  {mean_lat:>12.2f}  {med_lat:>12.2f}  {std_lat:>13.2f}  {p95_lat:>10.2f}"
    print(row)
print("═" * 82)

