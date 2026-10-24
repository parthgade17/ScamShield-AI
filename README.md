# ScamShield AI 🛡️
### Multilingual AI-Powered Fraud Detection & Security Intelligence System

ScamShield AI is an intelligent digital safety platform designed to detect fraudulent messages, deceptive payment scams, phishing links, and malicious screenshots in real time. It blends **Gemini Generative AI**, **heuristics & regex rules**, and **NLP indicators** with native regional language support (**Hindi, Marathi, and English**) and speech assistance.

---

## 🌟 Key Features

1. **Dual-Engine Detection (Rule + Gemini Hybrid)**
   - Combines 20+ specialized security heuristics, banking scam patterns, and risk scoring algorithms with Google Gemini multimodal analysis.
   - Detects lottery fraud, fake KYC suspension alerts, electricity disconnection scams, and impersonation.

2. **Multilingual Speech & Accessibility**
   - **Speech-to-Text**: Dictate suspicious messages directly using voice recognition.
   - **Text-to-Speech**: Audible security verdicts and safety advice in Hindi, Marathi, and English.
   - Full site UI language switching.

3. **Multimodal Screenshot Scanner**
   - Upload screenshots of SMS, WhatsApp chats, or payment receipts.
   - Automated text extraction and risk analysis.

4. **Malicious Link & Look-Alike Domain Inspector**
   - Detects brand spoofing (e.g., `sbi-kyc-update.xyz`, `paytrn.com`), punycode, IP-based URLs, high-risk TLDs (`.xyz`, `.top`, `.click`), and `.apk` payload drops.

5. **Live Relational Database & Dashboard**
   - Powered by PostgreSQL & Supabase with automatic dual-engine failover.
   - Live counters for total scans, high-risk cases, pending reviews, and moderator assessments.

6. **Human-in-the-Loop Review & Case History**
   - Moderator assessment queue to mark cases as *Confirmed Scam*, *Likely Legitimate*, or *Inconclusive*.
   - Filterable scan history with one-click **CSV Export** and printable incident reports.

---

## 🏗️ Architecture

```
                               ┌─────────────────────────────────┐
                               │   Vite + React (Frontend UI)    │
                               │   Languages: EN / HI / MR       │
                               └──────────────┬──────────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
        ┌─────────────────────────┐                       ┌─────────────────────────┐
        │  Flask Backend API      │                       │  Supabase PostgREST     │
        │  (Gemini + Rules)       │                       │  (Direct Live Failover) │
        └────────────┬────────────┘                       └────────────┬────────────┘
                     │                                                 │
                     └────────────────────────┬────────────────────────┘
                                              ▼
                               ┌─────────────────────────────┐
                               │  Supabase PostgreSQL Pool   │
                               │  - scan_history             │
                               │  - case                     │
                               │  - scan_result              │
                               │  - human_review             │
                               │  - link_checks              │
                               └─────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/parthgade17/ScamShield-AI.git
cd ScamShield-AI

# Create Python virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# or source venv/bin/activate  # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Run the Flask backend server
python scamshield-ai/backend/app.py
```
Backend runs on `http://127.0.0.1:5000`.

### 2. Frontend Setup
```bash
# Navigate to the frontend directory
cd scamshield-ai

# Install NPM dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## ⚙️ Environment Variables

Create a `.env` file in the root or set in your deployment dashboard:

```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Supabase PostgreSQL Database URI
DATABASE_URL=postgresql://postgres.<project_ref>:<password>@<host>:5432/postgres

# Supabase REST Credentials
VITE_SUPABASE_URL=https://<project_ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_publishable_key
```

---

## 🛠️ DevTools & Live Diagnostics

Inspect live connections in the browser console (<kbd>F12</kbd>):
```javascript
// Test Supabase REST connectivity & latency
await window.__scamshield_debug.testSupabase();

// Test Backend API health
await window.__scamshield_debug.testBackend();

// Print case history table
await window.__scamshield_debug.getHistory();

// Print live statistics
await window.__scamshield_debug.getStats();
```

---

## 📄 License
MIT License. Built for digital safety and fraud prevention.
