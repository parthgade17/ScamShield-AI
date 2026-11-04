import sys
import os
import time
from pathlib import Path

print("=" * 70, flush=True)
print("[VERCEL SERVERLESS DEPLOYMENT] Initializing ScamShield AI WSGI Runtime", flush=True)
print(f"[VERCEL SERVERLESS DEPLOYMENT] Python Version : {sys.version.split()[0]} ({sys.platform})", flush=True)
print(f"[VERCEL SERVERLESS DEPLOYMENT] UTC Timestamp  : {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}", flush=True)
print(f"[VERCEL SERVERLESS DEPLOYMENT] Execution Dir  : {Path(__file__).resolve().parent}", flush=True)

# Add current directory first so packaged app.py and scam_model.py are found immediately
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

backend_dir = current_dir.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(1, str(backend_dir))

has_db = bool(os.getenv("DATABASE_URL"))
has_gemini = bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
has_supa_url = bool(os.getenv("VITE_SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL"))
has_supa_key = bool(os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"))

print(f"[VERCEL SERVERLESS DEPLOYMENT] Env Check -> DB: {'Configured' if has_db else 'Default Fallback'}, Gemini: {'Configured' if has_gemini else 'Fallback Rules'}, Supabase: {'Configured' if (has_supa_url and has_supa_key) else 'Default Project'}", flush=True)

print("[VERCEL SERVERLESS DEPLOYMENT] Importing Flask Application...", flush=True)
from app import app, initialize_database

print("[VERCEL SERVERLESS DEPLOYMENT] Verifying database connectivity...", flush=True)
start_db = time.time()
try:
    initialize_database()
    duration_db = round((time.time() - start_db) * 1000, 1)
    print(f"[VERCEL SERVERLESS DEPLOYMENT] Database check completed in {duration_db}ms", flush=True)
except Exception as e:
    print(f"[VERCEL SERVERLESS DEPLOYMENT] Database check notice: {type(e).__name__}: {e}", flush=True)

print("[VERCEL SERVERLESS DEPLOYMENT] WSGI entrypoint 'app' ready to handle requests.", flush=True)
print("=" * 70, flush=True)
