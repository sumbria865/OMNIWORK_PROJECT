"""
Route — /api/ml/productivity
POST /score     — score a single employee
POST /score-batch — score multiple employees at once
"""

from flask import Blueprint, request, jsonify
from services.productivity_scorer import score_productivity

productivity_bp = Blueprint("productivity", __name__)

REQUIRED_FIELDS = [
    "attendance_pct",
    "tasks_completed_monthly",
    "tasks_assigned_monthly",
    "on_time_delivery_pct",
]


def _validate(data: dict):
    return [f for f in REQUIRED_FIELDS if f not in data]


@productivity_bp.route("/score", methods=["POST"])
def score():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    missing = _validate(data)
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 422

    try:
        result = score_productivity(data)
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"error": "Scoring failed", "detail": str(e)}), 500


@productivity_bp.route("/score-batch", methods=["POST"])
def score_batch():
    """
    Score multiple employees in one call.
    Body: { "employees": [ { "employee_id": "...", ...fields }, ... ] }
    """
    body = request.get_json(silent=True)
    if not body or "employees" not in body:
        return jsonify({"error": "Body must have 'employees' array"}), 400

    employees = body["employees"]
    if not isinstance(employees, list) or len(employees) == 0:
        return jsonify({"error": "'employees' must be a non-empty array"}), 422
    if len(employees) > 200:
        return jsonify({"error": "Batch size limit is 200"}), 422

    results = []
    errors  = []
    for idx, emp in enumerate(employees):
        emp_id = emp.get("employee_id", str(idx))
        missing = _validate(emp)
        if missing:
            errors.append({"employee_id": emp_id, "error": f"Missing: {missing}"})
            continue
        try:
            scored = score_productivity(emp)
            results.append({"employee_id": emp_id, **scored})
        except Exception as e:
            errors.append({"employee_id": emp_id, "error": str(e)})

    return jsonify({
        "success"  : True,
        "processed": len(results),
        "failed"   : len(errors),
        "data"     : results,
        "errors"   : errors,
    }), 200


@productivity_bp.route("/schema", methods=["GET"])
def schema():
    return jsonify({
        "endpoint": "POST /api/ml/productivity/score",
        "required": {
            "attendance_pct"           : "float — 0 to 100",
            "tasks_completed_monthly"  : "int",
            "tasks_assigned_monthly"   : "int",
            "on_time_delivery_pct"     : "float — 0 to 100",
        },
        "optional": {
            "avg_task_completion_days" : "float — default 3",
            "leave_days_taken"         : "int — default 2",
            "peer_review_score"        : "float — 1 to 5, default 3.5",
            "bug_rate"                 : "float — 0 to 1, default 0.1",
            "overtime_hours"           : "int — default 0",
        },
    })