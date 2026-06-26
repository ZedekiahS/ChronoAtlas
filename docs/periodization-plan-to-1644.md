# ChronoAtlas Periodization Plan To 1644

## Goal

This plan divides long-form world history into map-buildable periods. The product should eventually feel like one continuous historical atlas, but the data and maps should be built in periods that have coherent political geography.

The working rule is:

- China is always one core focus region.
- Each period should have 2-3 focus regions total.
- Other important areas appear as small panels, side boxes, or low-detail context layers.
- Period boundaries should follow structural changes in the map, not round-number centuries.
- Each period can contain several map snapshots. The period is the production unit; the snapshot is the map unit.

The first full target is from roughly 550 BCE to 1644 CE. Earlier history should exist as compressed background rather than the first high-detail build target.

## Region Tiers

Use these tiers per period.

- Core: full map, major events, people, evidence cards, timeline snapshots.
- Secondary: simplified map or side panel, major events and key people.
- Context: small box, trade route, religion/culture spread, or single timeline strip.

China should normally be Core. If the map is global, China still gets the most stable continuity layer.

## Map Granularity

Each period should store:

- `period`: broad production period, such as `190-310`.
- `snapshots`: key map years inside the period.
- `core_regions`: 2-3 areas that receive real map detail.
- `context_regions`: areas shown as side boxes or simplified outlines.
- `transition_reason`: why the period starts and ends there.

Do not try to draw every year. Draw high-quality snapshots and let event/control timelines explain the years between them.

## Compressed Background Before 550 BCE

These periods are background layers. They should be readable, but not treated as first-pass high-detail maps.

| Period | Working Title | Core Focus Regions | Context Regions | Snapshot Years | Reason |
|---|---|---|---|---|---|
| 3000-1600 BCE | Early Urban Civilizations | China/East Asian Neolithic and early states, Mesopotamia, Egypt | Indus, steppe corridors | 3000, 2500, 2000, 1600 BCE | Establish early river-valley civilizations and city-state formation. |
| 1600-1046 BCE | Bronze Age Kingdoms | Shang China, Egypt/Near East, Mesopotamia | Hittites, Mycenaean world, Indus afterlife | 1600, 1350, 1200, 1046 BCE | Bronze Age state systems and the Late Bronze Age collapse context. |
| 1046-771 BCE | Western Zhou And Iron Age Prelude | Western Zhou China, Assyria/Babylonia, Eastern Mediterranean | India Vedic polities, steppe | 1046, 900, 771 BCE | Zhou feudal order and West Asian imperial recovery. |
| 771-550 BCE | Spring And Autumn / Imperial Prelude | Eastern Zhou China, Neo-Assyrian/Babylonian world, Mediterranean city-states | Early India, Iranian plateau | 771, 650, 550 BCE | Leads into the Achaemenid, Greek, and Warring States world. |

## Main Build Periods: 550 BCE To 1644 CE

### 550-330 BCE: Achaemenid World And Warring States Formation

- Core regions: China, Achaemenid Persia/West Asia, Greek Mediterranean.
- Secondary/context: India mahajanapadas and early Magadha, steppe corridors.
- Snapshot years: 550, 500, 450, 400, 330 BCE.
- China focus: late Spring and Autumn to Warring States consolidation.
- World focus: Achaemenid imperial scale, Greco-Persian conflict, Greek city-state world.
- End reason: Alexander defeats the Achaemenid Empire and opens the Hellenistic age.

### 330-221 BCE: Hellenistic World And Late Warring States

- Core regions: China, Hellenistic West/Central Asia, India/Maurya.
- Secondary/context: Rome as rising Italian power, steppe and Tarim corridors.
- Snapshot years: 330, 300, 260, 230, 221 BCE.
- China focus: late Warring States, Qin expansion, unification.
- World focus: successor kingdoms, Seleucid-Ptolemaic competition, Maurya expansion.
- End reason: Qin unifies China; western Hellenistic order is already fragmented.

### 221-30 BCE: Qin-Han Formation And Roman Expansion

