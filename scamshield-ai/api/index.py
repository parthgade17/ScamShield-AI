import sys
import os
from pathlib import Path

# Setup sys.path to find backend
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import app, initialize_database

try:
    initialize_database()
except Exception as e:
    print("[VERCEL API] Cold start init exception:", e)
