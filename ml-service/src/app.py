import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)

    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    CORS(app, origins=allowed_origins, supports_credentials=True)

    from routes.resume       import resume_bp
    from routes.task         import task_bp
    from routes.project      import project_bp
    from routes.productivity import productivity_bp
    from routes.leave        import leave_bp

    app.register_blueprint(resume_bp,       url_prefix="/api/ml/resume")
    app.register_blueprint(task_bp,         url_prefix="/api/ml/task")
    app.register_blueprint(project_bp,      url_prefix="/api/ml/project")
    app.register_blueprint(productivity_bp, url_prefix="/api/ml/productivity")
    app.register_blueprint(leave_bp,        url_prefix="/api/ml/leave")

    @app.route("/health")
    def health():
        return jsonify({"status": "ok", "service": "omniwork-ml", "version": "1.0.0"})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error", "detail": str(e)}), 500

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)