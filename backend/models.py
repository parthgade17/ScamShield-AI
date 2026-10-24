from datetime import datetime, timezone
from extensions import db

def utcnow():
    return datetime.now(timezone.utc)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    settings = db.relationship("UserSettings", backref="user", uselist=False, cascade="all, delete-orphan")

class Case(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(24), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    case_type = db.Column(db.String(30), nullable=False)  # text_scan or link_check
    status = db.Column(db.String(30), nullable=False, default="new")
    submitted_text = db.Column(db.Text, nullable=True)
    submitted_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    scan_result = db.relationship("ScanResult", backref="case", uselist=False, cascade="all, delete-orphan")
    reviews = db.relationship("HumanReview", backref="case", cascade="all, delete-orphan")

class ScanResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("case.id"), unique=True, nullable=False)
    classification = db.Column(db.String(40), nullable=False)
    risk_level = db.Column(db.String(20), nullable=False)
    risk_score = db.Column(db.Integer, nullable=True)
    signals_json = db.Column(db.JSON, nullable=False, default=list)
    recommended_actions_json = db.Column(db.JSON, nullable=False, default=list)
    uncertainty = db.Column(db.String(500), nullable=True)
    model_version = db.Column(db.String(80), nullable=False, default="rules-v1")
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

class HumanReview(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("case.id"), nullable=False, index=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    decision = db.Column(db.String(40), nullable=False)
    notes = db.Column(db.String(2000), nullable=True)
    reviewed_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

class UserSettings(db.Model):
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key=True)
    language = db.Column(db.String(10), nullable=False, default="en")
    theme = db.Column(db.String(10), nullable=False, default="light")
    notifications_enabled = db.Column(db.Boolean, nullable=False, default=True)
    history_enabled = db.Column(db.Boolean, nullable=False, default=True)
