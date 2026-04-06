"""
Service — Employee Productivity Scorer
Called by routes/productivity.py
"""

import os, joblib
import numpy as np

_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
_model     = None
_scaler    = None

BAND_LABELS = {0: "Low", 1: "Average", 2: "Good", 3: "Excellent"}
BAND_COLORS = {0: "#EF4444", 1: "#F59E0B", 2: "#3B82F6", 3: "#10B981"}
BAND_SCORES = {0: (0, 34), 1: (35, 54), 2: (55, 74), 3: (75, 100)}


def _load():
    global _model, _scaler
    if _model is None:
        _model  = joblib.load(os.path.join(_MODEL_DIR, "productivity.pkl"))
        _scaler = joblib.load(os.path.join(_MODEL_DIR, "productivity_scaler.pkl"))


def score_productivity(data: dict) -> dict:
    """
    Expected input:
    {
        "attendance_pct"            : float,  # 0-100
        "tasks_completed_monthly"   : int,
        "tasks_assigned_monthly"    : int,
        "avg_task_completion_days"  : float,
        "leave_days_taken"          : int,
        "on_time_delivery_pct"      : float,  # 0-100
        "peer_review_score"         : float,  # 1-5
        "bug_rate"                  : float,  # 0-1
        "overtime_hours"            : int
    }
    """
    _load()

    features = np.array([[
        float(data.get("attendance_pct", 90)),
        int(data.get("tasks_completed_monthly", 10)),
        int(data.get("tasks_assigned_monthly", 12)),
        float(data.get("avg_task_completion_days", 3)),
        int(data.get("leave_days_taken", 2)),
        float(data.get("on_time_delivery_pct", 80)),
        float(data.get("peer_review_score", 3.5)),
        float(data.get("bug_rate", 0.1)),
        int(data.get("overtime_hours", 0)),
    ]])

    features_s = _scaler.transform(features)
    pred       = int(_model.predict(features_s)[0])
    proba      = _model.predict_proba(features_s)[0]

    # Compute a 0-100 numeric score from class probabilities
    numeric_score = int(round(
        proba[0] * 17 + proba[1] * 45 + proba[2] * 65 + proba[3] * 87
    ))

    tasks_a = int(data.get("tasks_assigned_monthly", 1)) or 1
    tasks_c = int(data.get("tasks_completed_monthly", 0))
    completion_rate = round(tasks_c / tasks_a * 100, 1)

    return {
        "band_code"         : pred,
        "band_label"        : BAND_LABELS[pred],
        "band_color"        : BAND_COLORS[pred],
        "score"             : numeric_score,          # 0-100
        "completion_rate"   : completion_rate,
        "all_probabilities" : {
            BAND_LABELS[i]: round(float(p) * 100, 1)
            for i, p in enumerate(proba)
        },
        "strengths"         : _strengths(data),
        "improvement_areas" : _improvement_areas(data),
        "recommendation"    : _recommendation(pred, numeric_score),
    }


def _strengths(data: dict) -> list:
    s = []
    if float(data.get("attendance_pct", 0)) >= 95:
        s.append("Excellent attendance")
    if float(data.get("on_time_delivery_pct", 0)) >= 90:
        s.append("Consistently on-time delivery")
    if float(data.get("peer_review_score", 0)) >= 4.5:
        s.append("High peer review ratings")
    if float(data.get("bug_rate", 1)) <= 0.05:
        s.append("Very low bug rate")
    tasks_a = int(data.get("tasks_assigned_monthly", 1)) or 1
    tasks_c = int(data.get("tasks_completed_monthly", 0))
    if tasks_c / tasks_a >= 0.95:
        s.append("Near-complete task delivery")
    return s or ["No standout strengths identified this period"]


def _improvement_areas(data: dict) -> list:
    areas = []
    if float(data.get("attendance_pct", 100)) < 80:
        areas.append("Improve attendance (currently below 80%)")
    if float(data.get("on_time_delivery_pct", 100)) < 70:
        areas.append("Work on on-time delivery rate")
    if float(data.get("bug_rate", 0)) > 0.2:
        areas.append("Reduce bug/defect rate")
    if float(data.get("peer_review_score", 5)) < 3:
        areas.append("Improve collaboration & peer review scores")
    return areas


def _recommendation(pred: int, score: int) -> str:
    recs = {
        3: f"🌟 Excellent performer (score {score}/100) — consider for promotion or mentorship role.",
        2: f"👍 Good performer (score {score}/100) — maintain momentum and target stretch goals.",
        1: f"📈 Average performer (score {score}/100) — set specific improvement targets for next quarter.",
        0: f"⚠️  Low performer (score {score}/100) — initiate improvement plan with manager review.",
    }
    return recs.get(pred, "")