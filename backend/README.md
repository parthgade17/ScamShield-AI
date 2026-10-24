# ScamShield AI — Flask Backend

REST API starter for the ScamShield AI frontend: dashboard, scam scanner, link checker, human review, case history, profile, language, theme, notifications and logout.

## Important limitations
- The default text detector is a transparent rule-based baseline, not a trained model and not a guarantee of accuracy.
- Gemini integration is optional. It adds possible evidence signals; it does not independently establish truth or guarantee correctness.
- URL checks do not visit submitted URLs. Heuristic results are not a security certification.
- This starter is for prototyping. Before production, add HTTPS, robust migrations, rate limiting, logging/monitoring, CSRF strategy if using cookies, account recovery, token revocation, privacy review, and more extensive tests.
- Do not use real banking credentials or store OTPs, PINs, passwords, or CVVs.

## 1. Setup (Windows PowerShell)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```
Edit `.env`; set strong random `SECRET_KEY` and `JWT_SECRET_KEY`. `GEMINI_API_KEY` and `SAFE_BROWSING_API_KEY` are optional. Keep `.env` private.

## 2. Run
```powershell
python app.py
```
API runs at `http://localhost:5000`. Health check: `GET /api/health`.
SQLite is used by default and `scamshield.db` is created automatically. For PostgreSQL, set `DATABASE_URL` to your database connection string.

## 3. Authentication
Register then log in. Include the returned access token in every protected request:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```
Example register body:
```json
{"name":"Demo User","email":"demo@example.com","password":"use-a-long-demo-password"}
```
Example login body:
```json
{"email":"demo@example.com","password":"use-a-long-demo-password"}
```
New users are assigned `user` role. To test reviewer pages locally, create an account and promote it manually in your local database to `reviewer` or `admin`. Never expose a public role-promotion endpoint.

## 4. API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard/summary` | Dashboard metrics |
| POST | `/api/scans/text` | Analyze a message |
| POST | `/api/links/check` | Check a URL |
| GET | `/api/cases` | Paginated case history |
| GET | `/api/cases/<case_id>` | Case detail |
| DELETE | `/api/cases/<case_id>` | Delete own case |
| GET | `/api/reviews/queue` | Reviewer queue |
| GET | `/api/reviews/<case_id>` | Reviewer case detail |
| POST | `/api/reviews/<case_id>/decision` | Save reviewer decision |
| GET/PATCH | `/api/profile` | Profile |
| GET/PATCH | `/api/settings` | Language, theme and preferences |
| GET | `/api/notifications` | Notification list |
| PATCH | `/api/notifications/<id>/read` | Mark notification read |
| POST | `/api/auth/logout` | Client-side JWT logout guidance |

### Example scan request
```json
{"text":"Your bank account will be blocked in 10 minutes. Verify immediately.","language":"en"}
```
### Example link request
```json
{"url":"https://example.com"}
```
### Example review decision
```json
{"decision":"inconclusive","notes":"Insufficient independent evidence."}
```

## 5. Frontend connection
Set frontend API base URL to `http://localhost:5000/api`. Store the access token using a deliberate security choice; for production, prefer secure, HttpOnly cookies with appropriate CSRF protections over localStorage. Do not expose API keys in Vite environment variables prefixed with `VITE_`.

## 6. Notes
- CORS origins are configured through `CORS_ORIGINS`.
- Database tables are created automatically for convenience. Use Alembic/Flask-Migrate for schema changes in a shared deployment.
- Optional Gemini calls can fail due to network, quota, model availability or malformed output; the baseline scan still returns.
- Safe Browsing API availability and terms should be checked before deployment.
