"""
Service — Smart Leave Approval Suggester
Called by routes/leave.py
"""

import os, joblib
import numpy as np

_MODEL_DIR  = os.path.join(os.path.dirname(__file__), "..", "models")
_model      = None
_scaler     = None
_le_phase   = None

SUGGESTION_LABELS = {0: "Reject", 1: "Conditional Approval", 2: "Approve"}
SUGGESTION_COLORS = {0: "#EF4444", 1: "#F59E0B", 2: "#10B981"}

PHASE_OPTIONS = ["deployment", "development", "maintenance", "planning", "testing"]  # alphabetical


def _load():
    global _model, _scaler, _le_phase
    if _model is None:
        _model    = joblib.load(os.path.join(_MODEL_DIR, "leave_approval.pkl"))
        _scaler   = joblib.load(os.path.join(_MODEL_DIR, "leave_scaler.pkl"))
        _le_phase = joblib.load(os.path.join(_MODEL_DIR, "phase_encoder.pkl"))


def suggest_leave(data: dict) -> dict:
    """
    Expected input:
    {
        "team_size"                    : int,
        "team_on_leave_count"          : int,
        "days_until_deadline"          : int,
        "project_phase"                : str,   # planning/development/testing/deployment/maintenance
        "employee_leave_balance"       : int,
        "request_duration_days"        : int,
        "advance_notice_days"          : int,
        "employee_performance_band"    : int,   # 0-3 from productivity model
        "consecutive_leaves_taken"     : int
    }
    """
    _load()

    team_size = int(data.get("team_size", 5))
    on_leave  = int(data.get("team_on_leave_count", 0))
    avail_pct = ((team_size - on_leave) / max(team_size, 1)) * 100

    phase_str = data.get("project_phase", "development").lower()
    if phase_str not in PHASE_OPTIONS:
        phase_str = "development"
    phase_enc = int(_le_phase.transform([phase_str])[0])

    features = np.array([[
        team_size,
        on_leave,
        avail_pct,
        int(data.get("days_until_deadline", 30)),
        phase_enc,
        int(data.get("employee_leave_balance", 15)),
        int(data.get("request_duration_days", 3)),
        int(data.get("advance_notice_days", 7)),
        int(data.get("employee_performance_band", 1)),
        int(data.get("consecutive_leaves_taken", 0)),
    ]])

    features_s = _scaler.transform(features)
    pred       = int(_model.predict(features_s)[0])
    proba      = _model.predict_proba(features_s)[0]
    confidence = float(round(proba[pred] * 100, 1))

    return {
        "suggestion_code"   : pred,
        "suggestion_label"  : SUGGESTION_LABELS[pred],
        "suggestion_color"  : SUGGESTION_COLORS[pred],
        "confidence_pct"    : confidence,
        "team_availability" : round(avail_pct, 1),
        "all_probabilities" : {
            SUGGESTION_LABELS[i]: round(float(p) * 100, 1)
            for i, p in enumerate(proba)
        },
        "conditions"        : _conditions(pred, data, avail_pct),
        "recommendation"    : _recommendation(pred, data),
    }


def _conditions(pred: int, data: dict, avail_pct: float) -> list:
    if pred == 2:
        return ["No conditions — proceed with approval"]

    conditions = []
    if pred == 0:
        if int(data.get("employee_leave_balance", 15)) < int(data.get("request_duration_days", 3)):
            conditions.append("Insufficient leave balance")
        if avail_pct < 60:
            conditions.append("Team capacity too low to accommodate absence")
        if int(data.get("days_until_deadline", 30)) < 3:
            conditions.append("Critical deadline imminent")
        return conditions or ["Leave cannot be approved at this time"]

    # Conditional
    if avail_pct < 75:
        conditions.append("Ensure coverage is arranged before leave starts")
    if int(data.get("request_duration_days", 3)) > 7:
        conditions.append("Consider splitting leave into shorter periods")
    if data.get("project_phase") in ("testing", "deployment"):
        conditions.append("Get manager sign-off given current project phase")
    return conditions or ["Coordinate handover with team before leaving"]


def _recommendation(pred: int, data: dict) -> str:
    duration = int(data.get("request_duration_days", 3))
    if pred == 0:
        return f"❌ Reject — leave of {duration} day(s) cannot be approved at this time. Suggest rescheduling."
    elif pred == 1:
        return f"⚠️  Conditional — {duration}-day leave may be approved if conditions are met."
    else:
        return f"✅ Approve — {duration}-day leave looks feasible. Confirm in system."