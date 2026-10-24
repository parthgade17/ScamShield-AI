from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db, bcrypt
from models import User, UserSettings
from utils import is_valid_email

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    name, email, password = (data.get("name") or "").strip(), (data.get("email") or "").strip().lower(), data.get("password") or ""
    if len(name) < 2 or not is_valid_email(email) or len(password) < 10:
        return jsonify({"error": "Provide a name, valid email, and password of at least 10 characters."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 409
    user = User(name=name[:100], email=email, password_hash=bcrypt.generate_password_hash(password).decode(), role="user")
    db.session.add(user); db.session.flush()
    db.session.add(UserSettings(user_id=user.id))
    db.session.commit()
    return jsonify({"message": "Account created. You can now log in."}), 201

@auth_bp.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email, password = (data.get("email") or "").strip().lower(), data.get("password") or ""
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password."}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}})

@auth_bp.get("/auth/me")
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user: return jsonify({"error": "User not found"}), 404
    return jsonify({"id": user.id, "name": user.name, "email": user.email, "role": user.role})
