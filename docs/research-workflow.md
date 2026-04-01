# Research Workflow

This bot now has a documented split between runtime code and data research so future updates are easier to repeat.

## Source Order

1. Prefer official Boom Beach material first.
2. Use Boom Beach Wiki as the main structured secondary source.
3. Treat community posts and videos as tie-breakers, not the primary dataset.

## Update Checklist

1. Pick the dataset you are changing in `data/research-sources.json`.
2. Confirm the entity name, capitalization, and level cap before editing values.
3. Update JSON values in one dataset at a time so diff reviews stay readable.
4. Record any unusual mechanics or missing fields in the dataset notes.
5. Run `npm run check` after structural changes to catch broken command exports.

## Practical Guidance

- Troop, defence, prototype, and gunboat values should be updated from a single research pass rather than piecemeal edits across commands.
- If a field is inferred rather than directly sourced, leave a note in the research source file before shipping it.
- Keep command wording decoupled from raw wiki phrasing so future source changes do not force runtime refactors.
