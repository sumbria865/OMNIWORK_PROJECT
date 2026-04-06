"""
Training Script — Task Priority Predictor
Features: deadline_days, estimated_hours, num_dependencies,
          assignee_current_load, project_criticality, task_type_encoded
Label   : priority (0=Low, 1=Medium, 2=High, 3=Critical)
"""

import os, joblib, numpy as np, pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

np.random.seed(42)
N = 3000

def generate_task_data(n):
    deadline_days        = np.random.randint(1, 90, n)
    estimated_hours      = np.random.randint(1, 80, n)
    num_dependencies     = np.random.randint(0, 10, n)
    assignee_load        = np.random.randint(1, 20, n)   # tasks already assigned
    project_criticality  = np.random.randint(1, 5, n)    # 1-4
    task_type            = np.random.choice(["bug", "feature", "research", "devops", "qa"], n)

    le = LabelEncoder()
    task_type_enc = le.fit_transform(task_type)

    # Rule-based labels with noise (simulates real labeling)
    priority = []
    for i in range(n):
        score = 0
        if deadline_days[i] <= 3:            score += 4
        elif deadline_days[i] <= 7:          score += 2
        elif deadline_days[i] <= 14:         score += 1

        if estimated_hours[i] >= 40:         score += 2
        elif estimated_hours[i] >= 20:       score += 1

        if num_dependencies[i] >= 5:         score += 2
        elif num_dependencies[i] >= 2:       score += 1

        score += project_criticality[i] - 1

        if task_type[i] == "bug":            score += 2
        elif task_type[i] == "devops":       score += 1

        if score >= 8:       priority.append(3)   # Critical
        elif score >= 5:     priority.append(2)   # High
        elif score >= 2:     priority.append(1)   # Medium
        else:                priority.append(0)   # Low

    # Add 5% noise
    priority = np.array(priority)
    noise_idx = np.random.choice(n, int(n * 0.05), replace=False)
    priority[noise_idx] = np.random.randint(0, 4, len(noise_idx))

    return pd.DataFrame({
        "deadline_days": deadline_days,
        "estimated_hours": estimated_hours,
        "num_dependencies": num_dependencies,
        "assignee_current_load": assignee_load,
        "project_criticality": project_criticality,
        "task_type_encoded": task_type_enc,
        "priority": priority,
    }), le


def train():
    print("🔧  Training Task Priority model...")
    df, le = generate_task_data(N)

    X = df.drop("priority", axis=1)
    y = df["priority"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    print(classification_report(y_test, model.predict(X_test),
                                target_names=["Low", "Medium", "High", "Critical"]))

    out_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(out_dir, exist_ok=True)
    joblib.dump(model, os.path.join(out_dir, "task_priority.pkl"))
    joblib.dump(le,    os.path.join(out_dir, "task_type_encoder.pkl"))
    print("✅  task_priority.pkl saved")


if __name__ == "__main__":
    train()