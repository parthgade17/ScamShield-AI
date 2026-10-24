import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory or project root
load_dotenv(Path(__file__).with_name(".env"))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

raw_db_url = os.getenv("DATABASE_URL", "sqlite:///scamshield.db").strip()
if raw_db_url.startswith("postgres://"):
    db_uri = raw_db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
    db_uri = raw_db_url.replace("postgresql://", "postgresql+psycopg://", 1)
else:
    db_uri = raw_db_url

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-this-secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-change-this-jwt-secret")
    SQLALCHEMY_DATABASE_URI = db_uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 8
    CORS_ORIGINS = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")]
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    SAFE_BROWSING_API_KEY = os.getenv("SAFE_BROWSING_API_KEY", "")
