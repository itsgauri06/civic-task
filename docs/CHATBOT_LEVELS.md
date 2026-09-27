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

## Level 2 — done

`chatbot.js` calls everything through one function, `getReply()`:

```js
const CONFIG = {
  mode: "llm",             // "rule" (Level 1) | "llm" (Level 2)
  llmEndpoint: "/api/chat"
};
```

`getReply()` tries the configured mode and **falls back to the rule engine on
any failure**, so switching `mode` back and forth (or leaving `ANTHROPIC_API_KEY`
unset) is always safe — you'll never end up with a widget that just breaks.

```
   chatbot.js (mode: "llm")
       │
       ├─ callLlmBackend(text) ──► POST {API.baseUrl}/api/chat
       │        { message, history }        │
       │                                     ▼
       │                          backend/routes/chat.js
       │                            - loads backend/data/tasks.json
       │                            - builds a system prompt: "answer only
       │                              from this JSON, don't invent facts"
       │                            - calls the Anthropic Messages API
       │                              with the ANTHROPIC_API_KEY from
       │                              backend/.env (never sent to the browser)
       │                                     │
       │                          ◄──────────┘ { reply }
       ▼
  on any error/501 → ruleBasedReply(text)   (Level 1, unchanged)
```

To turn it on:

1. `cp backend/.env.example backend/.env` and add your `ANTHROPIC_API_KEY`.
   Without this, `/api/chat` returns 501 and the widget quietly runs in
   Level 1 mode — nothing breaks.
2. `npm start` in `backend/` (picks up `backend/.env` automatically via
   `process.loadEnvFile()` — no extra dependency).

The whole 4-task dataset (~16KB) is sent as grounding context on every
request rather than pre-selecting a subset — small enough that it's simpler
and more accurate than trying to guess which task a message is about before
calling the model. The system prompt instructs the model to answer only from
that JSON and to point to a step's `sourceUrl` rather than invent facts.

`history` (the rolling last-12-turns array `chatbot.js` already tracked in
Level 1) is now sent with every request so follow-ups like "how much does
that cost?" resolve correctly.

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