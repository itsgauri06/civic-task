# Architecture

## Pipeline

```
 Citizen types a task          Extraction pipeline           Graph service          Frontend
 ("register a small   ---->    pulls facts from      ---->   turns flat facts ----> renders steps
  business", location)         scattered .gov pages           into an ordered        as a DAG +
                                (backend/services/             DAG of steps           step drawer,
                                extractor.js)                  (backend/services/     tracks progress
                                                                graphBuilder.js)
```

## Why a graph, not a checklist

Civic procedures are rarely linear. "Register a small business" needs a name
approval *before* a PAN application, but a shop license and GST registration can
happen in parallel once the entity is registered. Modeling this as a dependency
graph (steps + `dependsOn` edges) lets the UI show what can be done *now* vs.
what's blocked, instead of forcing a fake single-file sequence.

## Data flow, concretely

1. `backend/data/tasks.json` holds one entry per civic task, each a list of
   `steps` with `id`, `dependsOn`, and the fields in `backend/models/schema.md`.
2. `backend/services/graphBuilder.js` validates the graph (no cycles, no dangling
   `dependsOn` references) and computes each step's "tier" (how many steps must
   finish before it can start) — the frontend uses tiers to lay out columns.
3. `backend/routes/tasks.js` exposes `GET /api/tasks/:taskId` returning the
   validated, tiered graph — see `docs/API_SPEC.md`.
4. `frontend/js/api.js` fetches that; if the backend is unreachable it falls
   back to `frontend/js/sample-data.js`, which is the *same shape*, so the UI
   code never needs to know which source it got data from.
5. `frontend/js/graph-renderer.js` draws the DAG as SVG columns by tier;
   `frontend/js/progress-tracker.js` persists which steps a citizen has marked
   done, in `localStorage`, keyed by task id.
6. The admin dashboard (`frontend/admin.html` + `frontend/js/admin.js`) calls
   `PUT /api/admin/tasks/:taskId/steps/:stepId` to correct extracted data —
   `backend/routes/admin.js` re-runs the same graph validation before saving, so
   an admin can never save a broken (cyclic or dangling) graph.

## Extending to a real extraction pipeline

`extractRawSourceData(taskDescription, location)` in
`backend/services/extractor.js` is the one function a data/scraping team needs
to implement for real. It must return the raw shape documented in that file's
header comment; `graphBuilder.js` takes it from there. This boundary is what
lets the scraping work happen without anyone touching the graph logic, the API
routes, or any frontend code.

## Trust and verification

Every step carries `sourceUrl` and `lastVerifiedAt`. The frontend always shows
the official source link next to extracted info rather than presenting it as
Claude's/the tool's own authority — the tool aggregates and structures, the
`.gov` page is still the source of truth. The admin dashboard's job is
specifically to keep `lastVerifiedAt` honest.
