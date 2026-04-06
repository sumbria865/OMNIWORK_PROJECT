"""
Training Script — Smart Leave Approval Suggester
Features: team_size, team_on_leave_count, days_until_deadline,
          project_phase_encoded, employee_leave_balance,
          request_duration_days, advance_notice_days,
          employee_performance_band, consecutive_leaves_taken
Label   : suggestion (0=Reject, 1=Approve with conditions, 2=Approve)
"""

import os, joblib, numpy as np, pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report

np.random.seed(55)
N = 4000


def generate_leave_data(n):
    team_size               = np.random.randint(3, 30, n)
    on_leave                = np.array([np.random.randint(0, ts) for ts in team_size])
    team_availability_pct   = (team_size - on_leave) / team_size * 100

    days_until_deadline     = np.random.randint(-5, 60, n)
    project_phase           = np.random.choice(
        ["planning", "development", "testing", "deployment", "maintenance"], n
    )
    le_phase = LabelEncoder()
    phase_enc = le_phase.fit_transform(project_phase)

    leave_balance           = np.random.randint(0, 30, n)
    request_duration        = np.random.randint(1, 15, n)
    advance_notice          = np.random.randint(0, 30, n)
    performance_band        = np.random.randint(0, 4, n)   # 0-3 (matches productivity model)
    consecutive_prev        = np.random.randint(0, 5, n)

    labels = []
    for i in range(n):
        risk = 0

        # Team capacity
        if team_availability_pct[i] < 60:   risk += 3
        elif team_availability_pct[i] < 75: risk += 1

        # Deadline pressure
        if days_until_deadline[i] < 0:      risk += 4
        elif days_until_deadline[i] < 7:    risk += 3
        elif days_until_deadline[i] < 14:   risk += 1

        # Critical project phase
        if project_phase[i] in ("deployment", "testing"):  risk += 2

        # Leave balance
        if leave_balance[i] < request_duration[i]:         risk += 3
        elif leave_balance[i] == 0:                         risk += 4

        # Short notice
        if advance_notice[i] < 2:    risk += 2
        elif advance_notice[i] < 7:  risk += 1

        # Long duration
        if request_duration[i] > 10: risk += 1

        # Performance boost
        risk -= performance_band[i] // 2

        if risk >= 6:    labels.append(0)   # Reject
        elif risk >= 3:  labels.append(1)   # Conditional
        else:            labels.append(2)   # Approve

    labels = np.array(labels)
    noise_idx = np.random.choice(n, int(n * 0.04), replace=False)
    labels[noise_idx] = np.random.randint(0, 3, len(noise_idx))

    return pd.DataFrame({
        "team_size": team_size,
        "team_on_leave_count": on_leave,
        "team_availability_pct": team_availability_pct,
        "days_until_deadline": days_until_deadline,
        "project_phase_encoded": phase_enc,
        "employee_leave_balance": leave_balance,
        "request_duration_days": request_duration,
        "advance_notice_days": advance_notice,
        "employee_performance_band": performance_band,
        "consecutive_leaves_taken": consecutive_prev,
        "label": labels,
    }), le_phase


def train():
    print("🔧  Training Leave Approval model...")
    df, le_phase = generate_leave_data(N)

    X = df.drop("label", axis=1)
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    model = GradientBoostingClassifier(
        n_estimators=250, learning_rate=0.1, max_depth=6, random_state=42
    )
    model.fit(X_train_s, y_train)

    print(classification_report(y_test, model.predict(X_test_s),
                                target_names=["Reject", "Conditional", "Approve"]))

    out_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(out_dir, exist_ok=True)
    joblib.dump(model,    os.path.join(out_dir, "leave_approval.pkl"))
    joblib.dump(scaler,   os.path.join(out_dir, "leave_scaler.pkl"))
    joblib.dump(le_phase, os.path.join(out_dir, "phase_encoder.pkl"))
    print("✅  leave_approval.pkl saved")


if __name__ == "__main__":
    train()