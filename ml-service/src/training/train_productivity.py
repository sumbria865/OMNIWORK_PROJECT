"""
Training Script — Employee Productivity Scorer
Features: attendance_pct, tasks_completed_monthly, tasks_assigned_monthly,
          avg_task_completion_days, leave_days_taken, on_time_delivery_pct,
          peer_review_score, bug_rate, overtime_hours
Label   : productivity_band (0=Low, 1=Average, 2=Good, 3=Excellent)
"""

import os, joblib, numpy as np, pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import MinMaxScaler

np.random.seed(99)
N = 5000


def generate_productivity_data(n):
    attendance_pct            = np.random.uniform(60, 100, n)
    tasks_assigned            = np.random.randint(5, 40, n)
    completion_ratio          = np.random.uniform(0.4, 1.0, n)
    tasks_completed           = (tasks_assigned * completion_ratio).astype(int)
    avg_completion_days       = np.random.uniform(0.5, 10, n)
    leave_days                = np.random.randint(0, 20, n)
    on_time_delivery_pct      = np.random.uniform(40, 100, n)
    peer_review_score         = np.random.uniform(1, 5, n)
    bug_rate                  = np.random.uniform(0, 0.4, n)   # bugs per task
    overtime_hours            = np.random.randint(0, 40, n)

    labels = []
    for i in range(n):
        score = 0
        score += (attendance_pct[i] - 60) / 40 * 25          # 0-25
        score += completion_ratio[i] * 20                      # 0-20
        score += (1 - bug_rate[i]) * 15                        # 0-15
        score += (on_time_delivery_pct[i] - 40) / 60 * 20     # 0-20
        score += (peer_review_score[i] - 1) / 4 * 15          # 0-15
        score -= (leave_days[i] / 20) * 5                      # penalty up to -5

        if score >= 75:      labels.append(3)   # Excellent
        elif score >= 55:    labels.append(2)   # Good
        elif score >= 35:    labels.append(1)   # Average
        else:                labels.append(0)   # Low

    labels = np.array(labels)
    noise_idx = np.random.choice(n, int(n * 0.05), replace=False)
    labels[noise_idx] = np.random.randint(0, 4, len(noise_idx))

    return pd.DataFrame({
        "attendance_pct": attendance_pct,
        "tasks_completed_monthly": tasks_completed,
        "tasks_assigned_monthly": tasks_assigned,
        "avg_task_completion_days": avg_completion_days,
        "leave_days_taken": leave_days,
        "on_time_delivery_pct": on_time_delivery_pct,
        "peer_review_score": peer_review_score,
        "bug_rate": bug_rate,
        "overtime_hours": overtime_hours,
        "label": labels,
    })


def train():
    print("🔧  Training Productivity Scorer model...")
    df = generate_productivity_data(N)

    X = df.drop("label", axis=1)
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = MinMaxScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=250, max_depth=15, min_samples_leaf=3, random_state=42, n_jobs=-1
    )
    model.fit(X_train_s, y_train)

    print(classification_report(y_test, model.predict(X_test_s),
                                target_names=["Low", "Average", "Good", "Excellent"]))

    out_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(out_dir, exist_ok=True)
    joblib.dump(model,  os.path.join(out_dir, "productivity.pkl"))
    joblib.dump(scaler, os.path.join(out_dir, "productivity_scaler.pkl"))
    print("✅  productivity.pkl saved")


if __name__ == "__main__":
    train()