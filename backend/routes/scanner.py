from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Case, ScanResult, UserSettings, Notification
from services.scam_detector import analyze_text
from utils import current_user_id, make_case_id, clean_text, case_to_dict

scanner_bp = Blueprint("scanner", __name__)

@scanner_bp.post("/scans/text")
@jwt_required()
def scan_text():
    data = request.get_json(silent=True) or {}
    text = clean_text(data.get("text"), 10000)
    if len(text) < 3:
        return jsonify({"error": "Enter a message containing at least 3 characters."}), 400
    uid = current_user_id()
    result = analyze_text(text)
    case = Case(public_id=make_case_id(), user_id=uid, case_type="text_scan",
                status="pending_review" if result["risk_level"] in ("high", "medium") else "new",
                submitted_text=text)
    db.session.add(case); db.session.flush()
    db.session.add(ScanResult(case_id=case.id, classification=result["classification"],
        risk_level=result["risk_level"], risk_score=result.get("risk_score"),
        signals_json=result.get("signals", []), recommended_actions_json=result.get("recommended_actions", []),
        uncertainty=result.get("uncertainty"), model_version=result.get("model_version", "rules-v1")))
    settings = UserSettings.query.filter_by(user_id=uid).first()
    if settings and settings.notifications_enabled and result["risk_level"] in ("high", "medium"):
        db.session.add(Notification(user_id=uid, title="Scan requires attention",
            message=f"Your scan {case.public_id} has {result['risk_level']} risk indicators."))
    db.session.commit()
    output = case_to_dict(case)
    output["review_recommended"] = result["risk_level"] in ("high", "medium")
    return jsonify(output), 201
