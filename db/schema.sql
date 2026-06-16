CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT,
  parent_id INT REFERENCES topics(id)
);

CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  topic_id INT REFERENCES topics(id),
  language TEXT DEFAULT 'zh',
  quality_score REAL DEFAULT 0,
  last_fetched_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | degraded | inactive
  consecutive_failures INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sources_status ON sources(status);
CREATE INDEX IF NOT EXISTS idx_sources_topic ON sources(topic_id);

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  source_id INT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  topic_id INT REFERENCES topics(id),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash TEXT UNIQUE NOT NULL,
  language TEXT DEFAULT 'zh'
);
CREATE INDEX IF NOT EXISTS idx_articles_source_pub ON articles(source_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_topic_pub ON articles(topic_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_pub ON articles(published_at DESC);

CREATE TABLE IF NOT EXISTS user_prefs (
  device_id TEXT PRIMARY KEY,
  topic_ids JSONB NOT NULL DEFAULT '[]',
  length_minutes INT NOT NULL DEFAULT 8,
  voice_pref TEXT,
  language TEXT DEFAULT 'zh',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS briefings (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  brief_date DATE NOT NULL,
  target_minutes INT NOT NULL,
  script_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready', -- ready | failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_briefings_device_date ON briefings(device_id, brief_date);

CREATE TABLE IF NOT EXISTS daily_cache (
  device_id TEXT NOT NULL,
  brief_date DATE NOT NULL,
  briefing_id INT NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  PRIMARY KEY (device_id, brief_date)
);
