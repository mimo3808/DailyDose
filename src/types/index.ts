export type Topic = {
  id: number;
  slug: string;
  name_zh: string;
  name_en: string | null;
  parent_id: number | null;
};

export type Source = {
  id: number;
  url: string;
  title: string | null;
  topic_id: number | null;
  language: string;
  quality_score: number;
  last_fetched_at: string | null;
  status: 'pending' | 'active' | 'degraded' | 'inactive';
  consecutive_failures: number;
  created_at: string;
};

export type Article = {
  id: number;
  source_id: number;
  topic_id: number | null;
  title: string;
  url: string;
  content: string | null;
  published_at: string | null;
  fetched_at: string;
  content_hash: string;
  language: string;
};

export type UserPrefs = {
  device_id: string;
  topic_ids: number[];
  length_minutes: number;
  voice_pref: string | null;
  language: string;
};

export type ScriptChapter = {
  idx: number;
  title: string;
  script_text: string;
  source_refs: { title: string; url: string }[];
};

export type ScriptJson = {
  title: string;
  chapters: ScriptChapter[];
};
