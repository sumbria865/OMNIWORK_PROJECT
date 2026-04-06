"""
Route — /api/ml/project
POST /predict-delay  — predict if a project will be delayed
"""

from flask import Blueprint, request, jsonify
from services.project_predictor import predict_delay

project_bp = Blueprint("project", __name__)

REQUIRED_FIELDS = ["total_tasks", "completed_tasks", "team_size", "deadline_days_remaining"]


@project_bp.route("/predict-delay", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    missing = [f for f in REQUIRED_FIELDS if f not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 422

    try:
        result = predict_delay(data)
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"error": "Prediction failed", "detail": str(e)}), 500


@project_bp.route("/schema", methods=["GET"])
def schema():
    return jsonify({
        "endpoint": "POST /api/ml/project/predict-delay",
        "required": {
            "total_tasks"              : "int — total tasks in project",
            "completed_tasks"          : "int — tasks completed so far",
            "team_size"                : "int — number of team members",
            "deadline_days_remaining"  : "int — days left (negative = past due)",
        },
        "optional": {
            "avg_task_completion_rate" : "float — tasks/day, default 1.0",
            "num_blockers"             : "int — open blockers, default 0",
            "sprint_velocity"          : "float — story points/sprint, default 20",
            "budget_utilization_pct"   : "float — 1.0=on budget, 1.2=20% over",
            "complexity_score"         : "int — 1 to 10, default 5",
        },
    })