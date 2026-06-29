# Legacy data enrichment scripts

These scripts are kept as historical references for the old Three Kingdoms
DeepSeek/manual data enrichment workflow.

They wrote directly to JSON source files such as:

- `data/china-persons.json`
- `data/china-person-life-events.json`
- `data/china-person-relations.json`
- `data/china-source-mentions.json`
- `data/cao-wei-person-coverage-plan.json`

The current runtime path is SQLite seed/API first. Treat these scripts as
templates for field shape and evidence structure, not as active import commands.
If a future batch reuses their logic, port it into the current SQLite import or
promotion pipeline before running it as part of the normal workflow.
