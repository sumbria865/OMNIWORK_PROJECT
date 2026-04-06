"""
Route — /api/ml/leave
POST /suggest  — suggest approve / reject / conditional for a leave request
"""

from flask import Blueprint, request, jsonify
from services.leave_predictor import suggest_leave

leave_bp = Blueprint("leave", __name__)

REQUIRED_FIELDS = [
    "team_size",
    "team_on_leave_count",
    "days_until_deadline",
    "request_duration_days",
    "employee_leave_balance",
]


@leave_bp.route("/suggest", methods=["POST"])
def suggest():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    missing = [f for f in REQUIRED_FIELDS if f not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 422

    try:
        result = suggest_leave(data)
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"error": "Suggestion failed", "detail": str(e)}), 500


@leave_bp.route("/schema", methods=["GET"])
def schema():
    return jsonify({
        "endpoint": "POST /api/ml/leave/suggest",
        "required": {
            "team_size"                : "int — total team members",
            "team_on_leave_count"      : "int — currently on leave",
            "days_until_deadline"      : "int — days to next project deadline",
            "request_duration_days"    : "int — how many days leave requested",
            "employee_leave_balance"   : "int — remaining leave days",
        },
        "optional": {
            "project_phase"            : "str — planning|development|testing|deployment|maintenance",
            "advance_notice_days"      : "int — how far ahead request was made, default 7",
            "employee_performance_band": "int — 0 to 3 (from productivity model), default 1",
            "consecutive_leaves_taken" : "int — recent consecutive leaves, default 0",
        },
    })