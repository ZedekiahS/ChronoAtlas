# ChronoAtlas Evidence Graph and RAG Evaluation Roadmap

## Goal

ChronoAtlas should not become a generic "database plus AI chat" product. The technical core should be a verifiable historical knowledge system:

- Every important answer traces back to source evidence.
- Every source passage can be connected to events, people, places, dates, disputes, and map control.
- AI retrieval can be tested with repeatable evaluation cases.
- Coverage gaps are visible before they become hallucinations.

This roadmap focuses on two systems:

1. Evidence graph.
2. RAG and AI evaluation.

They should be built on top of the existing SQLite runtime first. PostgreSQL, vector search, or external graph databases can be considered later only if SQLite becomes a real bottleneck.

## Existing Foundation

Already useful:

- `sources`: source works.
- `source_mentions`: source excerpt or locator-level evidence.
- `evidence_links`: generic link from evidence to event/person/document.
- `events`, `entities`, `event_entities`: structured historical layer.
- `search_documents`: RAG/search document layer.
- `ai_retrieval_runs`, `ai_retrieval_items`, `ai_answers`: AI retrieval and answer trace.
- Coverage APIs:
  - `/api/frontend-coverage-190-310`
  - `/api/frontend-coverage-310-589`

Current limitation:

- Evidence links say "this source supports this thing", but they do not yet express the exact claim being supported.
- AI can retrieve evidence, but there is no formal test set that scores whether the answer used the evidence correctly.

## Part 1: Evidence Graph

### Concept

The evidence graph turns source evidence into small historical claims.

Example:

Source mention:

> 《晋书·恭帝纪》: 傅亮承裕密旨，讽帝禅位...

Claim:

> In 420, Liu Yu pressured the Jin emperor into abdication through Fu Liang.

Graph links:

- Claim -> source mention.
- Claim -> event `china-420-liu-yu-founds-song`.
- Claim -> person Liu Yu.
- Claim -> person Fu Liang.
- Claim -> polity Eastern Jin.
- Claim -> polity Liu Song.
- Claim -> year 420.
- Claim -> confidence/review status.

### Proposed Tables

#### `evidence_claims`

One row per minimal historical assertion.

Core fields:

- `id`
- `claim_type`
  - `event_occurrence`
  - `person_action`
  - `office_title`
  - `dynastic_transition`
  - `battle_result`
  - `map_control`
  - `date_assertion`
  - `relationship`
- `statement_zh`
- `statement_en`
- `time_start`
- `time_end`
- `region_id`
- `period_id`
- `confidence`
- `review_status`
- `dispute_status`
  - `none`
  - `variant`
  - `conflicting`
  - `uncertain`
- `raw_json`

#### `evidence_claim_sources`

Connect claims to source evidence.

Core fields:

- `claim_id`
- `source_id`
- `mention_id`
- `passage_id`
- `locator`
- `quote`
- `source_role`
  - `primary`
  - `parallel`
  - `counter`
  - `context`
  - `later_summary`
- `confidence`
- `raw_json`

#### `evidence_claim_subjects`

Generic claim-to-subject links.

Core fields:

- `claim_id`
- `subject_table`
- `subject_id`
- `subject_role`
  - `actor`
  - `target`
  - `place`
  - `polity`
  - `event`
  - `source_person`
  - `map_feature`
- `sort_order`
- `raw_json`

#### `evidence_claim_relations`

Claim-to-claim relationship graph.

Core fields:

- `source_claim_id`
- `target_claim_id`
- `relation_type`
  - `supports`
  - `duplicates`
  - `expands`
  - `narrows`
  - `contradicts`
  - `dates_same_event`
  - `alternative_interpretation`
- `note`
- `confidence`
- `review_status`
- `raw_json`

### First Milestone

Build claims only for 190-310 and 310-589 sample periods.

Minimum target:

- 1 to 3 claims per major event.
- Each claim has at least one `primary` or `parallel` source.
- Each claim links to the event and key people.
- Locator-only claims remain `draft`.
- Verified original-text claims can be `reviewed`.

### API

Suggested endpoints:

- `GET /api/evidence-graph/event/:eventId`
  - event
  - claims
  - source mentions
  - linked people
  - disputes

- `GET /api/evidence-graph/person/:entityId`
  - claims involving the person
  - chronological grouping
  - source density

- `GET /api/evidence-graph/claim/:claimId`
  - claim detail
  - supporting/counter evidence
  - related claims

- `GET /api/evidence-graph/coverage?period=310-589`
  - events without claims
  - claims without original text
  - claims without person/place links
  - disputed claims

### Frontend

Do not make this visually heavy. Add separate evidence graph pages:

- Event evidence graph panel.
- Person evidence graph panel.
- Claim detail page.
- Coverage drilldown page.

The first UI can be simple:

- Left: claims.
- Middle: source evidence.
- Right: linked people/events/places.

## Part 2: RAG and AI Evaluation

### Concept

