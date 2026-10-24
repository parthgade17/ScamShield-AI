from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Notification
from utils import current_user_id, iso

notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.get("/notifications")
@jwt_required()
def list_notifications():
    rows = Notification.query.filter_by(user_id=current_user_id()).order_by(Notification.created_at.desc()).limit(100).all()
    return jsonify({"items": [{"id": n.id, "title": n.title, "message": n.message, "is_read": n.is_read, "created_at": iso(n.created_at)} for n in rows]})

@notifications_bp.patch("/notifications/<int:notification_id>/read")
@jwt_required()
def mark_read(notification_id):
    row = Notification.query.filter_by(id=notification_id, user_id=current_user_id()).first()
    if not row: return jsonify({"error": "Notification not found"}), 404
    row.is_read = True; db.session.commit()
    return jsonify({"message": "Notification marked as read"})

@notifications_bp.post("/auth/logout")
@jwt_required()
def logout():
    # This starter uses short-lived stateless JWTs. Frontend must discard token.
    # Production logout should use refresh-token rotation or a server-side denylist.
    return jsonify({"message": "Logged out. Discard the access token on the client."})
