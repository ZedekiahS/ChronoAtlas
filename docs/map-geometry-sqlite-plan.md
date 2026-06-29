# Map Geometry SQLite Plan

## Purpose

This document defines the formal SQLite geometry model for migrating
`data/china-admin-blocks-190-280.json`, `data/china-block-control-timeline-190-280.json`,
and `data/china-commandery-supplemental-blocks.json` into the runtime database.

The goal is not only to remove a large JSON file from the frontend. The geometry
model must support later periods, other regions, event/place linking, evidence
coverage, and AI/RAG retrieval.

## Current State

The project already has a China-specific runtime schema:

- `china_admin_block_datasets`
- `china_admin_blocks`
- `china_control_timeline_datasets`
- `china_control_controllers`
- `china_control_records`

That schema works for the current 190-280 commandery map, but it is intentionally
specific to China and to one map family. The next model should be generic enough
for later Chinese periods and non-Chinese regions without creating one table
family per civilization.

Current source files:

- `data/china-admin-blocks-190-280.json`
  - 471,380 lines.
  - Model: `china-admin-block-map`.
  - Coordinate system: `wgs84-lonlat`.
  - Contains commandery-like polygon blocks with `id`, `name`, `level`, `parent`,
    `center`, `geometry`, `confidence`, optional `sources`, and raw notes.
- `data/china-block-control-timeline-190-280.json`
  - Model: `china-block-control-timeline`.
  - Contains `keyYears`, controller color definitions, and block control records.
- `data/china-commandery-supplemental-blocks.json`
  - Contains duplicate/supplemental geometries for known split-piece gaps such as
    Jiangxia and Lujiang.
  - Some supplemental blocks have `controlBlockId`, meaning they render as a
    separate geometry but inherit control from another logical block.

## Design Principles

1. Geometry and control are separate.
   A polygon should not be duplicated just because its ruler changed.

2. Physical shape and political meaning are separate.
   A geometry feature can be a visual fragment, while a logical place/entity can
   represent the historical commandery.

3. The schema must preserve provenance.
   Every dataset, feature, geometry, control record, and alias can keep raw JSON
   and source/evidence links.

4. The schema must support uncertain historical geography.
   Confidence, review status, approximate flags, and notes are first-class fields.

5. The frontend should request only what it needs.
   A page should not load every polygon for every period.

6. SQLite is the runtime store, not a full GIS engine.
   Store GeoJSON-compatible coordinates and useful bounding boxes. Do not assume
   PostGIS-style spatial functions. If SQLite R*Tree is available, use it as an
   optional optimization, not as the only correctness path.

## Proposed Tables

### `map_geometry_datasets`

One row per imported geometry dataset.

```sql
CREATE TABLE map_geometry_datasets (
  id TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  model TEXT NOT NULL,
  region_id TEXT,
  period_id TEXT,
  civilization_id TEXT,
  label TEXT NOT NULL,
  time_start INTEGER,
  time_end INTEGER,
  coordinate_system TEXT NOT NULL DEFAULT 'wgs84-lonlat',
  source_note TEXT,
  source_url TEXT,
  license TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id),
  FOREIGN KEY (period_id) REFERENCES periods(id),
  FOREIGN KEY (civilization_id) REFERENCES civilizations(id)
);
```

For the current China map:

- `id`: `china-admin-block-map-190-280`
- `model`: `admin-block-map`
- `region_id`: `china`
- `period_id`: `china-three-kingdoms-180-280`
- `coordinate_system`: `wgs84-lonlat`

### `map_features`

One row per logical map feature. This should usually represent a historical
administrative or political unit, not necessarily a single polygon.

```sql
CREATE TABLE map_features (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  entity_id TEXT,
  stable_place_id TEXT,
  name TEXT NOT NULL,
  name_zh TEXT,
  name_en TEXT,
  feature_type TEXT NOT NULL,
  admin_level TEXT,
  parent_feature_id TEXT,
  control_feature_id TEXT,
  center_lon REAL,
  center_lat REAL,
  label_lon REAL,
  label_lat REAL,
  min_lon REAL,
  min_lat REAL,
  max_lon REAL,
  max_lat REAL,
  area_hint REAL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  approximate INTEGER NOT NULL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (dataset_id) REFERENCES map_geometry_datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id),
  FOREIGN KEY (parent_feature_id) REFERENCES map_features(id),
  FOREIGN KEY (control_feature_id) REFERENCES map_features(id)
);
```