The evaluation system tests whether AI answers are actually grounded in ChronoAtlas data.

It should not grade style first. It should grade historical grounding first.

### Proposed Tables

#### `rag_eval_questions`

Reusable test questions.

Fields:

- `id`
- `period_id`
- `region_id`
- `question_zh`
- `question_en`
- `question_type`
  - `fact_lookup`
  - `cross_region_compare`
  - `source_evidence`
  - `map_control`
  - `person_age`
  - `event_chain`
  - `dispute`
- `expected_subject_table`
- `expected_subject_id`
- `expected_claim_ids_json`
- `expected_source_ids_json`
- `difficulty`
- `review_status`
- `raw_json`

#### `rag_eval_runs`

One evaluation execution.

Fields:

- `id`
- `created_at`
- `provider`
- `model`
- `retrieval_strategy`
- `question_set_id`
- `raw_json`

#### `rag_eval_results`

One row per question result.

Fields:

- `run_id`
- `question_id`
- `answer_id`
- `retrieval_run_id`
- `score_total`
- `score_retrieval`
- `score_citation`
- `score_factuality`
- `score_coverage`
- `score_no_hallucination`
- `failure_type`
  - `no_retrieval`
  - `wrong_event`
  - `wrong_date`
  - `unsupported_claim`
  - `missing_citation`
  - `overbroad_answer`
  - `language_mismatch`
- `judge_note`
- `raw_json`

### Scoring Rules

Recommended first-pass scoring:

- Retrieval score: did the retrieval include the expected event/source/claim?
- Citation score: did the answer cite returned evidence instead of uncited memory?
- Factuality score: are dates, people, polities, and source claims correct?
- Coverage score: did it answer the actual question, not just nearby context?
- No-hallucination score: did it avoid unsupported claims?

Total score can be weighted:

- Retrieval: 25%
- Citation: 20%
- Factuality: 30%
- Coverage: 15%
- No hallucination: 10%

### First Eval Set

Start with 30 questions:

- 10 fact lookup questions.
- 8 source-evidence questions.
- 6 cross-region comparison questions.
- 4 map-control questions.
- 2 dispute/uncertainty questions.

Examples:

- "曹操去世时，罗马处于什么时期？"
- "383 年淝水之战有哪些原文证据？"
- "420 年中国发生了什么政权转折？"
- "557 年北方和南方分别发生了什么建国事件？"
- "589 年南北统一的证据来自哪部书？"

### Evaluation Modes

#### Deterministic Checks

No AI judge required:

- Expected source id retrieved?
- Expected event id retrieved?
- Answer citation ids exist in retrieval result?
- Answer contains unsupported citation ids?
- Locale matches requested language?

#### AI Judge Checks

Use only after deterministic checks:

- Does the answer overstate uncertain evidence?
- Does it answer the comparison fully?
- Does it confuse locator-only evidence with verified original text?

AI judge output must be stored as draft, not truth.

## Integration Plan

### Phase 1: Schema and Seed

Add schema tables:

- `evidence_claims`
- `evidence_claim_sources`
- `evidence_claim_subjects`
- `evidence_claim_relations`
- `rag_eval_questions`
- `rag_eval_runs`
- `rag_eval_results`

Seed:

- 190-310 core sample claims.
- 310-589 core sample claims.
- 30 eval questions.

### Phase 2: API

Add:

- `/api/evidence-graph/event/:eventId`
- `/api/evidence-graph/person/:entityId`
- `/api/evidence-graph/coverage`
- `/api/rag-eval/questions`
- `/api/rag-eval/run`
- `/api/rag-eval/results/:runId`

### Phase 3: Frontend

Add two separate pages:

- "证据图谱"
- "AI 评测"

Keep both sparse:

- no dense dashboards on the main map page.
- no raw technical dumps unless expanded.
- evidence graph should be readable by a history user.

### Phase 4: Quality Gate

Before a period is called "sample-grade":

- Every major event has at least one reviewed claim.
- Every reviewed claim has source evidence.
- Every AI answer in the sample eval set scores above a defined threshold.
- Locator-only evidence is never counted as verified original text.

## Engineering Rules

- AI must not write directly into reviewed data.
- Locator-only evidence is useful, but must remain visibly different from verified original excerpts.
- Cross-source agreement is stronger than one-source repetition.
- Map control claims require their own evidence links; they should not rely only on visual geometry.
- English output needs English claims, not only translated UI labels.

## Recommended Next Build Step

Build the evidence graph first.

Reason:

- RAG eval needs expected claims.
- Claims clarify what each source mention actually supports.
- Coverage pages become more meaningful.
- AI answers can cite claims and sources, not just document snippets.

Minimum useful implementation:

1. Add evidence graph schema.
2. Seed 20 claims for 190-310 and 310-589.
3. Add `/api/evidence-graph/event/:eventId`.
4. Add a simple event evidence graph page.
5. Then add the first 30 RAG eval questions.
