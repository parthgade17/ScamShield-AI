"""
Database models for ScamShield AI.
Mirrored from app.py for clean import compatibility across scripts.
"""

from app import db, User, Case, ScanResult, HumanReview, Notification, ScanHistory, LinkCheck, ScamReport, UserPreference

__all__ = [
    "db",
    "User",
    "Case",
    "ScanResult",
    "HumanReview",
    "Notification",
    "ScanHistory",
    "LinkCheck",
    "ScamReport",
    "UserPreference",
]
