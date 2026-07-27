import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOfficialHistoryEventDetail,
  buildOfficialHistoryRelatedEventRefs,
  isCompleteOfficialHistoryEventDetail,
  mergeLegacyOfficialHistoryEventDetail,
  mergeOfficialHistoryRelatedEventRefs,
  officialHistoryEnrichmentInputFingerprint,
  officialHistoryEventEnrichmentGenerator,
  preserveOfficialHistoryEventEnrichment,
  splitOfficialHistoryEventClauses,
} from "./official-history-event-enrichment.mjs";

test("event enrichment recognizes only the complete seven-section detail contract", () => {
  assert.equal(isCompleteOfficialHistoryEventDetail({ overview: "旧结构", fields: {} }), false);
  assert.equal(isCompleteOfficialHistoryEventDetail({
    overview: "概述",
    background: [],
    process: [],
    result: [],
    impact: [],
    sourceNotes: [],
    uncertainty: [],
  }), true);
});

test("legacy reviewed detail migrates explicit overview, result and impact without losing generated sections", () => {
  const generated = {
    overview: "机器概述。",
    background: ["背景。"],
    process: ["经过。"],
    result: ["材料未载结果。"],
    impact: ["材料未载影响。"],
    sourceNotes: ["来源。"],
    uncertainty: ["待核。"],
  };
  const migrated = mergeLegacyOfficialHistoryEventDetail(generated, {
    scale: "major",
    fields: {
      content: "人工概述",
      result: "人工结果",
      impact: "人工影响",
    },
  });

  assert.equal(migrated.overview, "人工概述。");
  assert.deepEqual(migrated.result, ["人工结果。"]);
  assert.deepEqual(migrated.impact, ["人工影响。"]);
  assert.deepEqual(migrated.process, ["经过。"]);
});

test("generated related events merge with editorial relations and replace stale generated refs", () => {
  const merged = mergeOfficialHistoryRelatedEventRefs({
    relatedEvents: ["event:editorial", "event:stale"],
    relatedEventRefs: [{ eventId: "event:stale", relationType: "shared-participant" }],
    enrichment: {
      generator: "enrich-official-history-events:v1",
      generatedRelatedEventIds: ["event:stale"],
    },
  }, [{
    eventId: "event:fresh",
    relationType: "same-historical-context",
    confidence: "medium",
    basis: "共享历史对象。",
  }]);

  assert.deepEqual(merged.relatedEvents, ["event:editorial", "event:fresh"]);
  assert.equal(merged.relatedEventRefs[0].relationType, "editorial");
  assert.equal(merged.relatedEventRefs[1].eventId, "event:fresh");
  assert.deepEqual(merged.generatedRelatedEventIds, ["event:fresh"]);

  const collision = mergeOfficialHistoryRelatedEventRefs({
    relatedEvents: ["event:editorial"],
  }, [{
    eventId: "event:editorial",
    relationType: "shared-participant",
    confidence: "high",
    basis: "机器候选。",
  }]);
  assert.equal(collision.relatedEventRefs[0].relationType, "editorial");
  assert.deepEqual(collision.generatedRelatedEventIds, []);
});

test("event enrichment removes chronology and source glosses from narrative clauses", () => {
  assert.deepEqual(
    splitOfficialHistoryEventClauses("夏四月辛酉，封皇子建为千乘王，千乘，国名，今青州县，故城在今淄州高苑北。"),
    ["封皇子建为千乘王"],
  );
  assert.deepEqual(
    splitOfficialHistoryEventClauses("建武元年，世祖入洛阳，遣大司马吴汉等击檀乡，明年春，大破降之。"),
    ["世祖入洛阳", "遣大司马吴汉等击檀乡", "大破降之"],
  );
  assert.deepEqual(
    splitOfficialHistoryEventClauses("张角太平道起事，黄巾起义爆发。"),
    ["张角太平道起事", "黄巾起义爆发"],
  );
});