Important field meanings:

- `feature_type`: `admin_block`, `province`, `commandery`, `county`, `frontier`,
  `region`, `polity_area`, `terrain`, `water`, `route`, `marker`, etc.
- `admin_level`: display hierarchy such as `province`, `commandery`, `county-seat`.
- `stable_place_id`: optional stable cross-period place key when one historical
  place appears in multiple datasets or names.
- `entity_id`: optional link to the future `entities` row for RAG/event linking.
- `control_feature_id`: used for supplemental duplicate pieces. Example:
  `jiangxia-commandery-fragment` can render as its own feature but inherit control
  from `jiangxia-commandery`.
- `center_lon/center_lat`: current source `center`.
- `label_lon/label_lat`: optional override for readable labels.
- `min/max lon/lat`: precomputed bounding box for API viewport filtering.
- `area_hint`: optional planar or spherical area approximation for label density
  and simplification decisions. It must be documented as an approximation.

### `map_feature_geometries`

Stores actual GeoJSON-compatible geometry. Separate from `map_features` so a
feature can have multiple fragments, alternate simplification levels, or revised
geometry without changing the logical feature row.

```sql
CREATE TABLE map_feature_geometries (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL,
  geometry_role TEXT NOT NULL DEFAULT 'display',
  geometry_type TEXT NOT NULL,
  simplification_level TEXT NOT NULL DEFAULT 'full',
  coordinate_system TEXT NOT NULL DEFAULT 'wgs84-lonlat',
  coordinates_json TEXT NOT NULL,
  min_lon REAL,
  min_lat REAL,
  max_lon REAL,
  max_lat REAL,
  point_count INTEGER,
  ring_count INTEGER,
  source_feature_id TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  approximate INTEGER NOT NULL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'draft',
  raw_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (feature_id) REFERENCES map_features(id) ON DELETE CASCADE
);
```

Allowed `geometry_type` should initially match GeoJSON:

- `Point`
- `LineString`
- `Polygon`
- `MultiPolygon`
- `MultiLineString`

For `china-admin-blocks-190-280.json`, most records become one
`map_features` row and one `map_feature_geometries` row with:

- `geometry_role`: `display`
- `geometry_type`: `Polygon`
- `simplification_level`: `full`
- `coordinates_json`: current `geometry.coordinates`

### `map_feature_aliases`

Names change over time and across source traditions. Do not overload `name`.

```sql
CREATE TABLE map_feature_aliases (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL,
  value TEXT NOT NULL,
  alias_type TEXT NOT NULL,
  language TEXT,
  valid_start INTEGER,
  valid_end INTEGER,
  source_id TEXT,
  locator TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  raw_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (feature_id) REFERENCES map_features(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);
```

Examples of `alias_type`:

- `primary`
- `historical`
- `modern`
- `variant`
- `transliteration`
- `source_label`

### `map_control_datasets`

One row per control timeline.

```sql
CREATE TABLE map_control_datasets (
  id TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  model TEXT NOT NULL,
  geometry_dataset_id TEXT NOT NULL,
  region_id TEXT,
  period_id TEXT,
  label TEXT NOT NULL,
  time_start INTEGER NOT NULL,
  time_end INTEGER NOT NULL,
  key_years_json TEXT NOT NULL DEFAULT '[]',
  review_status TEXT NOT NULL DEFAULT 'draft',
  raw_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (geometry_dataset_id) REFERENCES map_geometry_datasets(id),
  FOREIGN KEY (region_id) REFERENCES regions(id),
  FOREIGN KEY (period_id) REFERENCES periods(id)
);
```

For the current control timeline:

- `id`: `china-block-control-timeline-190-280`
- `geometry_dataset_id`: `china-admin-block-map-190-280`
- `model`: `control-timeline`

### `map_controllers`

Political controllers, dynasties, polities, rebels, frontier groups, or special
categories used by control records.

```sql
CREATE TABLE map_controllers (
  id TEXT PRIMARY KEY,
  control_dataset_id TEXT NOT NULL,
  entity_id TEXT,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  controller_type TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (control_dataset_id) REFERENCES map_control_datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);
```

`entity_id` is optional at first. It should be filled later for controllers that
are also formal entities such as Cao Wei, Shu Han, Sun Wu, Western Jin, Rome, or
Sasanian Persia.

### `map_control_records`

Temporal control state for a feature.

