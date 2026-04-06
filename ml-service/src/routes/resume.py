"""
Route — /api/ml/resume
POST /parse  — upload PDF/DOCX, get structured employee profile
"""

from flask import Blueprint, request, jsonify
from services.resume_parser import parse_resume

resume_bp = Blueprint("resume", __name__)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}
MAX_FILE_SIZE_MB   = 10


@resume_bp.route("/parse", methods=["POST"])
def parse():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Send as multipart/form-data with key 'file'"}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400

    ext = "." + f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"Unsupported file type '{ext}'. Allowed: {ALLOWED_EXTENSIONS}"}), 415

    file_bytes = f.read()
    if len(file_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        return jsonify({"error": f"File too large. Max {MAX_FILE_SIZE_MB} MB"}), 413

    try:
        result = parse_resume(file_bytes, f.filename)
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"error": "Failed to parse resume", "detail": str(e)}), 500