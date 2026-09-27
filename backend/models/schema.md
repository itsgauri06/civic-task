# Data Model

## Task
| field | type | notes |
|---|---|---|
| `id` | string (slug) | e.g. `register-small-business-in` |
| `title` | string | plain language, what the citizen typed |
| `location` | string | country/state this dataset applies to |
| `summary` | string | 1–2 sentence framing shown at the top of the roadmap |
| `steps` | Step[] | see below |

## Step
| field | type | notes |
|---|---|---|
| `id` | string (slug, unique within task) | referenced by `dependsOn` |
| `title` | string | e.g. "Reserve your business name" |
| `office` | string | issuing department/office |
| `description` | string | plain-language explanation |
| `documentsNeeded` | string[] | |
| `fee` | string | display string, e.g. "₹1,000" or "No fee" |
| `estimatedTime` | string | display string, e.g. "1–2 working days" |
| `eligibility` | string | who this step applies to / conditions |
| `sourceUrl` | string (URL) | official .gov page — always shown to the user |
| `lastVerifiedAt` | string (ISO date) | when an admin last confirmed this against the source |
| `dependsOn` | string[] | ids of steps that must be completed first |
| `tier` | integer | **server-computed** — longest dependency chain ending at this step; do not set by hand |
| `status` | `"published" \| "draft"` | draft steps are hidden from the public API |

## Invariants enforced by `graphBuilder.js`
- No `dependsOn` id may reference a nonexistent step.
- The graph must be acyclic.
- `tier` is always recomputed server-side on save, never trusted from client input.

## Frontend-only, not persisted here
Per-citizen progress (which steps are marked done) lives in the browser's
`localStorage`, keyed by `progress:<taskId>` — it is deliberately not sent to
the backend in this scaffold, since no user accounts exist yet. See
`frontend/js/progress-tracker.js`.