test("event enrichment separates explicit outcomes without inventing long-term impact", () => {
  const { detail, fieldProvenance } = buildOfficialHistoryEventDetail(
    {
      id: "event:liu-shang",
      title: "刘尚破益州夷",
      summary: "二十一年春正月，武威将军刘尚破益州夷，平之。",
    },
    [{ id: "evidence:1", sourceId: "houhanshu", sourceTitle: "后汉书 显宗纪", locator: "段 6" }],
  );

  assert.equal(detail.overview, "武威将军刘尚破益州夷，平之。");
  assert.deepEqual(detail.process, ["武威将军刘尚破益州夷。", "平之。"]);
  assert.deepEqual(detail.result, ["平之。"]);
  assert.match(detail.impact[0], /长期影响/u);
  assert.equal(fieldProvenance.result.method, "explicit-source-outcome");
  assert.equal(fieldProvenance.impact.method, "source-limitation");
});

test("event enrichment recognizes archaic accession and extermination outcomes", () => {
  const succession = buildOfficialHistoryEventDetail({
    id: "event:hedi-shangdi",
    title: "汉和帝崩与刘隆即位",
    summary: "元兴元年十二月辛未，汉和帝崩于章德前殿；皇子刘隆被立为皇太子，当夜卽皇帝位，时诞育百余日。",
  }).detail;
  assert.deepEqual(succession.process, [
    "皇子刘隆被立为皇太子。",
    "当夜卽皇帝位。",
  ]);
  assert.deepEqual(succession.result, [
    "皇子刘隆被立为皇太子。",
    "当夜卽皇帝位。",
  ]);

  const campaign = buildOfficialHistoryEventDetail({
    id: "event:yuchujian",
    title: "任尚讨灭于除鞬",
    summary: "永元五年，北匈奴单于於除鞬叛，汉遣中郎将任尚讨灭之。",
  }).detail;
  assert.deepEqual(campaign.result, ["汉遣中郎将任尚讨灭之。"]);
});

test("event enrichment only treats explicit consequence clauses as impact", () => {
  const { detail, fieldProvenance } = buildOfficialHistoryEventDetail({
    id: "event:zhang-yu",
    title: "张纡诱诛烧当种羌迷吾等",
    summary: "章和二年，护羌校尉张纡诱诛烧当种羌迷吾等，由是诸羌大怒，谋欲报怨，朝廷忧之。",
  });

  assert.deepEqual(detail.impact, ["由是诸羌大怒。", "谋欲报怨。", "朝廷忧之。"]);
  assert.equal(fieldProvenance.impact.method, "explicit-source-consequence");
});

test("source comparisons become uncertainty notes instead of event process", () => {
  const { detail } = buildOfficialHistoryEventDetail({
    id: "event:li-te",
    title: "赵廞败亡，李特入成都",
    summary: "赵廞政权败亡后，李特率军进入成都，《晋书·惠帝纪》称李特杀赵廞，《资治通鉴》称赵廞为随从所杀，标题采用中性表述。",
  });

  assert.deepEqual(detail.process, ["赵廞政权败亡后。", "李特率军进入成都。"]);
  assert.equal(detail.uncertainty.filter((item) => item.startsWith("异文或编辑说明：")).length, 3);
  assert.doesNotMatch(detail.overview, /标题采用/u);
});

test("editorial chronology source context is exposed as an uncertainty note", () => {
  const { detail } = buildOfficialHistoryEventDetail({
    id: "event:anguo",
    title: "骨都侯喜杀南单于安国",
    summary: "南单于安国叛，骨都侯喜斩之。",
    raw: {
      timeResolution: [{
        chronology: {
          year: 94,
          sourceContext: "《南匈奴列传》系于永元六年，《和帝纪》误列去年。",
        },
      }],
    },
  });

  assert.equal(
    detail.uncertainty.some((item) => item.includes("年代校勘：《南匈奴列传》系于永元六年")),
    true,
  );
});

