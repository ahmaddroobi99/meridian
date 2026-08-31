-- Meridian AI Research Intelligence schema
create table if not exists sources (
  id text primary key,
  name text not null,
  slug text not null unique,
  kind text not null,
  reliability text not null,
  url text not null,
  feed_url text,
  last_fetch_at timestamptz,
  last_error text,
  fetch_count integer not null default 0,
  item_count integer not null default 0,
  active boolean not null default true
);

create table if not exists organizations (
  id text primary key,
  name text not null,
  slug text not null unique,
  kind text not null,
  url text,
  description text not null default ''
);

create table if not exists items (
  id text primary key,
  cluster_id text not null,
  kind text not null,
  title text not null,
  url text not null unique,
  source_id text not null references sources(id),
  org_id text,
  published_at timestamptz,
  authors jsonb not null default '[]',
  institutions jsonb not null default '[]',
  categories jsonb not null default '[]',
  summary text not null default '',
  technical_summary text not null default '',
  why_it_matters text not null default '',
  key_concepts jsonb not null default '[]',
  models jsonb not null default '[]',
  datasets jsonb not null default '[]',
  hardware jsonb not null default '[]',
  frameworks jsonb not null default '[]',
  github jsonb not null default '[]',
  related_papers jsonb not null default '[]',
  abstract text,
  importance_score real not null default 0,
  technical_depth real not null default 0,
  novelty_score real not null default 0,
  practical_value real not null default 0,
  research_quality real not null default 0,
  recency_score real not null default 0,
  trend_momentum real not null default 0,
  source_credibility real not null default 0,
  difficulty text not null default 'intermediate',
  evidence_status text not null default 'reported',
  is_primary boolean not null default true,
  is_breaking boolean not null default false,
  is_buildable boolean not null default false,
  build_notes text,
  arxiv_id text,
  github_stars integer,
  github_language text,
  github_forks integer,
  citation_count integer,
  raw_snippet text,
  engineer_brief text,
  deep_analysis text,
  ingested_at timestamptz not null default now(),
  enriched_at timestamptz
);

create index if not exists items_published_idx on items (published_at desc nulls last);
create index if not exists items_importance_idx on items (importance_score desc);
create index if not exists items_cluster_idx on items (cluster_id);
create index if not exists items_kind_idx on items (kind);
create index if not exists items_source_idx on items (source_id);
create index if not exists items_breaking_idx on items (is_breaking, published_at desc);
create index if not exists items_buildable_idx on items (is_buildable, importance_score desc);

create table if not exists item_relations (
  from_id text not null,
  to_id text not null,
  relation text not null,
  primary key (from_id, to_id, relation)
);

create table if not exists trends (
  id text primary key,
  topic text not null,
  slug text not null unique,
  growth real not null default 0,
  article_count integer not null default 0,
  paper_count integer not null default 0,
  orgs jsonb not null default '[]',
  first_seen timestamptz,
  last_seen timestamptz,
  direction text not null default 'stable',
  score real not null default 0,
  summary text not null default ''
);

create table if not exists models (
  id text primary key,
  name text not null,
  organization text,
  slug text not null unique,
  released_at date,
  modalities jsonb not null default '[]',
  parameters text,
  context_length text,
  license text,
  openness text not null default 'unknown',
  hardware text,
  github_url text,
  hf_url text,
  paper_url text,
  notes text not null default ''
);

create table if not exists researchers (
  id text primary key,
  name text not null,
  slug text not null unique,
  organization text,
  areas jsonb not null default '[]',
  paper_count integer not null default 0
);

create table if not exists ingest_runs (
  id serial primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  sources_ok integer not null default 0,
  sources_failed integer not null default 0,
  items_inserted integer not null default 0,
  duplicates_removed integer not null default 0,
  error text
);

create table if not exists meta (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