```sql
CREATE TABLE map_control_records (
  id TEXT PRIMARY KEY,
  control_dataset_id TEXT NOT NULL,
  feature_id TEXT NOT NULL,
  controller_id TEXT NOT NULL,
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  status TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  approximate INTEGER NOT NULL DEFAULT 0,
  source_note TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (control_dataset_id) REFERENCES map_control_datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (feature_id) REFERENCES map_features(id),
  FOREIGN KEY (controller_id) REFERENCES map_controllers(id)
);
```

Recommended `status` vocabulary:

- `effective-control`
- `nominal-control`
- `contested`
- `frontier`
- `sphere`
- `unknown`
- `uninhabited-or-outside-scope`

Do not encode uncertainty only as a controller. Use `status` plus `confidence`.

### `map_control_record_sources`

Control records need evidence. The current JSON stores string source notes; the
formal model should allow both plain notes and structured citations.

```sql
CREATE TABLE map_control_record_sources (
  control_record_id TEXT NOT NULL,
  source_id TEXT,
  passage_id TEXT,
  mention_id TEXT,
  locator TEXT,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  confidence TEXT NOT NULL DEFAULT 'medium',
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (control_record_id, sort_order),
  FOREIGN KEY (control_record_id) REFERENCES map_control_records(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id),
  FOREIGN KEY (passage_id) REFERENCES source_passages(id),
  FOREIGN KEY (mention_id) REFERENCES source_mentions(id)
);
```

This mirrors the existing evidence direction without forcing every map record to
have a finished passage on day one.

### `map_feature_sources`

Geometry itself also needs provenance separate from political control.

```sql
CREATE TABLE map_feature_sources (
  feature_id TEXT NOT NULL,
  source_id TEXT,
  passage_id TEXT,
  mention_id TEXT,
  locator TEXT,
  note TEXT,
  source_role TEXT NOT NULL DEFAULT 'geometry',
  sort_order INTEGER NOT NULL DEFAULT 0,
  confidence TEXT NOT NULL DEFAULT 'medium',
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (feature_id, source_role, sort_order),
  FOREIGN KEY (feature_id) REFERENCES map_features(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id),
  FOREIGN KEY (passage_id) REFERENCES source_passages(id),
  FOREIGN KEY (mention_id) REFERENCES source_mentions(id)
);
```

`source_role` examples:

- `geometry`
- `name`
- `parent`
- `center`
- `modern-identification`
- `control-inference`

### `map_feature_events`

Optional link table between map features and formal events. This is useful when
an event location is larger or less precise than a single place entity.