test("reviewed modern summaries separate explicit structural consequences from process", () => {
  const { detail } = buildOfficialHistoryEventDetail({
    id: "china-301-sima-lun-usurps",
    title: "赵王司马伦篡位",
    summary: "司马伦废惠帝自立，宗王争权升级为公开篡位，激起齐王冏等举兵讨伦。",
    raw: { reviewStatus: "reviewed" },
  });

  assert.deepEqual(detail.process, ["司马伦废惠帝自立。"]);
  assert.deepEqual(detail.impact, ["宗王争权升级为公开篡位。", "激起齐王冏等举兵讨伦。"]);
  assert.match(detail.uncertainty[1], /已审核摘要明示/u);

  const concessive = buildOfficialHistoryEventDetail({
    id: "china-309-han-zhao-attacks-luoyang",
    title: "汉赵军进逼洛阳",
    summary: "汉赵诸军进攻洛阳周边，西晋中枢虽仍在洛阳，却已被外部军事压力持续包围。",
    raw: { reviewStatus: "reviewed" },
  }).detail;
  assert.deepEqual(concessive.process, ["汉赵诸军进攻洛阳周边。"]);
  assert.deepEqual(concessive.impact, ["西晋中枢虽仍在洛阳，却已被外部军事压力持续包围。"]);
});

test("related-event inference records evidence signals but never assigns causality", () => {
  const events = [
    {
      id: "event:88",
      title: "窦宪击北匈奴",
      summary: "窦宪击北匈奴，大破之。",
      startYear: 88,
      participantPersonIds: ["person:dou-xian"],
      participantPeople: ["窦宪"],
      placeEntityIds: [],
      eventType: "war",
    },
    {
      id: "event:89",
      title: "窦宪大破匈奴",
      summary: "窦宪大破匈奴。",
      startYear: 89,
      participantPersonIds: ["person:dou-xian"],
      participantPeople: ["窦宪"],
      placeEntityIds: [],
      eventType: "war",
    },
    {
      id: "event:unrelated",
      title: "封刘建为千乘王",
      summary: "封刘建为千乘王。",
      startYear: 89,
      participantPersonIds: ["person:liu-jian"],
      participantPeople: ["刘建"],
      placeEntityIds: [],
      eventType: "politics",
    },
  ];
  const refs = buildOfficialHistoryRelatedEventRefs(events);

  assert.equal(refs.get("event:88").length, 1);
  assert.equal(refs.get("event:88")[0].eventId, "event:89");
  assert.equal(refs.get("event:88")[0].relationType, "shared-participant");
  assert.doesNotMatch(refs.get("event:88")[0].basis, /导致|因此/u);
  assert.equal(refs.get("event:unrelated").length, 0);
});

test("related-event inference flags duplicate source facts for editorial merge", () => {
  const summary = "六月，烧当羌叛，金城太守郝崇讨之，败绩，羌遂寇汉阳。";
  const refs = buildOfficialHistoryRelatedEventRefs([
    { id: "event:76", title: "烧当羌叛乱", summary, startYear: 76, participantPersonIds: ["person:hao-chong"], participantPeople: ["郝崇"], placeEntityIds: [], eventType: "war" },
    { id: "event:77", title: "烧当羌叛", summary, startYear: 77, participantPersonIds: ["person:hao-chong"], participantPeople: ["郝崇"], placeEntityIds: [], eventType: "war" },
  ]);

  assert.equal(refs.get("event:76")[0].relationType, "possible-duplicate");
  assert.equal(refs.get("event:76")[0].confidence, "high");
});

test("promotion preserves generated enrichment only while its inputs remain unchanged", () => {
  const nextRaw = {
    id: "event:1",
    title: "刘尚破益州夷",
    startYear: 45,
    endYear: 45,
    summary: "刘尚破益州夷，平之。",
    personIds: ["liu-shang"],
    placeEntityIds: ["place:yizhou"],
    sourceRefs: [{ sourceId: "houhanshu", locator: "段 6" }],
    relatedEvents: [],
  };
  const existingRaw = {
    ...nextRaw,
    detail: { overview: "已富化" },
    relatedEvents: ["event:2"],
    relatedEventRefs: [{ eventId: "event:2" }],
    enrichment: {
      generator: officialHistoryEventEnrichmentGenerator,
      inputFingerprint: officialHistoryEnrichmentInputFingerprint(nextRaw),
    },
  };

  assert.equal(preserveOfficialHistoryEventEnrichment(existingRaw, nextRaw).detail.overview, "已富化");
  assert.equal(
    preserveOfficialHistoryEventEnrichment(existingRaw, { ...nextRaw, summary: "原文已修改。" }).detail,
    undefined,
  );
});
