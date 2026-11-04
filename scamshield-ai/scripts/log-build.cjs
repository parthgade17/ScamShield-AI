// Deployment build logger for ScamShield AI
const fs = require('fs');
const path = require('path');

const sep = '='.repeat(70);
console.log(sep);
console.log('🛡️   SCAMSHIELD AI - VERCEL DEPLOYMENT BUILD LOGS');
console.log(sep);
console.log(`[DEPLOYMENT] Node.js Version    : ${process.version}`);
console.log(`[DEPLOYMENT] Platform / Arch    : ${process.platform} (${process.arch})`);
console.log(`[DEPLOYMENT] Working Directory  : ${process.cwd()}`);
console.log(`[DEPLOYMENT] Build Timestamp    : ${new Date().toISOString()}`);

// Check API directory in parent or local
const localApi = path.resolve(process.cwd(), 'api');
const parentApi = path.resolve(process.cwd(), '..', 'api');
const targetApi = fs.existsSync(localApi) ? localApi : parentApi;

const hasIndexPy = fs.existsSync(path.join(targetApi, 'index.py'));
const hasAppPy = fs.existsSync(path.join(targetApi, 'app.py'));
const hasModelPy = fs.existsSync(path.join(targetApi, 'scam_model.py'));
const hasReqs = fs.existsSync(path.join(targetApi, 'requirements.txt'));

console.log(`[DEPLOYMENT] Serverless Package : Present (${path.basename(targetApi)}/)`);
console.log(`[DEPLOYMENT]   - index.py       : ${hasIndexPy ? 'OK' : 'Missing'}`);
console.log(`[DEPLOYMENT]   - app.py         : ${hasAppPy ? 'OK' : 'Missing'}`);
console.log(`[DEPLOYMENT]   - scam_model.py  : ${hasModelPy ? 'OK' : 'Missing'}`);
console.log(`[DEPLOYMENT]   - requirements   : ${hasReqs ? 'OK' : 'Missing'}`);

const hasDb = Boolean(process.env.DATABASE_URL);
const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
const hasSupaUrl = Boolean(process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
const hasSupaKey = Boolean(process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

console.log('[DEPLOYMENT] Environment Status :');
console.log(`[DEPLOYMENT]   - DATABASE_URL   : ${hasDb ? 'Configured in deployment' : 'Supabase default fallback active'}`);
console.log(`[DEPLOYMENT]   - GEMINI_API_KEY : ${hasGemini ? 'Configured in deployment' : 'Default / Fallback rules active'}`);
console.log(`[DEPLOYMENT]   - SUPABASE_URL   : ${hasSupaUrl ? 'Configured in deployment' : 'Default cloud endpoint active'}`);
console.log(`[DEPLOYMENT]   - SUPABASE_KEY   : ${hasSupaKey ? 'Configured in deployment' : 'Default publishable key active'}`);
console.log(sep);
console.log('[DEPLOYMENT] Executing Vite frontend compilation...');
console.log(sep);
