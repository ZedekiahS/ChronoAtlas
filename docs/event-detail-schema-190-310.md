# 190-310 Event Detail Schema

This is the reusable event-detail contract for the 190-310 reference period. Later periods should use the same shape so China, Rome, Sasanian Persia, and future regions render through one frontend component and one API contract.

## Required Detail Shape

Every formal event detail uses:

```json
{
  "overview": "One compact judgment paragraph.",
  "background": ["Why the event became possible."],
  "process": ["What happened, in sequence."],
  "result": ["Direct outcomes."],
  "impact": ["Longer-range consequences."],
  "sourceNotes": ["Which sources support the reconstruction."],
  "uncertainty": ["Known disputes, limits, or confidence warnings."]
}
```

Rules:

- `overview` is always a string. It should be the first paragraph a reader sees.
- The other six fields are always arrays. They may be empty only when the event is intentionally lightweight.
- Do not mix source criticism into `process`; keep it under `sourceNotes` or `uncertainty`.
- Do not force equal content volume across civilizations. China can have denser primary-source coverage; Rome and Sasanian Persia may have fewer items but must keep the same field shape.
- `sourceRefs` stay outside `detail` and point to structured `sources` / `evidence_links`.

## Region Expectations

China:

- Main events usually have all six arrays populated.
- Original-source evidence should prefer `三国志`, `后汉书`, `晋书`, and `资治通鉴`.
- `overview` can be derived from the event summary when older records already have detailed arrays.

Rome:

- Core events already use the same seven fields.
- Ancient-source events may be shorter, but still use `overview`, `background`, `process`, `result`, `impact`, `sourceNotes`, and `uncertainty`.
- When a source is late or problematic, mark the caution under `uncertainty`.

Sasanian Persia:

- Core anchor events should follow the full structure.
- Sparse events may remain lightweight until enough evidence exists.
- Prioritize inscriptions, coinage, and Roman/Greek narrative traditions with explicit confidence notes.

## Runtime Normalization

Use:

```bash
npm run normalize:event-details
```

This normalizes existing 180-310 China/Rome/Sasanian event details:

- adds missing `overview` from the event summary;
- ensures all six array fields exist;
- updates both legacy `historical_events.detail_json` and future-schema `events.raw_json.detail`;
- leaves empty-detail events untouched to avoid invented content.
