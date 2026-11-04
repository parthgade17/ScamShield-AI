import sys
import os
from pathlib import Path

# Add current directory first so packaged app.py and scam_model.py are found immediately
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

backend_dir = current_dir.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(1, str(backend_dir))

from app import app, initialize_database

try:
    initialize_database()
except Exception as e:
    print("[VERCEL API] Cold start init exception:", e)

# Vercel looks for 'app' WSGI entrypoint
