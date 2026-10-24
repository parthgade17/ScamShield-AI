from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from extensions import db
from models import Case, Notification, HumanReview
from utils import current_user_id, case_to_dict

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.get("/dashboard/summary")
@jwt_required()
def summary():
    uid = current_user_id()
    cases = Case.query.filter_by(user_id=uid)
    total = cases.count()
    high = cases.join(Case.scan_result).filter_by(risk_level="high").count()
    pending = Case.query.filter_by(user_id=uid, status="pending_review").count()
    unread = Notification.query.filter_by(user_id=uid, is_read=False).count()
    recent = cases.order_by(Case.created_at.desc()).limit(5).all()
    return jsonify({"total_scans": total, "high_risk": high, "pending_reviews": pending,
                    "notifications_unread": unread, "recent_cases": [case_to_dict(c) for c in recent]})
