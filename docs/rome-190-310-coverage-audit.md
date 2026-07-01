# Rome 190-310 Coverage Audit

Generated from `db/chronoatlas.sqlite` after `scripts/seed-rome-ancient-knowledge.mjs`.

This audit checks whether Rome can work as part of the 190-310 reference period, especially for event display, source evidence, person pages, age comparison, and AI/RAG retrieval.

## Current Counts

| Area | Count | Notes |
|---|---:|---|
| Roman `search_documents` in 190-310 | 106 | Includes previous draft cards and newly added ancient-source cards. |
| Reviewed Roman documents | 56 | 32 ancient-source cards plus 24 reviewed core event documents. |
| Draft Roman documents | about 80 | Mostly promoted DeepSeek/staging event cards; usable, but not formally reviewed. |
| Roman ancient `source_passages` | 32 | New formal evidence passages. |
| Roman ancient `evidence_links` | 32 | Linked to search documents and source passages. |
| Formal Roman person records | 36 | Added for emperor/person index and age comparison scaffolding. |
| Roman person life events | 66 | Birth/death scaffold, with source refs where available. |
| Roman-linked person chunk links | 386 | Enables person-scoped evidence retrieval. |

## Ancient-Source Coverage Added

| Source | Cards |
|---|---:|
| Eutropius, `Breviarium` | 6 |
| Cassius Dio, `Roman History` | 4 |
| Herodian, `History of the Empire` | 3 |
| Zosimus, `Historia Nova` | 3 |
| Eusebius, `Ecclesiastical History` | 2 |
| Historia Augusta | 2 |
| Lactantius, `De Mortibus Persecutorum` | 2 |
| Aurelius Victor, `De Caesaribus` | 1 |

Important caution: these cards currently store paraphrased evidence notes rather than verbatim Greek/Latin passages. They are acceptable for retrieval and source scaffolding, but the strongest final version should later add short verifiable original excerpts.

## Phase Coverage

| Phase | Docs | Reviewed | Covered Years | Empty Years |
|---|---:|---:|---:|---|
| 190-217 Severan civil settlement | 30 | 5 | 11 | 190, 191, 192, 195, 196, 199, 201-207, 209, 210, 214, 215 |
| 218-235 Late Severans | 12 | 1 | 6 | 220, 221, 223, 225-229, 231-234 |
| 236-253 Early crisis | 14 | 4 | 8 | 236, 237, 239-243, 245-247 |
| 254-268 Valerian/Gallienus crisis | 12 | 3 | 4 | 254-259, 261, 263-266 |
| 269-285 Aurelian-Probus recovery | 25 | 6 | 12 | 273, 278, 279, 281, 283 |
| 286-310 Tetrarchy/Constantinian transition | 13 | 3 | 7 | 287-292, 294-300, 302, 304, 307, 309, 310 |

## Main Gaps

### 1. Person Layer Is Now Scaffolded, But Not Yet Rich

Rome now has formal `persons`, `entities`, aliases, birth/death scaffold life events, and document chunk links for the P0 Roman/Palmyrene figures. This is enough for person index and basic age comparison, but it is not yet equivalent to the China model because most people only have birth/death scaffold events.

Needed for parity with China:

| Priority | Person Group | Reason |
|---|---|---|
| Done as scaffold | Septimius Severus, Caracalla, Geta, Macrinus, Elagabalus, Alexander Severus | Still needs reign/service/death-detail life nodes. |
| P0 | Maximinus Thrax, Gordian I, Gordian II, Pupienus, Balbinus, Gordian III, Philip the Arab, Decius | Required for early crisis and 238-251 sequence. |
| P0 | Valerian, Gallienus, Claudius II, Aurelian, Tacitus, Probus, Carus, Carinus, Numerian | Required for 253-285 crisis/recovery. |
| P0 | Diocletian, Maximian, Galerius, Constantius Chlorus, Severus II, Maximinus Daia, Constantine, Maxentius | Required for Tetrarchy and 305-310 transition. |
| P1 | Julia Domna, Julia Maesa, Julia Soaemias, Julia Mamaea, Zenobia, Odaenathus, Tetricus, Postumus | Needed for political network and non-emperor power holders. |

Minimum formal fields should match the China person pattern:

- `id`
- `region`
- `name`
- `birth_year`
- `death_year`
- `life_confidence`
- `primary_polity`
- `summary`
- source refs
- key life events linked to source passages

### 2. Reviewed Evidence Is Concentrated, Not Continuous

The strongest reviewed cards cover major turning points:

- 193 Severus
- 211-212 Caracalla/Geta/citizenship
- 235 Alexander Severus/Maximinus
- 238 six emperors
- 249-251 Decius
- 260 Valerian
- 268-274 Gallienus/Claudius/Aurelian
- 284-305 Diocletian/Tetrarchy/persecution/abdication

Thin areas:

- 218-222 Elagabalus and Severan women
- 230-233 Alexander Severus and Ardashir/early Sasanian pressure
- 240-244 Gordian III, Timesitheus, Philip, Misiche
- 254-259 Valerian's eastern war before capture
- 261-267 Postumus, Macriani, Odaenathus, Palmyrene autonomy
- 286-296 Carausius, Allectus, Maximian, Constantius, Britain
- 297-298 Galerius vs Narseh and Treaty of Nisibis
- 306-310 Constantine, Maxentius, Maximian's return, Carnuntum

### 3. Source Balance Needs Cleanup

Current formal ancient-source cards rely heavily on short epitomes for later third-century events. That is acceptable as a scaffold, but not enough for final historical confidence.

Needed additions:

| Source | Use |
|---|---|
| Cassius Dio 79-80 | Macrinus, Elagabalus, Alexander Severus where preserved. |
| Herodian 5-8 | Elagabalus, Alexander Severus, Maximinus, 238. |
| Eutropius 9 | Baseline chronology for 249-305. |
| Aurelius Victor / Epitome de Caesaribus | Cross-check Gallienus, Claudius, Aurelian, Diocletian. |
| Zosimus 1 | Palmyra, Aurelian, late crisis. |
| Lactantius 7-19 | Tetrarchy formation, persecution, abdication, succession conflict. |
| Eusebius HE 8 | Great Persecution, regional Christian evidence. |
| Historia Augusta | Use only with low-confidence flags unless corroborated. |
| Inscriptions / papyri / coins | Necessary for citizenship edict, price edict, imperial titles, provincial reforms. |

### 4. Event Importance Needs Review

Because 84 Roman documents are still `draft`, the main map and AI can retrieve too much medium-detail material if filters loosen. For the main page:

- `major`: only regime-shaping or world-map-shaping events.
- `medium`: regional wars, succession events, reforms.
- `detail`: source criticism, individual biographies, local notes.

Major event candidates:

- 193 Severus seizes Rome after Pertinax/Julianus crisis
- 197 Severus defeats Albinus
- 212 Constitutio Antoniniana
- 235 Alexander Severus killed; Maximinus raised
- 238 Year of the Six Emperors
- 251 Decius killed at Abrittus
- 260 Valerian captured; Gallic/Palmyrene fragmentation
- 272 Aurelian recovers Palmyra
- 274 Aurelian reunifies empire
- 284 Diocletian becomes emperor
- 293 Tetrarchy formed
- 303 Great Persecution begins
- 305 Diocletian and Maximian abdicate
- 306 Constantine and Maxentius enter succession conflict

## Recommended Next Work

1. Enrich the Roman person seed.
   The formal rows exist now; next pass should add reign, war, accession, deposition, and relationship life nodes.

2. Promote key Roman draft cards from `draft` to `reviewed`.
   Prioritize the 20-30 major/medium cards that drive the main timeline and map, not every detail card.

3. Add a second ancient-source pass for the weak years.
   Focus on 218-222, 230-244, 254-267, and 286-310. These are the biggest chronological gaps after the current pass.

## Acceptance Target For Rome 190-310

Rome can be considered reference-period ready when:

- At least 35-45 reviewed source evidence cards exist.
- All P0 emperors have formal person rows and at least one sourced life event.
- Every major event has at least one ancient-source evidence link.
- Tetrarchy dates are clear: 284 accession, 286 dual Augusti, 293 Tetrarchy, 305 abdication, 306-310 breakdown.
- Main page only shows major Roman events by default.
- AI answers for named Roman events cite the database first and do not rely on generic model memory.