```sql
CREATE TABLE map_feature_events (
  feature_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (feature_id, event_id, relation_type),
  FOREIGN KEY (feature_id) REFERENCES map_features(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

`relation_type` examples:

- `location`
- `affected-area`
- `frontier`
- `campaign-area`
- `origin`
- `destination`

### `map_feature_entities`

General link between features and entities. This prevents overloading
`map_features.entity_id` when multiple entities are relevant.

```sql
CREATE TABLE map_feature_entities (
  feature_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  time_start INTEGER,
  time_end INTEGER,
  confidence TEXT NOT NULL DEFAULT 'medium',
  raw_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (feature_id, entity_id, relation_type),
  FOREIGN KEY (feature_id) REFERENCES map_features(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);
```

`relation_type` examples:

- `represents`
- `capital-of`
- `controlled-by`
- `contains`
- `adjacent-frontier`
- `successor-place`
- `predecessor-place`

## Optional Spatial Index

Use normal indexes first:

```sql
CREATE INDEX idx_map_features_dataset_level
  ON map_features(dataset_id, admin_level);

CREATE INDEX idx_map_features_bbox
  ON map_features(dataset_id, min_lon, min_lat, max_lon, max_lat);

CREATE INDEX idx_map_geometries_feature_level
  ON map_feature_geometries(feature_id, simplification_level);

CREATE INDEX idx_map_control_records_feature_year
  ON map_control_records(feature_id, start_year, end_year);

CREATE INDEX idx_map_control_records_controller_year
  ON map_control_records(controller_id, start_year, end_year);
```

If the runtime SQLite build supports R*Tree, add an optional virtual table:

```sql
CREATE VIRTUAL TABLE map_feature_bbox_index USING rtree(
  rowid,
  min_lon,
  max_lon,
  min_lat,
  max_lat
);
```

Keep the R*Tree table derived from `map_features`. Do not make it the source of
truth.

## Import Mapping

### From `china-admin-blocks-190-280.json`

Dataset:

- JSON root -> `map_geometry_datasets`

Block:

- `block.id` -> `map_features.id`
- `block.name` -> `map_features.name`
- `block.level` -> `map_features.admin_level`
- `block.parent` -> `map_features.parent_feature_id`, after resolving to a known
  feature id when possible
- `block.center[0]` -> `center_lon`
- `block.center[1]` -> `center_lat`
- `block.geometry.type` -> `map_feature_geometries.geometry_type`
- `block.geometry.coordinates` -> `map_feature_geometries.coordinates_json`
- `block.confidence` -> both feature and geometry confidence unless overridden
- `block.sources` -> `map_feature_sources`
- original block -> `raw_json`

Derived fields:

- `min_lon`, `min_lat`, `max_lon`, `max_lat`
- `point_count`
- `ring_count`
- optional `area_hint`

### From `china-commandery-supplemental-blocks.json`

Supplemental block:

- Insert as its own `map_features` row.
- Preserve `block.id`.
- Preserve `block.name`.
- Set `control_feature_id` from `controlBlockId` when it resolves.
- Set `feature_type` to `admin_block_fragment` or keep `feature_type` as
  `admin_block` and store `geometry_role = 'supplemental-fragment'`.

Recommended choice:

- `map_features.feature_type = 'admin_block_fragment'`
- `map_feature_geometries.geometry_role = 'display-fragment'`

This explicitly documents that the feature exists to render a split geometry,
not because it is a separate historical commandery.

### From `china-block-control-timeline-190-280.json`

Root:

- JSON root -> `map_control_datasets`

Controllers:

- `controller.id` -> `map_controllers.id`
- `controller.color` -> `map_controllers.color`
- `controller.id` also becomes `label`
- later, link to `entities.id` where possible

Records:

- `blockId` -> resolve to `map_features.id`; if a fragment has
  `control_feature_id`, control should usually be stored against the logical
  control feature, not every fragment
- `startYear` -> `start_year`
- `endYear` -> `end_year`
- `controller` -> `map_controllers.id`
- `status` -> `status`
- `confidence` -> `confidence`
- `sources` -> `map_control_record_sources`
- original record -> `raw_json`

## API Shape

Keep the existing frontend API compatible while internally switching tables.

### Compatibility API

`GET /api/frontend-china-control`

Return the current shape:

```ts
{
  adminBlocks: {
    schemaVersion: number;
    model: string;
    range: [number, number];
    notes: string;
    blocks: Array<{
      id: string;
      name: string;
      controlBlockId?: string;
      level: string;
      parent: string | null;
      center: [number, number];
      geometry: GeoJSONGeometry;
      confidence: string;
      approximate?: boolean;
      sources?: string[];
    }>;
  };
  controlTimeline: {
    schemaVersion: number;
    model: string;
    range: [number, number];
    keyYears: number[];
    controllers: Array<{ id: string; color: string }>;
    records: Array<...>;
  };
}
```

This lets the UI keep working while storage changes.

### New Query API

Add a general endpoint later:

`GET /api/map/features`

Parameters:

- `datasetId`
- `year`
- `regionId`
- `periodId`
- `level`
- `controllerId`
- `status`
- `bbox=west,south,east,north`
- `simplification=full|medium|low`
- `includeGeometry=true|false`
- `includeControl=true|false`
- `limit`

Return:

```ts
{
  dataset: {...},
  controlDataset?: {...},
  features: [
    {
      id,
      name,
      featureType,
      adminLevel,
      parentFeatureId,
      controlFeatureId,
      center,
      labelPoint,
      bbox,
      geometry?,
      control?,
      confidence,
      sources?
    }
  ]
}
```

### Feature Detail API

`GET /api/map/features/:id`

Return one feature with:

- geometry metadata
- aliases
- current and historical control records
- linked events
- linked evidence
- linked entities

This becomes the basis for a future commandery/detail page.

## RAG and Evidence Integration

Map features should be searchable and citeable. Add generated search documents
for:

- feature identity: name, aliases, parent, level
- control records: feature + controller + year range + confidence
- feature sources and control sources

Recommended `search_documents` mappings:

- `subject_table = 'map_features'`
- `subject_id = map_features.id`
- `topic_id = 'historical_geography'`
- `region_id = dataset.region_id`
- `period_id = dataset.period_id`
- `time_start/time_end = dataset time range or control record range`

For control records:

- `subject_table = 'map_control_records'`
- `subject_id = map_control_records.id`

This lets AI/RAG answer:

- Which polity controlled a commandery in a given year?
- What evidence supports that control?
- Which events happened in or near a commandery?
- Which administrative units are uncertain or approximate?

## Validation Rules

Importer and `validate-data` should enforce:

1. Every dataset has `coordinate_system = 'wgs84-lonlat'` unless explicitly
   documented otherwise.
2. Every geometry has valid GeoJSON type and coordinates.
3. Polygon rings should be closed where the source provides polygon rings.
4. Longitude is within `[-180, 180]`; latitude is within `[-90, 90]`.
5. `start_year <= end_year`.
6. Every control record references an existing feature or resolvable
   `control_feature_id`.
7. Every controller referenced by a control record exists.
8. Supplemental fragments must preserve `controlBlockId` or have an explicit
   explanation in `raw_json`.
9. If `source_id` is provided, it must exist.
10. If `entity_id` is provided, it must exist.

Do not require every historical geography assertion to have full source passage
links on day one. Allow string notes, but track missing structured evidence as a
coverage gap.

## Migration Plan

### Phase 1: Add Generic Tables

Add a new migration, for example:

`db/migrations/011-map-geometry-runtime.mjs`

Create:

- `map_geometry_datasets`
- `map_features`
- `map_feature_geometries`
- `map_feature_aliases`
- `map_control_datasets`
- `map_controllers`
- `map_control_records`
- `map_control_record_sources`
- `map_feature_sources`
- `map_feature_events`
- `map_feature_entities`
- indexes

Keep existing China-specific tables during this phase.

### Phase 2: Import Current China Blocks

Create importer:

`scripts/import-map-geometry-china-190-280.mjs`

It should import:

- `data/china-admin-blocks-190-280.json`
- `data/china-commandery-supplemental-blocks.json`
- `data/china-block-control-timeline-190-280.json`

The importer should report:

- number of features
- number of geometry rows
- number of supplemental fragments
- number of controllers
- number of control records
- unresolved parent ids
- unresolved control feature ids
- invalid/empty geometries

### Phase 3: Compatibility API

Change `frontendChinaControl(db)` to read from generic tables and emit the same
frontend shape as today.

Keep the old China-specific tables until output equivalence is verified.

### Phase 4: Validation and Coverage

Extend `scripts/validate-data.mjs`:

- validate generic geometry datasets
- validate control timelines
- validate feature/control evidence coverage
- compare compatibility output counts against old tables during transition

### Phase 5: Seed Export

Add generic map tables to `runtimeTables` in `scripts/export-sqlite-seed.mjs`.

After successful import:

1. rebuild DB
2. export seed
3. rebuild from seed
4. verify API

### Phase 6: Remove Old China-Specific Tables From Runtime Path

Only after API equivalence:

- stop reading `china_admin_blocks` in frontend API
- keep old tables temporarily for rollback
- later mark old China-specific tables as deprecated

Do not drop the old tables until at least one successful commit has shipped with
the generic tables and API.

## Non-Goals

Do not do these in the first migration:

- Do not implement a full GIS engine.
- Do not require TopoJSON conversion immediately.
- Do not rewrite all frontend map rendering at the same time.
- Do not delete the source JSON until seed rebuild and API output are verified.
- Do not assume all historical place names have clean entity ids today.
- Do not force every map source into formal `source_passages` immediately.

## Open Questions

These require actual data review before implementation:

1. How many parent ids in `china-admin-blocks-190-280.json` resolve exactly?
2. Do all current geometries have non-empty coordinate arrays?
3. Are there repeated names with different ids?
4. Which controllers should map to formal `entities` now?
5. Should display fragments be hidden from search by default?
6. Which simplification levels are needed for mobile performance?
7. Should future periods share stable place ids across renamed commanderies?

## Recommended Next Implementation

Start with the generic tables and importer, but keep frontend output unchanged.

Success criteria for the first implementation:

1. `china-admin-blocks-190-280.json` no longer needs to be loaded by the frontend.
2. `/api/frontend-china-control` returns the same shape as today.
3. Jiangxia and Lujiang supplemental fragments still render correctly.
4. `npm run build` and `npm run validate:data` pass.
5. Runtime seed rebuild preserves the generic map tables.
