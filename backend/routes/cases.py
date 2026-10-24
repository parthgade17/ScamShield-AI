from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Case, UserSettings
from utils import current_user_id, case_to_dict

cases_bp = Blueprint("cases", __name__)

@cases_bp.get("/cases")
@jwt_required()
def list_cases():
    uid = current_user_id()
    settings = UserSettings.query.filter_by(user_id=uid).first()
    if settings and not settings.history_enabled:
        return jsonify({"items": [], "page": 1, "per_page": 20, "total": 0, "history_disabled": True})
    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(100, max(1, request.args.get("per_page", 20, type=int)))
    query = Case.query.filter_by(user_id=uid)
    kind, risk, status = request.args.get("type"), request.args.get("risk"), request.args.get("status")
    if kind in ("text_scan", "link_check"): query = query.filter_by(case_type=kind)
    if status: query = query.filter_by(status=status)
    if risk: query = query.join(Case.scan_result).filter_by(risk_level=risk)
    total = query.count()
    rows = query.order_by(Case.created_at.desc()).offset((page-1)*per_page).limit(per_page).all()
    return jsonify({"items": [case_to_dict(c) for c in rows], "page": page, "per_page": per_page, "total": total})

@cases_bp.get("/cases/<public_id>")
@jwt_required()
def get_case(public_id):
    case = Case.query.filter_by(public_id=public_id, user_id=current_user_id()).first()
    if not case: return jsonify({"error": "Case not found"}), 404
    data = case_to_dict(case)
    data["submitted_text"] = case.submitted_text
    data["submitted_url"] = case.submitted_url
    data["reviews"] = [{"decision": r.decision, "notes": r.notes, "reviewed_at": r.reviewed_at.isoformat()} for r in case.reviews]
    return jsonify(data)

@cases_bp.delete("/cases/<public_id>")
@jwt_required()
def delete_case(public_id):
    case = Case.query.filter_by(public_id=public_id, user_id=current_user_id()).first()
    if not case: return jsonify({"error": "Case not found"}), 404
    db.session.delete(case); db.session.commit()
    return jsonify({"message": "Case deleted"})
