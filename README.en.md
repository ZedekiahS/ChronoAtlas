# ChronoAtlas

[中文](./README.md) | [English](./README.en.md)

**ChronoAtlas** is an interactive world-history timeline. It uses structured data to place events, people, maps, and source evidence from different regions into the same chronological interface.

The project is not meant to be a generic encyclopedia. It is built around a simpler question:

> What was happening in different parts of the world at the same time, and how can those events be compared responsibly?

## Live Preview

- Cloudflare Pages: https://chronoatlas-preview.pages.dev

The current online version is a static read-only preview for browsing timelines, maps, events, people, sources, coverage, and evidence views. The local SQLite API, AI Q&A, write workflows, and data maintenance tools remain local-development features.

## Current Scope

The project has grown beyond the early 180-280 prototype into a multi-period data system:

- World overview: a timeline entry point from 550 BCE to 1644 CE.
- 190-310 template period: the first acceptance-standard period, covering late Han/Three Kingdoms China, the Roman third-century crisis, and the rise of the Sasanians.
- 310-589 China segment: Western Jin collapse, Eastern Jin, Sixteen Kingdoms, Northern and Southern Dynasties, and Sui reunification.
- Maps and evidence: event locations, polity layers, primary text excerpts, evidence links, and coverage audits.

## 190-310 Template Period

The 190-310 period defines the data-quality template for later periods:

- Standard document: `docs/period-190-310-standard.md`
- Audit script: `scripts/audit-period-template-190-310.mjs`
- Acceptance command: `npm run audit:period-190-310`

This period establishes the expected shape for events, people, sources, original excerpts, evidence links, map points, and search documents.

## 310-589 China Segment

The 310-589 segment is the current main expansion area. It covers the fall of Western Jin, Eastern Jin, the Sixteen Kingdoms, Liu Song, Southern Qi, Liang, Chen, Northern Wei, Eastern Wei, Western Wei, Northern Qi, Northern Zhou, and the Sui conquest of Chen.

Current audited data includes:

- 35 core China events.
- 104 source mentions, all with verified-transcribed original text.
- 103 event evidence links.
- 20 evidence claims.
- 86 core person cards for 310-589.
- 109 person life events.
- 109 person-event links.
- 251 search documents.
- 0 Wikisource sources.

Main source hierarchy for 310-589:

- Official histories: `Jinshu`, `Songshu`, `Nanqishu`, `Liangshu`, `Chenshu`, `Weishu`, `Beiqishu`, `Zhoushu`, `Suishu`
- Chronological calibration: `Zizhi Tongjian` sections for Jin, Song, Qi, Liang, Chen, and Sui
- Auxiliary dynastic summaries: `Nanshi`, `Beishi`
- Map support: `The Historical Atlas of China`, `Shuijing Zhu`, and CHGIS

Relevant standards and audits:

- `docs/period-310-589-source-standard.md`
- `scripts/audit-period-template-310-589.mjs`
- `scripts/audit-china-310-589-original-text-status.mjs`

Common checks:

```bash
npm run audit:period-310-589
npm run audit:china-310-589-originals
```

## Product Modules

The application now includes more than a basic timeline prototype:

- Timeline overview
- Learning mode
- Person index
- Age comparison
- Source evidence views
- Evidence graph
- Event comparison
- Coverage dashboard
- Map debugging
- RAG evaluation, AI Q&A, and AI records

## Data Principles

ChronoAtlas favors auditable structured history data over unchecked generated prose:

- Core events need sources, evidence links, and traceable fields.
- Original excerpts must not be replaced with summaries.
- Locator-only or pending excerpts must be explicitly marked.
- Official histories and `Zizhi Tongjian` play different evidence roles.
- Local scans, PDFs, raw long LLM outputs, unreviewed drafts, and demos are not part of formal commits.

## Repository Map

- `src/`: React frontend.
- `scripts/history-api-server.mjs`: local SQLite API.
- `scripts/audit-*.mjs`: period acceptance and data-quality audits.
- `scripts/seed-*.mjs`: seed scripts for core data.
- `db/schema.sql`: SQLite schema.
- `db/seeds/`: SQL seed files for rebuilding the database.
- `docs/`: product notes, data model, period standards, and source standards.
- `data/`: project data and map support files.

## Local Development

```bash
npm install
npm run validate:data
npm run dev
```

Default development URL:

```text
http://127.0.0.1:5173/
```

Local API:

```bash
npm run api
```

## Common Validation

```bash
npm run build
npm run validate:db
npm run audit:period-190-310
npm run audit:period-310-589
npm run audit:china-310-589-originals
```

After changing SQLite data, export the SQL seeds:

```bash
npm run db:seed:export
```

## Next Steps

Near-term priorities:

1. Add more original-source detail to 310-589 person cards and life events.
2. Expand map layers and coordinates for Jin, Sixteen Kingdoms, and Northern/Southern Dynasties.
3. Bring the 310-589 coverage dashboard closer to the 190-310 template-period acceptance view.
4. Improve RAG evaluation so AI answers remain grounded in traceable data.
