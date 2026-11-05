-- ======================================================================
-- 🛡️ SCAMSHIELD AI - PRODUCTION DATABASE SCHEMA
-- PostgreSQL & Supabase Database Definition
-- ======================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================================================================
-- 2. CORE USERS TABLE
-- ======================================================================
CREATE TABLE IF NOT EXISTS public."user" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_email ON public."user" (email);

-- Insert default user if not exists
INSERT INTO public."user" (id, name, email, password_hash, role, created_at)
VALUES (1, 'ScamShield User', 'user@scamshield.ai', 'pbkdf2:sha256:default', 'user', NOW())
ON CONFLICT (id) DO NOTHING;

-- ======================================================================
-- 3. LINK CHECKS TABLE (URL & Domain Inspection Schema)
-- ======================================================================
CREATE TABLE IF NOT EXISTS public.link_checks (
    id BIGSERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    domain VARCHAR(255),
    risk_score INTEGER NOT NULL DEFAULT 0,
    risk_level VARCHAR(30) NOT NULL DEFAULT 'Low',
    classification VARCHAR(50) NOT NULL DEFAULT 'legitimate',
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    signals JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_checks_created_at ON public.link_checks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_checks_risk_level ON public.link_checks (risk_level);
CREATE INDEX IF NOT EXISTS idx_link_checks_domain ON public.link_checks (domain);

-- ======================================================================
-- 4. SCAN HISTORY TABLE (Unified Text & Image Scans)
-- ======================================================================
CREATE TABLE IF NOT EXISTS public.scan_history (
    id BIGSERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0,
    risk_level VARCHAR(30) NOT NULL DEFAULT 'Low',
    explanation TEXT NOT NULL DEFAULT '',
    indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    detection_method VARCHAR(50) NOT NULL DEFAULT 'rule+Gemini based',
    ai_model VARCHAR(100) DEFAULT 'gemini-3.5-flash-lite',
    review_status VARCHAR(30) DEFAULT 'pending',
    review_decision VARCHAR(50),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON public.scan_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_risk_level ON public.scan_history (risk_level);
CREATE INDEX IF NOT EXISTS idx_scan_history_review_status ON public.scan_history (review_status);

-- ======================================================================
-- 5. RELATIONAL CASE MANAGEMENT TABLES
-- ======================================================================
CREATE TABLE IF NOT EXISTS public."case" (
    id BIGSERIAL PRIMARY KEY,
    public_id VARCHAR(36) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES public."user"(id) ON DELETE SET NULL,
    case_type VARCHAR(40) NOT NULL DEFAULT 'message_scan',
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    submitted_text TEXT,
    submitted_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_created_at ON public."case" (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_public_id ON public."case" (public_id);
CREATE INDEX IF NOT EXISTS idx_case_type ON public."case" (case_type);

CREATE TABLE IF NOT EXISTS public.scan_result (
    id BIGSERIAL PRIMARY KEY,
    case_id BIGINT REFERENCES public."case"(id) ON DELETE CASCADE,
    classification VARCHAR(40) NOT NULL DEFAULT 'legitimate',
    risk_level VARCHAR(20) NOT NULL DEFAULT 'Low',
    risk_score INTEGER NOT NULL DEFAULT 0,
    signals_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_actions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    uncertainty VARCHAR(500),
    model_version VARCHAR(80) NOT NULL DEFAULT 'rule+gemini-v2',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_result_case_id ON public.scan_result (case_id);
CREATE INDEX IF NOT EXISTS idx_scan_result_risk_score ON public.scan_result (risk_score);

-- ======================================================================
-- 6. HUMAN REVIEW QUEUE
-- ======================================================================
CREATE TABLE IF NOT EXISTS public.human_review (
    id BIGSERIAL PRIMARY KEY,
    case_id BIGINT,
    reviewer_id INTEGER REFERENCES public."user"(id) ON DELETE SET NULL,
    decision VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_human_review_case_id ON public.human_review (case_id);

-- ======================================================================
-- 7. NOTIFICATIONS & ALERTS
-- ======================================================================
CREATE TABLE IF NOT EXISTS public.notification (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public."user"(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_user_unread ON public.notification (user_id, is_read);

-- ======================================================================
-- 8. USER PREFERENCES & SETTINGS
-- ======================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES public."user"(id) ON DELETE CASCADE,
    sensitivity VARCHAR(20) NOT NULL DEFAULT 'balanced',
    auto_quarantine BOOLEAN NOT NULL DEFAULT TRUE,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ======================================================================
-- 9. PERMISSIONS & ROW LEVEL SECURITY (RLS) FOR SUPABASE POSTGREST
-- ======================================================================

-- Enable RLS on all tables
ALTER TABLE public.link_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."case" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create Permissive Policies for anon, authenticated, and service_role
DO $$
BEGIN
    -- link_checks policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'link_checks' AND policyname = 'allow_all_link_checks') THEN
        CREATE POLICY "allow_all_link_checks" ON public.link_checks FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- scan_history policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_history' AND policyname = 'allow_all_scan_history') THEN
        CREATE POLICY "allow_all_scan_history" ON public.scan_history FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- case policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case' AND policyname = 'allow_all_case') THEN
        CREATE POLICY "allow_all_case" ON public."case" FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- scan_result policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scan_result' AND policyname = 'allow_all_scan_result') THEN
        CREATE POLICY "allow_all_scan_result" ON public.scan_result FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- human_review policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'human_review' AND policyname = 'allow_all_human_review') THEN
        CREATE POLICY "allow_all_human_review" ON public.human_review FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- notification policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification' AND policyname = 'allow_all_notification') THEN
        CREATE POLICY "allow_all_notification" ON public.notification FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- user policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user' AND policyname = 'allow_all_user') THEN
        CREATE POLICY "allow_all_user" ON public."user" FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- user_settings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'allow_all_user_settings') THEN
        CREATE POLICY "allow_all_user_settings" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Grant API Role Privileges
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;

-- Alter default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