- Core regions: China, Roman Mediterranean, Central Asia/Parthia.
- Secondary/context: Hellenistic kingdoms, India after Maurya, steppe Xiongnu.
- Snapshot years: 221, 202, 141, 100, 60, 30 BCE.
- China focus: Qin, early Han, Wudi expansion, Xiongnu frontier, Western Regions.
- World focus: Roman Republic expansion, Parthia replacing Seleucid power, Mediterranean integration.
- End reason: Augustus ends the Roman civil wars; Han and Rome both enter imperial-stability phases.

### 30 BCE-190 CE: Han-Roman Imperial World

- Core regions: China/Han, Roman Empire, Central Asia-Parthia-Kushan.
- Secondary/context: India regional powers, Germanic frontier, Arabian trade.
- Snapshot years: 30 BCE, 25 CE, 73, 100, 166, 190.
- China focus: Western/Eastern Han, Wang Mang transition, Silk Road and frontier policy.
- World focus: Roman imperial consolidation, Parthia and Kushan as intermediaries.
- End reason: Han authority breaks into warlord politics; Rome exits the high imperial phase after Commodus and civil war.

### 190-310 CE: Imperial Crisis And New Frontiers

- Core regions: China, Rome, Sasanian Persia.
- Secondary/context: India, steppe groups, Red Sea/Indian Ocean trade.
- Snapshot years: 190, 220, 246, 260, 280, 293, 310.
- China focus: late Han collapse, Three Kingdoms, Jin reunification, early instability.
- World focus: Roman third-century crisis, Sasanian replacement of Parthia, Roman-Sasanian frontier.
- End reason: Diocletian/Constantine system begins; China moves toward post-Jin fragmentation.

### 310-439 CE: Northern-Southern Division And Late Roman Transformation

- Core regions: China, Roman/Byzantine world, Sasanian Persia.
- Secondary/context: steppe and Inner Asia, India Gupta, Germanic kingdoms.
- Snapshot years: 310, 317, 350, 376, 395, 410, 439.
- China focus: Western Jin collapse, Eastern Jin, Sixteen Kingdoms, Northern Wei unifies the north.
- World focus: Christianization of Rome, imperial east-west division, Sasanian mature state.
- End reason: Northern Wei unifies northern China; western Roman order is visibly fragmenting.

### 439-589 CE: Northern-Southern Dynasties And Post-Roman Worlds

- Core regions: China, Byzantine/Mediterranean, Sasanian Persia.
- Secondary/context: steppe empires, India Gupta/post-Gupta, western Germanic kingdoms.
- Snapshot years: 439, 476, 500, 535, 557, 589.
- China focus: Northern and Southern Dynasties, sinicization and frontier regimes, Sui reunification.
- World focus: Byzantine survival, western Roman successor kingdoms, Sasanian-Byzantine competition.
- End reason: Sui reunifies China and resets East Asian political geography.

### 589-750 CE: Sui-Tang, Islam, And Eurasian Reordering

- Core regions: China, Islamic Caliphate, Byzantine-Sasanian/West Asia transition.
- Secondary/context: Tibet, steppe Turks, India, Korea/Japan.
- Snapshot years: 589, 618, 632, 661, 705, 750.
- China focus: Sui reunification, Tang founding, Tang expansion, Anxi and Silk Road.
- World focus: Sasanian collapse, Islamic conquest, Byzantine contraction and survival.
- End reason: Abbasid revolution and An Lushan prelude both mark a new Eurasian phase.

### 750-907 CE: Tang-Abbasid Age

- Core regions: China, Islamic world, Inner Asia/Tibet.
- Secondary/context: Byzantium, Carolingian Europe, India, Japan.
- Snapshot years: 750, 755, 780, 820, 875, 907.
- China focus: An Lushan Rebellion, Tang regionalization, frontier contraction, late Tang collapse.
- World focus: Abbasid caliphate, Tibetan and Turkic power, trans-Eurasian exchange.
- End reason: Tang falls; China enters Five Dynasties and the Islamic world is politically more regionalized.

### 907-1206 CE: Song-Liao-Jin And The Pre-Mongol World

