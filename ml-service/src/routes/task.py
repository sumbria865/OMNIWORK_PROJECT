"""
Route — /api/ml/task
POST /predict-priority  — predict task priority from task metadata
"""

from flask import Blueprint, request, jsonify
from services.task_predictor import predict_priority

task_bp = Blueprint("task", __name__)

REQUIRED_FIELDS = ["deadline_days", "estimated_hours", "task_type"]


@task_bp.route("/predict-priority", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    missing = [f for f in REQUIRED_FIELDS if f not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 422

    try:
        result = predict_priority(data)
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"error": "Prediction failed", "detail": str(e)}), 500


@task_bp.route("/schema", methods=["GET"])
def schema():
    """Return expected input schema — useful for your Express backend."""
    return jsonify({
        "endpoint": "POST /api/ml/task/predict-priority",
        "required": {
            "deadline_days"         : "int — days until due date (e.g. 7)",
            "estimated_hours"       : "int — hours estimated (e.g. 16)",
            "task_type"             : "str — bug | feature | research | devops | qa",
        },
        "optional": {
            "num_dependencies"      : "int — default 0",
            "assignee_current_load" : "int — tasks on assignee, default 5",
            "project_criticality"   : "int — 1 to 4, default 2",
        },
    })