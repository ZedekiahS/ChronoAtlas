PRAGMA foreign_keys = ON;

CREATE TABLE corpora (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  description TEXT
);

CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  type TEXT NOT NULL,
  citation_short TEXT,
  url TEXT,
  language TEXT NOT NULL DEFAULT 'zh-Hans',
  corpus_id TEXT NOT NULL,
  note TEXT,
  raw_json TEXT NOT NULL,
  FOREIGN KEY (corpus_id) REFERENCES corpora(id)
);

CREATE TABLE source_i18n (
  source_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  citation_short TEXT,
  note TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (source_id, locale),
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE TABLE source_passages (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  parent_passage_id TEXT,
  locator TEXT NOT NULL,
  sequence INTEGER,
  year_start INTEGER,
  year_end INTEGER,
  text TEXT NOT NULL,
  translation TEXT,
  language TEXT NOT NULL DEFAULT 'zh-Hans',
  notes TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  review_status TEXT NOT NULL DEFAULT 'draft',
  raw_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (source_id) REFERENCES sources(id),
  FOREIGN KEY (parent_passage_id) REFERENCES source_passages(id)
);

CREATE TABLE source_passage_i18n (
  passage_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  translation TEXT,
  notes TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (passage_id, locale),
  FOREIGN KEY (passage_id) REFERENCES source_passages(id) ON DELETE CASCADE
);

CREATE TABLE persons (
  id TEXT PRIMARY KEY,
  region TEXT NOT NULL DEFAULT 'china',
  name TEXT NOT NULL,
  courtesy_name TEXT,
  life TEXT,
  birth_year INTEGER,
  death_year INTEGER,
  life_confidence TEXT NOT NULL DEFAULT 'medium',
  primary_polity TEXT,
  summary TEXT,
  coverage_status TEXT NOT NULL DEFAULT 'partial',
  raw_json TEXT NOT NULL
);

CREATE TABLE person_i18n (
  person_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  courtesy_name TEXT,
  life TEXT,
  primary_polity TEXT,
  summary TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (person_id, locale),
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE TABLE person_roles (
  person_id TEXT NOT NULL,
  role TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (person_id, role),
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE TABLE person_aliases (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL,
  value TEXT NOT NULL,
  type TEXT NOT NULL,
  source_refs_json TEXT NOT NULL DEFAULT '[]',
  raw_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE TABLE historical_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL,
  start_year INTEGER,
  end_year INTEGER,
  location_name TEXT,
  category TEXT,
  summary TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  coordinates_json TEXT,
  detail_json TEXT,
  raw_json TEXT NOT NULL
);

CREATE TABLE historical_event_i18n (
  event_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  location_name TEXT,
  summary TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (event_id, locale),
  FOREIGN KEY (event_id) REFERENCES historical_events(id) ON DELETE CASCADE
);

CREATE TABLE historical_event_people (
  event_id TEXT NOT NULL,
  person_id TEXT,
  display_name TEXT,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (event_id, sort_order),
  FOREIGN KEY (event_id) REFERENCES historical_events(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE SET NULL
);

CREATE TABLE historical_event_sources (
  event_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  locator TEXT NOT NULL,
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (event_id, source_id, locator),
  FOREIGN KEY (event_id) REFERENCES historical_events(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE source_mentions (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  passage_id TEXT,
  work_title TEXT NOT NULL,
  book_title TEXT NOT NULL,
  chapter_title TEXT NOT NULL,
  locator TEXT NOT NULL,
  year INTEGER,
  text TEXT NOT NULL,
  translation TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  review_status TEXT NOT NULL DEFAULT 'draft',
  raw_json TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES sources(id),
  FOREIGN KEY (passage_id) REFERENCES source_passages(id)
);

CREATE TABLE source_mention_i18n (
  mention_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  work_title TEXT,
  book_title TEXT,
  chapter_title TEXT,
  translation TEXT,
  dispute_note TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (mention_id, locale),
  FOREIGN KEY (mention_id) REFERENCES source_mentions(id) ON DELETE CASCADE
);

CREATE TABLE source_mention_people (
  mention_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (mention_id, person_id),
  FOREIGN KEY (mention_id) REFERENCES source_mentions(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES persons(id)
);

CREATE TABLE source_mention_events (
  mention_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (mention_id, event_id),
  FOREIGN KEY (mention_id) REFERENCES source_mentions(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES historical_events(id)
);

CREATE TABLE source_mention_places (
  mention_id TEXT NOT NULL,
  place_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (mention_id, place_id),
  FOREIGN KEY (mention_id) REFERENCES source_mentions(id) ON DELETE CASCADE
);

CREATE TABLE source_mention_tags (
  mention_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (mention_id, tag),
  FOREIGN KEY (mention_id) REFERENCES source_mentions(id) ON DELETE CASCADE
);

CREATE TABLE person_life_events (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL,
  year INTEGER,
  end_year INTEGER,
  display_year TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  approximate INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL,
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE TABLE person_life_event_i18n (
  life_event_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  display_year TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (life_event_id, locale),
  FOREIGN KEY (life_event_id) REFERENCES person_life_events(id) ON DELETE CASCADE
);

CREATE TABLE person_life_event_historical_events (
  life_event_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (life_event_id, event_id),
  FOREIGN KEY (life_event_id) REFERENCES person_life_events(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES historical_events(id)
);

CREATE TABLE person_life_event_source_mentions (
  life_event_id TEXT NOT NULL,
  mention_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (life_event_id, mention_id),
  FOREIGN KEY (life_event_id) REFERENCES person_life_events(id) ON DELETE CASCADE,
  FOREIGN KEY (mention_id) REFERENCES source_mentions(id)
);

CREATE TABLE person_life_event_source_refs (
  life_event_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  locator TEXT NOT NULL,
  quote TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (life_event_id, source_id, locator),
  FOREIGN KEY (life_event_id) REFERENCES person_life_events(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE person_relations (
  id TEXT PRIMARY KEY,
  source_person_id TEXT NOT NULL,
  target_person_id TEXT NOT NULL,
  type TEXT NOT NULL,
  start_year INTEGER,
  end_year INTEGER,
  summary TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  raw_json TEXT NOT NULL,
  FOREIGN KEY (source_person_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (target_person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE TABLE person_relation_i18n (
  relation_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  summary TEXT NOT NULL,
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (relation_id, locale),
  FOREIGN KEY (relation_id) REFERENCES person_relations(id) ON DELETE CASCADE
);

CREATE TABLE person_relation_events (
  relation_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (relation_id, event_id),
  FOREIGN KEY (relation_id) REFERENCES person_relations(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES historical_events(id)
);

CREATE TABLE person_relation_source_mentions (
  relation_id TEXT NOT NULL,
  mention_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (relation_id, mention_id),
  FOREIGN KEY (relation_id) REFERENCES person_relations(id) ON DELETE CASCADE,
  FOREIGN KEY (mention_id) REFERENCES source_mentions(id)
);

CREATE TABLE person_relation_source_refs (
  relation_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  locator TEXT NOT NULL,
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (relation_id, source_id, locator),
  FOREIGN KEY (relation_id) REFERENCES person_relations(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE coverage_status (
  person_id TEXT NOT NULL,
  corpus_id TEXT NOT NULL,
  status TEXT NOT NULL,
  last_reviewed_at TEXT,
  notes TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (person_id, corpus_id),
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (corpus_id) REFERENCES corpora(id)
);

CREATE TABLE coverage_status_sources (
  person_id TEXT NOT NULL,
  corpus_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL,
  PRIMARY KEY (person_id, corpus_id, source_id),
  FOREIGN KEY (person_id, corpus_id) REFERENCES coverage_status(person_id, corpus_id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE coverage_status_missing (
  person_id TEXT NOT NULL,
  corpus_id TEXT NOT NULL,
  source_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (person_id, corpus_id, source_label),
  FOREIGN KEY (person_id, corpus_id) REFERENCES coverage_status(person_id, corpus_id) ON DELETE CASCADE
);

CREATE TABLE import_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  source_label TEXT NOT NULL,
  persons_count INTEGER NOT NULL,
  life_events_count INTEGER NOT NULL,
  relations_count INTEGER NOT NULL,
  historical_events_count INTEGER NOT NULL,
  source_mentions_count INTEGER NOT NULL
);

CREATE INDEX idx_sources_corpus ON sources(corpus_id);
CREATE INDEX idx_source_i18n_locale ON source_i18n(locale);
CREATE INDEX idx_persons_name ON persons(name);
CREATE INDEX idx_person_i18n_name ON person_i18n(locale, name);
CREATE INDEX idx_person_life_events_person_year ON person_life_events(person_id, year);
CREATE INDEX idx_person_life_event_i18n_locale ON person_life_event_i18n(locale);
CREATE INDEX idx_source_mentions_source_year ON source_mentions(source_id, year);
CREATE INDEX idx_source_mention_i18n_locale ON source_mention_i18n(locale);
CREATE INDEX idx_source_mention_people_person ON source_mention_people(person_id);
CREATE INDEX idx_historical_events_region_year ON historical_events(region, start_year);
CREATE INDEX idx_historical_event_i18n_locale ON historical_event_i18n(locale);
CREATE INDEX idx_person_relations_source_person ON person_relations(source_person_id);
CREATE INDEX idx_person_relations_target_person ON person_relations(target_person_id);
CREATE INDEX idx_person_relation_i18n_locale ON person_relation_i18n(locale);
