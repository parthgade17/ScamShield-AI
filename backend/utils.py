import re, secrets
from datetime import datetime

def make_case_id():
    return "SC-" + secrets.token_hex(4).upper()

def iso(dt):
    return dt.isoformat() if dt else None

def current_user_id():
    from flask_jwt_extended import get_jwt_identity
    return int(get_jwt_identity())

def clean_text(value, max_len=10000):
    if not isinstance(value, str):
        return ""
    return value.strip()[:max_len]

def is_valid_email(email):
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email or ""))

def case_to_dict(case):
    result = case.scan_result
    return {
        "case_id": case.public_id,
        "case_type": case.case_type,
        "status": case.status,
        "created_at": iso(case.created_at),
        "classification": result.classification if result else None,
        "risk_level": result.risk_level if result else None,
        "risk_score": result.risk_score if result else None,
        "signals": result.signals_json if result else [],
        "recommended_actions": result.recommended_actions_json if result else [],
        "uncertainty": result.uncertainty if result else None,
        "model_version": result.model_version if result else None
    }
