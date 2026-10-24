import sys
import os
from pathlib import Path

# Ensure paths are added
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "scamshield-ai" / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from app import app, initialize_database

# Run cold-start DB initialization
try:
    initialize_database()
except Exception as e:
    print("[VERCEL API] Cold start init exception:", e)

# Vercel looks for 'app' WSGI entrypoint
