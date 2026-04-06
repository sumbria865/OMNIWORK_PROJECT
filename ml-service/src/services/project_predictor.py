"""
Service — Project Delay Predictor
Called by routes/project.py
"""

import os, joblib
import numpy as np

_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
_model     = None
_scaler    = None

DELAY_LABELS = {0: "On Track", 1: "At Risk", 2: "Delayed"}
DELAY_COLORS = {0: "#10B981", 1: "#F59E0B", 2: "#EF4444"}


def _load():
    global _model, _scaler
    if _model is None:
        _model  = joblib.load(os.path.join(_MODEL_DIR, "project_delay.pkl"))
        _scaler = joblib.load(os.path.join(_MODEL_DIR, "project_delay_scaler.pkl"))


def predict_delay(data: dict) -> dict:
    """
    Expected input:
    {
        "total_tasks"              : int,
        "completed_tasks"          : int,
        "team_size"                : int,
        "deadline_days_remaining"  : int,   # negative if past due
        "avg_task_completion_rate" : float, # tasks completed per day
        "num_blockers"             : int,
        "sprint_velocity"          : float,
        "budget_utilization_pct"   : float, # 1.0 = on budget, 1.2 = 20% over
        "complexity_score"         : int    # 1-10
    }
    """
    _load()

    features = np.array([[
        int(data.get("total_tasks", 50)),
        int(data.get("completed_tasks", 0)),
        int(data.get("team_size", 5)),
        int(data.get("deadline_days_remaining", 30)),
        float(data.get("avg_task_completion_rate", 1.0)),
        int(data.get("num_blockers", 0)),
        float(data.get("sprint_velocity", 20.0)),
        float(data.get("budget_utilization_pct", 1.0)),
        int(data.get("complexity_score", 5)),
    ]])

    features_s = _scaler.transform(features)
    pred       = int(_model.predict(features_s)[0])
    proba      = _model.predict_proba(features_s)[0]
    confidence = float(round(proba[pred] * 100, 1))

    # Extra insight — completion percentage
    total     = int(data.get("total_tasks", 1)) or 1
    completed = int(data.get("completed_tasks", 0))
    completion_pct = round(completed / total * 100, 1)

    return {
        "status_code"       : pred,
        "status_label"      : DELAY_LABELS[pred],
        "status_color"      : DELAY_COLORS[pred],
        "confidence_pct"    : confidence,
        "completion_pct"    : completion_pct,
        "all_probabilities" : {
            DELAY_LABELS[i]: round(float(p) * 100, 1)
            for i, p in enumerate(proba)
        },
        "risk_factors"      : _risk_factors(data),
        "recommendation"    : _recommendation(pred, data),
    }


def _risk_factors(data: dict) -> list:
    factors = []
    days = int(data.get("deadline_days_remaining", 30))
    if days < 0:
        factors.append(f"Past deadline by {abs(days)} day(s)")
    elif days < 7:
        factors.append(f"Only {days} day(s) until deadline")

    if float(data.get("budget_utilization_pct", 1)) > 1.1:
        factors.append("Over budget")

    if int(data.get("num_blockers", 0)) >= 3:
        factors.append(f"{data['num_blockers']} active blockers")

    total     = int(data.get("total_tasks", 1)) or 1
    completed = int(data.get("completed_tasks", 0))
    if completed / total < 0.3 and days < 14:
        factors.append("Low task completion with tight deadline")

    return factors


def _recommendation(pred: int, data: dict) -> str:
    if pred == 2:
        return "🚨 Project is delayed — escalate to stakeholders, re-scope or add resources."
    elif pred == 1:
        blockers = int(data.get("num_blockers", 0))
        msg = "⚠️ At risk — resolve blockers immediately"
        if blockers > 0:
            msg += f" ({blockers} open)"
        return msg + "."
    else:
        return "✅ Project is on track — continue current pace."