# API Spec

Base URL (dev): `http://localhost:3001`

This is the contract between `frontend/` and `backend/`. Either side can be
rebuilt independently as long as it still satisfies this document.

## `GET /api/tasks`
List available civic tasks (for a search/autocomplete box).

**200** →
```json
[
  { "id": "register-small-business-in", "title": "Register a small business", "location": "India" }
]
```

## `GET /api/tasks/:taskId`
Full dependency graph for one task, already validated and tiered.

**200** →
```json
{
  "id": "register-small-business-in",
  "title": "Register a small business",
  "location": "India",
  "summary": "One or two sentences of plain-language framing.",
  "steps": [
    {
      "id": "name-approval",
      "title": "Reserve your business name",
      "office": "Ministry of Corporate Affairs (MCA)",
      "description": "Plain-language explanation of what this step is and why it exists.",
      "documentsNeeded": ["Proposed name(s)", "Identity proof of applicant"],
      "fee": "₹1,000",
      "estimatedTime": "1–2 working days",
      "eligibility": "Any proposed entity name not already registered or trademarked.",
      "sourceUrl": "https://www.mca.gov.in/...",
      "lastVerifiedAt": "2026-08-01",
      "dependsOn": [],
      "tier": 0
    }
  ]
}
```
`tier` is computed server-side by `graphBuilder.js` — the frontend never
recomputes it, so both sides always agree on layout order.

**404** → `{ "error": "Unknown task id" }`

## `POST /api/tasks/resolve`
Natural-language lookup: turns a free-text description + location into a task id
(loose keyword match in this scaffold; a real NLP/LLM matcher is a drop-in
replacement behind this same endpoint).

Request:
```json
{ "description": "I want to open a small shop", "location": "India" }
```
**200** → `{ "taskId": "register-small-business-in", "confidence": 0.82 }`
**200** (no match) → `{ "taskId": null, "confidence": 0, "suggestions": ["register-small-business-in"] }`

## `GET /api/admin/tasks/:taskId`
Same shape as `GET /api/tasks/:taskId`, but includes unpublished drafts (`status: "draft"` steps are excluded from the public endpoint).

## `PUT /api/admin/tasks/:taskId/steps/:stepId`
Update one step's fields (any subset of the schema in `backend/models/schema.md`).
Server re-validates the whole graph (no cycles, no dangling `dependsOn`) before
persisting; an edit that breaks the graph is rejected.

Request body: partial step object, e.g. `{ "fee": "₹1,500", "lastVerifiedAt": "2026-09-20" }`

**200** → the updated, re-validated full task graph (same shape as `GET /api/tasks/:taskId`)
**400** → `{ "error": "Would create a cycle: name-approval -> pan-application -> name-approval" }`

## `POST /api/admin/tasks/:taskId/steps`
Add a new step. Same validation as `PUT`.

## `DELETE /api/admin/tasks/:taskId/steps/:stepId`
Removes a step. Rejected with **400** if another step's `dependsOn` still
references it.

## Error shape
Every non-2xx response is `{ "error": "human-readable message" }`.
