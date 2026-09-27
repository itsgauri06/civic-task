# Suggested Team Split

Four workstreams that can run in parallel because they only share the two
contract documents (`API_SPEC.md`, `backend/models/schema.md`) — not each
other's code.

### 1. Frontend — citizen experience
**Owns:** `frontend/index.html`, `frontend/css/main.css`, `frontend/js/app.js`,
`graph-renderer.js`, `progress-tracker.js`, `step-drawer.js`
**Works against:** `frontend/js/sample-data.js` (already matches the API shape),
so this team never needs the backend running.
**Good first tasks:** mobile layout for the graph, a search/autocomplete for
`GET /api/tasks`, marking a step "in progress" vs. "done", exporting a
roadmap as a printable checklist.

### 2. Frontend — admin dashboard
**Owns:** `frontend/admin.html`, `frontend/css/admin.css`, `frontend/js/admin.js`
**Works against:** the same sample data, plus the `PUT/POST/DELETE` shapes in
`API_SPEC.md`.
**Good first tasks:** a diff view before saving an edit, a "needs re-verification"
filter (steps where `lastVerifiedAt` is >6 months old), bulk-editing fees.

### 3. Backend — API & graph logic
**Owns:** everything in `backend/` except `services/extractor.js`.
**Works against:** `backend/models/schema.md`.
**Good first tasks:** the cycle-detection edge cases in `graphBuilder.js`,
auth on the `/api/admin/*` routes, a second sample dataset (e.g. "apply for a
passport") to prove the graph logic isn't hardcoded to one task.

### 4. Data / extraction
**Owns:** `backend/services/extractor.js` and growing `backend/data/*.json`.
**Works against:** the raw-shape contract documented at the top of
`extractor.js`, and `backend/models/schema.md` for the final step shape.
**Good first tasks:** hand-curate 2–3 more high-traffic tasks (driving licence
renewal, property tax payment) before attempting automated scraping — this
proves out the schema against real bureaucratic variation, which is the hard
part, before investing in scraping infrastructure.

## Ground rule

Nobody edits another workstream's folder. If workstream 1 needs a new field on
a step, they propose the change to `backend/models/schema.md` and `API_SPEC.md`
first — those two files are the only thing that has to stay in sync across
everyone.
