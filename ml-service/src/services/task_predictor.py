"""
Service — Task Priority Predictor
Called by routes/task.py
"""

import os, joblib
import numpy as np

_MODEL_DIR  = os.path.join(os.path.dirname(__file__), "..", "models")
_model      = None
_le         = None

PRIORITY_LABELS = {0: "Low", 1: "Medium", 2: "High", 3: "Critical"}
PRIORITY_COLORS = {0: "#6B7280", 1: "#F59E0B", 2: "#EF4444", 3: "#7C3AED"}

TASK_TYPES = ["bug", "devops", "feature", "qa", "research"]   # alphabetical (LabelEncoder order)


def _load():
    global _model, _le
    if _model is None:
        _model = joblib.load(os.path.join(_MODEL_DIR, "task_priority.pkl"))
        _le    = joblib.load(os.path.join(_MODEL_DIR, "task_type_encoder.pkl"))


def predict_priority(data: dict) -> dict:
    """
    Expected input (from Express route):
    {
        "deadline_days"          : int,   # days until due date
        "estimated_hours"        : int,
        "num_dependencies"       : int,
        "assignee_current_load"  : int,   # tasks already on assignee
        "project_criticality"    : int,   # 1-4
        "task_type"              : str    # bug / feature / research / devops / qa
    }
    """
    _load()

    task_type_str = data.get("task_type", "feature").lower()
    if task_type_str not in TASK_TYPES:
        task_type_str = "feature"
    task_type_enc = int(_le.transform([task_type_str])[0])

    features = np.array([[
        int(data.get("deadline_days", 30)),
        int(data.get("estimated_hours", 8)),
        int(data.get("num_dependencies", 0)),
        int(data.get("assignee_current_load", 5)),
        int(data.get("project_criticality", 2)),
        task_type_enc,
    ]])

    pred        = int(_model.predict(features)[0])
    proba       = _model.predict_proba(features)[0]
    confidence  = float(round(proba[pred] * 100, 1))

    return {
        "priority_code"   : pred,
        "priority_label"  : PRIORITY_LABELS[pred],
        "priority_color"  : PRIORITY_COLORS[pred],
        "confidence_pct"  : confidence,
        "all_probabilities": {
            PRIORITY_LABELS[i]: round(float(p) * 100, 1)
            for i, p in enumerate(proba)
        },
        "recommendation": _recommendation(pred, data),
    }


def _recommendation(pred: int, data: dict) -> str:
    msgs = {
        3: f"⚡ CRITICAL — assign immediately. Deadline in {data.get('deadline_days', '?')} day(s).",
        2: "🔴 High priority — schedule within the next sprint.",
        1: "🟡 Medium priority — add to upcoming backlog.",
        0: "🟢 Low priority — park in icebox, revisit next cycle.",
    }
    return msgs.get(pred, "")