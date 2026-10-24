import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from extensions import db, bcrypt
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.scanner import scanner_bp
from routes.links import links_bp
from routes.cases import cases_bp
from routes.reviews import reviews_bp
from routes.settings import settings_bp
from routes.notifications import notifications_bp
from models import User, Case, ScanResult, HumanReview, Notification, UserSettings

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)
    db.init_app(app)
    bcrypt.init_app(app)
    JWTManager(app)

    for bp in [auth_bp, dashboard_bp, scanner_bp, links_bp, cases_bp, reviews_bp, settings_bp, notifications_bp]:
        app.register_blueprint(bp, url_prefix="/api")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "ScamShield AI API"})

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(400)
    def bad_request(err):
        return jsonify({"error": getattr(err, "description", "Bad request")}), 400

    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG") == "1")
