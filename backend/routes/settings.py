from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, UserSettings
from utils import current_user_id

settings_bp = Blueprint("settings", __name__)

@settings_bp.get("/profile")
@jwt_required()
def profile():
    user = db.session.get(User, current_user_id())
    return jsonify({"id": user.id, "name": user.name, "email": user.email, "role": user.role})

@settings_bp.patch("/profile")
@jwt_required()
def update_profile():
    user = db.session.get(User, current_user_id())
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    if name is not None:
        if not isinstance(name, str) or len(name.strip()) < 2: return jsonify({"error": "Name must contain at least 2 characters"}), 400
        user.name = name.strip()[:100]
    db.session.commit()
    return jsonify({"id": user.id, "name": user.name, "email": user.email, "role": user.role})

@settings_bp.get("/settings")
@jwt_required()
def get_settings():
    row = UserSettings.query.filter_by(user_id=current_user_id()).first()
    return jsonify({"language": row.language, "theme": row.theme,
                    "notifications_enabled": row.notifications_enabled, "history_enabled": row.history_enabled})

@settings_bp.patch("/settings")
@jwt_required()
def update_settings():
    row = UserSettings.query.filter_by(user_id=current_user_id()).first()
    data = request.get_json(silent=True) or {}
    if "language" in data:
        if data["language"] not in ("en", "hi", "mr"): return jsonify({"error": "Supported languages: en, hi, mr"}), 400
        row.language = data["language"]
    if "theme" in data:
        if data["theme"] not in ("light", "dark"): return jsonify({"error": "Theme must be light or dark"}), 400
        row.theme = data["theme"]
    for key in ("notifications_enabled", "history_enabled"):
        if key in data:
            if not isinstance(data[key], bool): return jsonify({"error": f"{key} must be boolean"}), 400
            setattr(row, key, data[key])
    db.session.commit()
    return jsonify({"language": row.language, "theme": row.theme,
                    "notifications_enabled": row.notifications_enabled, "history_enabled": row.history_enabled})
