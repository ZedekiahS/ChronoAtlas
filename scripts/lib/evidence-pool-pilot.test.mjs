import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import migrateEvidencePool from "../../db/migrations/031-evidence-pool-core.mjs";
import { resolveEvidenceAnchor, resolveWitnessReadingOrder } from "./evidence-anchor-resolver.mjs";
import {
  annotatedAssetPlan,
  evidencePoolCounts,
  ingestAnnotatedAsset,
  prepareAnnotatedAsset,
} from "./evidence-pool-pilot.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixturePath = path.join(rootDir, "data", "evidence-pool", "sanguozhi-wuyingdian-v54-pilot.json");

function createPilotDatabase(dbPath) {
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE entities (id TEXT PRIMARY KEY);
  `);
  migrateEvidencePool(db);
  return db;
}

function anchorForNode(db, nodeKey) {
  return db.prepare(`
    SELECT anchor.id
    FROM document_nodes node
    JOIN text_layers layer ON layer.node_id = node.id
    JOIN text_revisions revision ON revision.layer_id = layer.id
    JOIN text_anchors anchor ON anchor.text_revision_id = revision.id
    WHERE node.node_key = ?
    ORDER BY revision.revision_no DESC
    LIMIT 1
  `).get(nodeKey)?.id;
}

test("phase-1 pilot is idempotent, immutable, attributable, and code-point addressable", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "chronoatlas-evidence-pilot-"));
  const dbPath = path.join(tempDir, "pilot.sqlite");
  const db = createPilotDatabase(dbPath);

  try {
    const prepared = await prepareAnnotatedAsset(fixturePath);
    const plan = annotatedAssetPlan(prepared);
    assert.deepEqual(plan.intended, {
      works: 2,
      witnesses: 1,
      assets: 1,
      nodes: 8,
      textLayers: 6,
      fullNodeAnchors: 6,
      attributions: 1,
    });

    const first = ingestAnnotatedAsset(db, prepared);
    assert.equal(first.reusedCommittedRun, false);
    assert.deepEqual(first.additions, { assets: 1, revisions: 6, anchors: 6, nodes: 8 });
    const firstCounts = evidencePoolCounts(db);

    const second = ingestAnnotatedAsset(db, prepared);
    assert.equal(second.reusedCommittedRun, true);
    assert.deepEqual(second.additions, { assets: 0, revisions: 0, anchors: 0, nodes: 0 });
    assert.deepEqual(evidencePoolCounts(db), firstCounts);

    const quotationAnchorId = anchorForNode(db, "sgz-v54-zhou-yu-jiangbiao-quote");
    const quotationAnchor = resolveEvidenceAnchor(db, quotationAnchorId);
    assert.equal(quotationAnchor.node.layerRole, "quoted_fragment");
    assert.equal(quotationAnchor.layer.kind, "quotation");
    assert.equal(quotationAnchor.attributions.length, 1);
    assert.equal(quotationAnchor.attributions[0].work_title, "江表傳");
    assert.equal(quotationAnchor.selector.integrityValid, true);
    assert.equal(
      quotationAnchor.selector.endCodePoint - quotationAnchor.selector.startCodePoint,
      Array.from(quotationAnchor.selector.exact).length,
    );
    assert.equal(quotationAnchor.witness.fidelityStatus, "pilot_pending_image_collation");
    assert.equal(quotationAnchor.asset.rights[0].allow_display, 0);

    const readingOrder = resolveWitnessReadingOrder(db, prepared.document.witness.id);
    assert.deepEqual(
      readingOrder.nodes.map((node) => node.layerRole),
      ["main_text", "commentary", "main_text", "main_text", "quoted_fragment", "main_text"],
    );

    const originalBattleAnchorId = anchorForNode(db, "sgz-v54-zhou-yu-battle-main");
    const originalRevisionId = resolveEvidenceAnchor(db, originalBattleAnchorId).revision.id;
    const changedDocument = JSON.parse((await readFile(fixturePath)).toString("utf8"));
    const battleNode = changedDocument.nodes.find((node) => node.nodeKey === "sgz-v54-zhou-yu-battle-main");
    battleNode.layers[0].text = battleNode.layers[0].text.replace("軍眾", "軍中");
    const changedPath = path.join(tempDir, "changed-pilot.json");
    await writeFile(changedPath, `${JSON.stringify(changedDocument, null, 2)}\n`, "utf8");
    const changedPrepared = await prepareAnnotatedAsset(changedPath);
    const changed = ingestAnnotatedAsset(db, changedPrepared);
    assert.equal(changed.reusedCommittedRun, false);
    assert.deepEqual(changed.additions, { assets: 1, revisions: 1, anchors: 1, nodes: 0 });

    const changedCounts = evidencePoolCounts(db);
    assert.equal(changedCounts.source_assets, 2);
    assert.equal(changedCounts.ingest_runs, 2);
    assert.equal(changedCounts.text_revisions, 7);
    assert.equal(changedCounts.text_anchors, 7);
    assert.ok(db.prepare("SELECT 1 FROM text_revisions WHERE id = ?").get(originalRevisionId));
    assert.ok(resolveEvidenceAnchor(db, originalBattleAnchorId));

    assert.throws(
      () => db.prepare("UPDATE text_revisions SET content = content || '改' WHERE id = ?").run(originalRevisionId),
      /immutable/u,
    );
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