- Core regions: China, Inner Asia/steppe, Islamic-Central Asian world.
- Secondary/context: Byzantium and Crusader Levant, Western Europe, India.
- Snapshot years: 907, 960, 1004, 1066, 1127, 1141, 1206.
- China focus: Five Dynasties, Northern Song, Liao, Western Xia, Jin conquest of the north, Southern Song.
- World focus: steppe states, Seljuks, Crusades, Central Asian power corridors.
- End reason: Temujin becomes Chinggis Khan; Mongol expansion changes the entire Eurasian map.

### 1206-1368 CE: Mongol World System

- Core regions: China/Yuan, Mongol steppe empire, Islamic-Western/Central Asia.
- Secondary/context: Europe, India Delhi Sultanate, Japan/Korea, Southeast Asia.
- Snapshot years: 1206, 1215, 1234, 1271, 1279, 1294, 1368.
- China focus: Jin/Song conquest, Yuan rule, Red Turban rebellions, Ming founding.
- World focus: Mongol conquest networks, Ilkhanate, Chagatai, Golden Horde.
- End reason: Yuan collapses in China; post-Mongol regional states replace unified Mongol world structure.

### 1368-1517 CE: Ming, Timurids, And Ottoman Rise

- Core regions: China/Ming, Islamic Central-West Asia, Europe/Mediterranean.
- Secondary/context: India, steppe, Southeast Asia, maritime routes.
- Snapshot years: 1368, 1405, 1453, 1492, 1517.
- China focus: Ming founding, Yongle expansion and voyages, northern frontier and maritime policy.
- World focus: Timurid world, Ottoman capture of Constantinople, European Atlantic expansion.
- End reason: Ottomans take Mamluk Egypt; Atlantic and gunpowder empires become dominant structural forces.

### 1517-1644 CE: Early Modern Reordering

- Core regions: China/Ming-Qing transition, Ottoman-Safavid-Mughal Islamic empires, Europe/Atlantic powers.
- Secondary/context: Japan, Southeast Asia, Americas, Central Asia.
- Snapshot years: 1517, 1550, 1571, 1600, 1618, 1644.
- China focus: mid-late Ming, silver economy, coastal crisis, Manchu rise, Ming-Qing transition.
- World focus: Ottoman-Safavid-Mughal order, Reformation/European state competition, Atlantic colonial systems.
- End reason: 1644 is a major Chinese transition and a practical endpoint before the next global early-modern build.

## Suggested Build Order

1. Finish `190-310`, because it already has China, Rome, Sasanian maps, people, and evidence.
2. Build `310-439`, directly continuing the current dataset and UI.
3. Build `30 BCE-190 CE`, the direct prequel to the current slice.
4. Build `1517-1644`, because it is useful for future near-modern continuity and has strong China/Europe/Islamic empire comparison.
5. Build the rest from the center outward: `589-750`, `907-1206`, `1206-1368`, `1368-1517`, then the earlier BCE periods.

## UI Implications

The product should not show every region as equal weight in every period. Use this layout:

- Main map: China plus 1-2 contemporary high-impact regions.
- Side panels: context regions with simple boundary or timeline strip.
- Event compare page: show only core regions by default; context regions appear under "more context".
- Evidence page: allow region filters across all regions, but rank core-region evidence higher inside that period.
- People page: core-region people get full cards; context-region people can begin as compact cards.

## Data Implications

Each period should eventually have:

- `periods` row with start/end, title, and focus configuration.
- `map_snapshots` or equivalent runtime dataset keyed by period and year.
- `region_focus_tiers` or a JSON field defining core/secondary/context regions.
- `events` tagged with period and importance.
- `evidence_links` for formal major events first.
- `entities` for major rulers, generals, religious figures, and writers.

## Open Decisions

- Whether `30 BCE-190 CE` should be split at 25 CE because of Wang Mang/Eastern Han.
- Whether `589-750` should split at 618, or keep Sui as a short transition inside the larger period.
- Whether `907-1206` should split at 1127 for Northern/Southern Song. Product-wise it may remain one period with two map modes.
- Whether `1517-1644` should become `1368-1644` for a single Ming-focused phase, with 1517 treated as a world-context marker.

