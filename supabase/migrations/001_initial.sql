-- ============================================================================
-- Founder Hub — Initial Schema
-- Run: supabase db push  (or apply via Supabase dashboard SQL editor)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. admin_kv — Generic key/value store used by the admin dashboard
--    (already referenced in admin-storage.ts SupabaseBackend)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_kv (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable upsert via PostgREST Prefer: resolution=merge-duplicates
ALTER TABLE admin_kv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kv_anon_read"  ON admin_kv FOR SELECT USING (true);
CREATE POLICY "admin_kv_anon_write" ON admin_kv FOR ALL    USING (true);

-- ---------------------------------------------------------------------------
-- 2. projects — Mirrors PROJECT_REGISTRY with server-side persistence
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  tagline         TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'software-platform',
  status          TEXT NOT NULL DEFAULT 'in-development',
  url             TEXT,
  repo            TEXT,
  tech_stack      TEXT[] NOT NULL DEFAULT '{}',
  accent_color    TEXT NOT NULL DEFAULT '#3b82f6',
  created_date    DATE,
  last_updated    DATE,
  repo_stars      INTEGER,
  repo_language   TEXT,
  documentation_url TEXT,
  domain          TEXT,
  owner           TEXT,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_anon_read"  ON projects FOR SELECT USING (true);
CREATE POLICY "projects_anon_write" ON projects FOR ALL    USING (true);

-- ---------------------------------------------------------------------------
-- 3. blog_posts — Persists blog content for cross-device admin editing
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS blog_posts (
  id                TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  date              DATE NOT NULL,
  category          TEXT NOT NULL DEFAULT 'update',
  summary           TEXT NOT NULL DEFAULT '',
  content_markdown  TEXT NOT NULL DEFAULT '',
  published         BOOLEAN NOT NULL DEFAULT true,
  synced_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_anon_read"  ON blog_posts FOR SELECT USING (true);
CREATE POLICY "blog_posts_anon_write" ON blog_posts FOR ALL    USING (true);

-- ---------------------------------------------------------------------------
-- 4. activity_events — Tracks platform activity (commits, deploys, etc.)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS activity_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  repo        TEXT,
  title       TEXT NOT NULL,
  description TEXT,
  url         TEXT,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata    JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_activity_events_ts ON activity_events (timestamp DESC);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_events_anon_read"  ON activity_events FOR SELECT USING (true);
CREATE POLICY "activity_events_anon_write" ON activity_events FOR ALL    USING (true);

-- ---------------------------------------------------------------------------
-- 5. form_submissions — Stores contact/inquiry form submissions
--    (currently backed by Cloudflare KV; this provides a durable copy)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS form_submissions (
  id         TEXT PRIMARY KEY,
  source     TEXT NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT,
  metadata   JSONB DEFAULT '{}'::jsonb,
  ip_hash    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_submissions_source ON form_submissions (source, created_at DESC);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_submissions_anon_read"  ON form_submissions FOR SELECT USING (true);
CREATE POLICY "form_submissions_anon_write" ON form_submissions FOR ALL    USING (true);
