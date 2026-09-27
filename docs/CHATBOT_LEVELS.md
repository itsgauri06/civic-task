# Chatbot: levels and upgrade path

## Level 1 — done

`frontend/js/chatbot.js` is a self-contained rule-based chatbot: a floating
widget that injects its own DOM (no other frontend file had to change) and
answers from the same 4 tasks the rest of the app uses, via `API.listTasks()`
/ `API.getTask()`. No API key, no network call beyond your own backend.

```
   index.html
       │
       ├─ api.js  ──────► backend/data/tasks.json (or sample-data.js in demo mode)
       │      ▲
       │      │  (same data source as the graph UI)
       │      │
       └─ chatbot.js ──► getReply(text) ──► ruleBasedReply(text)
                                 │
                                 └─ keyword/alias matching + question-type rules
```

How it decides what to say, per message:
1. Match a task by alias/keyword (`TASK_ALIASES`), or fall back to whichever
   task was last discussed in the session.
2. Within that task, match a specific step by title keywords.
3. Detect the *question type* (documents / fee / timing / office / eligibility
   / what's-next / overview) from a small set of regexes.
4. Pull the answer straight from that step's (or task's) JSON fields.

## Level 2 — the seam is in place, not yet implemented

`chatbot.js` already calls everything through one function, `getReply()`,
which is the only thing that needs to change:

```js
const CONFIG = {
  mode: "rule",           // flip to "llm" once the backend route below exists
  llmEndpoint: "/api/chat"
};
```

`getReply()` tries the configured mode and **falls back to the rule engine on
any failure**, so switching `mode` back and forth is always safe — you'll
never end up with a widget that just breaks.

A matching backend stub already exists: `backend/routes/chat.js`, mounted at
`POST /api/chat` in `server.js`. It currently just returns a 501. To finish
Level 2:

1. Add your LLM API key to `backend/.env` — **never** put it in frontend code.
2. In `backend/routes/chat.js`, call the LLM SDK with the request body
   (`{ message, history }`) plus the relevant task JSON as grounding context,
   so it answers from your real fees/documents/offices instead of guessing.
3. Return `{ reply: "..." }`.
4. In `chatbot.js`, implement `callLlmBackend()` to `fetch(CONFIG.llmEndpoint, …)`
   and flip `CONFIG.mode` to `"llm"`.

`chatbot.js` already keeps a rolling `history` array (last 12 turns) for
exactly this — Level 1 doesn't use it, but it's there so follow-up questions
work once an LLM is answering.

## Level 3 — building blocks that already exist elsewhere in this repo

- **Location-aware answers**: the main form already collects state/city
  (`#state-input`, `#city-input`). Level 3 just needs to read those into the
  chat request.
- **Official-source searching**: `backend/services/webSearch.js` +
  `backend/data/officialSources.json` already implement keyword/state-filtered
  lookup of official sources — a Level 3 `/api/chat` can call
  `searchOfficialWeb()` and return citations alongside the answer, the same
  way `routes/tasks.js`'s `/search-test` endpoint already does.
- **Persistent memory across page reloads**: `history` in `chatbot.js` only
  lives for the current page session. Persist it the same way
  `progress-tracker.js` and `search-history.js` already persist their state
  if you want chats to survive a reload.
