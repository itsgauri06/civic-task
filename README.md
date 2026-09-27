# Civic Task Navigator

Turns "I want to register a small business" into a visual, step-by-step roadmap of
the forms, offices, fees, and prerequisites scattered across government websites.

## Try it in 30 seconds

No build tools required for the frontend demo:

```bash
open frontend/index.html          # macOS
xdg-open frontend/index.html      # Linux
# or just double-click the file
```

It runs in **demo mode** using bundled sample data (`frontend/js/sample-data.js`)
if it can't reach a backend. To run the real stack:

```bash
cd backend
npm install
npm start                          # serves API on http://localhost:3001
```

Then open `frontend/index.html` again — it will detect the API and use live data
instead of the bundled sample.

Admin dashboard: `frontend/admin.html`

## Why the project is laid out this way

This repo is split into independent folders on purpose, so **separate people can
work on separate pieces without stepping on each other's files**:

| Folder | Owns | Depends on |
|---|---|---|
| `frontend/` | Citizen-facing UI: task input, dependency graph, step drawer, progress tracking | Only the contract in `docs/API_SPEC.md` — never the backend's internals |
| `backend/routes/` | HTTP endpoints (`/api/tasks`, `/api/admin`) | `backend/services/` and `backend/data/` |
| `backend/services/` | Business logic: turning raw extracted facts into an ordered dependency graph, validating admin edits | `backend/data/schema.md` only |
| `backend/data/` | The actual civic-task datasets (one JSON file per task) and the source registry | Nothing — pure data |
| `docs/` | The contracts everyone codes against (`API_SPEC.md`, `schema.md`, `ARCHITECTURE.md`) | Nothing |

Because every team works against `docs/API_SPEC.md` and `backend/models/schema.md`
rather than against each other's code, the frontend can be built entirely against
mock data while the backend and a hypothetical extraction pipeline are built in
parallel. See `docs/TASK_BREAKDOWN.md` for a suggested 4-workstream split.

## What's real vs. stubbed in this scaffold

- **Real and working:** the frontend graph UI, step drawer, progress tracking
  (localStorage), the admin review dashboard, and an Express backend that serves
  and edits JSON task data with dependency-graph validation.
- **Stubbed with a clear extension point:** `backend/services/extractor.js`.
  Actually scraping and parsing dozens of `.gov` sites (or running an LLM
  extraction pipeline over them) is a large, jurisdiction-specific effort — this
  scaffold ships one hand-curated sample dataset (business registration, India)
  and a documented interface (`extractRawSourceData()`) so a data/scraping team
  can plug real extraction in without touching the graph logic, the API, or the
  UI.

## Repo map

```
civic-task-navigator/
├── frontend/            # Citizen-facing app + admin dashboard (vanilla JS, no build step)
│   ├── index.html
│   ├── admin.html
│   ├── css/
│   └── js/
├── backend/             # Express API
│   ├── server.js
│   ├── routes/
│   ├── services/
│   ├── data/
│   └── models/
└── docs/                # Contracts + architecture notes — read these first
    ├── ARCHITECTURE.md
    ├── API_SPEC.md
    ├── TASK_BREAKDOWN.md
    └── (backend/models/schema.md holds the data model)
```
