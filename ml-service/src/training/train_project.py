"""
Training Script — Project Delay Predictor
Features: total_tasks, completed_tasks, team_size, deadline_days_remaining,
          avg_task_completion_rate, num_blockers, sprint_velocity,
          budget_utilization_pct, complexity_score
Label   : will_be_delayed (0=On Track, 1=At Risk, 2=Delayed)
"""

import os, joblib, numpy as np, pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler

np.random.seed(7)
N = 4000


def generate_project_data(n):
    total_tasks              = np.random.randint(10, 200, n)
    completion_pct           = np.random.uniform(0, 1, n)
    completed_tasks          = (total_tasks * completion_pct).astype(int)
    team_size                = np.random.randint(2, 30, n)
    deadline_days_remaining  = np.random.randint(-30, 120, n)  # negative = past due
    avg_completion_rate      = np.random.uniform(0.3, 1.0, n)  # tasks/day
    num_blockers             = np.random.randint(0, 15, n)
    sprint_velocity          = np.random.uniform(5, 50, n)
    budget_utilization       = np.random.uniform(0.3, 1.5, n)  # >1 = over budget
    complexity_score         = np.random.randint(1, 10, n)

    labels = []
    for i in range(n):
        risk = 0
        remaining = total_tasks[i] - completed_tasks[i]
        days       = max(deadline_days_remaining[i], 1)
        needed_rate = remaining / days

        if needed_rate > avg_completion_rate[i] * 1.5:  risk += 3
        elif needed_rate > avg_completion_rate[i]:       risk += 1

        if deadline_days_remaining[i] < 0:               risk += 4
        elif deadline_days_remaining[i] < 7:             risk += 2

        if num_blockers[i] >= 5:    risk += 2
        elif num_blockers[i] >= 2:  risk += 1

        if budget_utilization[i] > 1.2:  risk += 2
        elif budget_utilization[i] > 1:  risk += 1

        risk += max(0, complexity_score[i] - 5)

        if risk >= 7:    labels.append(2)   # Delayed
        elif risk >= 3:  labels.append(1)   # At Risk
        else:            labels.append(0)   # On Track

    labels = np.array(labels)
    noise_idx = np.random.choice(n, int(n * 0.04), replace=False)
    labels[noise_idx] = np.random.randint(0, 3, len(noise_idx))

    return pd.DataFrame({
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "team_size": team_size,
        "deadline_days_remaining": deadline_days_remaining,
        "avg_task_completion_rate": avg_completion_rate,
        "num_blockers": num_blockers,
        "sprint_velocity": sprint_velocity,
        "budget_utilization_pct": budget_utilization,
        "complexity_score": complexity_score,
        "label": labels,
    })


def train():
    print("🔧  Training Project Delay model...")
    df = generate_project_data(N)

    X = df.drop("label", axis=1)
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    model = GradientBoostingClassifier(
        n_estimators=300, learning_rate=0.08, max_depth=5, random_state=42
    )
    model.fit(X_train_s, y_train)

    print(classification_report(y_test, model.predict(X_test_s),
                                target_names=["On Track", "At Risk", "Delayed"]))

    out_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(out_dir, exist_ok=True)
    joblib.dump(model,  os.path.join(out_dir, "project_delay.pkl"))
    joblib.dump(scaler, os.path.join(out_dir, "project_delay_scaler.pkl"))
    print("✅  project_delay.pkl saved")


if __name__ == "__main__":
    train()