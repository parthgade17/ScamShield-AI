from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Case, HumanReview, User
from utils import current_user_id, case_to_dict

reviews_bp = Blueprint("reviews", __name__)
VALID_DECISIONS = {"confirmed_scam", "likely_legitimate", "inconclusive"}

def reviewer_required():
    user = db.session.get(User, current_user_id())
    return user and user.role in ("reviewer", "admin")

@reviews_bp.get("/reviews/queue")
@jwt_required()
def review_queue():
    if not reviewer_required(): return jsonify({"error": "Reviewer access required"}), 403
    rows = Case.query.filter(Case.status == "pending_review").order_by(Case.created_at.asc()).limit(100).all()
    return jsonify({"items": [case_to_dict(c) for c in rows]})

@reviews_bp.get("/reviews/<public_id>")
@jwt_required()
def review_detail(public_id):
    if not reviewer_required(): return jsonify({"error": "Reviewer access required"}), 403
    case = Case.query.filter_by(public_id=public_id).first()
    if not case: return jsonify({"error": "Case not found"}), 404
    data = case_to_dict(case)
    data["submitted_text"] = case.submitted_text
    data["submitted_url"] = case.submitted_url
    return jsonify(data)

@reviews_bp.post("/reviews/<public_id>/decision")
@jwt_required()
def review_decision(public_id):
    if not reviewer_required(): return jsonify({"error": "Reviewer access required"}), 403
    data = request.get_json(silent=True) or {}
    decision, notes = data.get("decision"), (data.get("notes") or "").strip()[:2000]
    if decision not in VALID_DECISIONS: return jsonify({"error": "Invalid review decision"}), 400
    case = Case.query.filter_by(public_id=public_id).first()
    if not case: return jsonify({"error": "Case not found"}), 404
    review = HumanReview(case_id=case.id, reviewer_id=current_user_id(), decision=decision, notes=notes)
    case.status = "reviewed"
    db.session.add(review); db.session.commit()
    return jsonify({"message": "Review decision saved", "case_id": public_id, "status": case.status})
