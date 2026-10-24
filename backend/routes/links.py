from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Case, ScanResult, UserSettings, Notification
from services.url_checker import check_url
from utils import current_user_id, make_case_id, clean_text, case_to_dict

links_bp = Blueprint("links", __name__)

@links_bp.post("/links/check")
@jwt_required()
def check_link():
    data = request.get_json(silent=True) or {}
    url = clean_text(data.get("url"), 2048)
    if not url:
        return jsonify({"error": "Provide a URL to check."}), 400
    result = check_url(url)
    if result["classification"] == "invalid":
        return jsonify(result), 400
    uid = current_user_id()
    case = Case(public_id=make_case_id(), user_id=uid, case_type="link_check",
                status="pending_review" if result["risk_level"] in ("high", "medium") else "new",
                submitted_url=url)
    db.session.add(case); db.session.flush()
    db.session.add(ScanResult(case_id=case.id, classification=result["classification"],
        risk_level=result["risk_level"], risk_score=result.get("risk_score"),
        signals_json=result.get("signals", []), recommended_actions_json=result.get("recommended_actions", []),
        uncertainty=result.get("uncertainty"), model_version=result.get("model_version", "url-rules-v1")))
    settings = UserSettings.query.filter_by(user_id=uid).first()
    if settings and settings.notifications_enabled and result["risk_level"] in ("high", "medium"):
        db.session.add(Notification(user_id=uid, title="Link check requires attention",
            message=f"Your link check {case.public_id} has {result['risk_level']} risk indicators."))
    db.session.commit()
    return jsonify(case_to_dict(case)), 201
