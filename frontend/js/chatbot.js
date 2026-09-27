
Chatbot · JS
/**
 * chatbot.js
 * ---------------------------------------------------------------
 * Level 1: a smart rule-based chatbot for the 4 existing tasks.
 * Built with the Level 2/3 upgrade path in mind — see CONFIG and
 * getReply() below for the exact seam a future LLM call plugs into.
 *
 * No API key, no LLM call — just keyword matching + a small set of
 * question-type rules, running entirely against the same API.js
 * that the rest of the app uses (so it works in both "Live backend"
 * and "Demo data" mode automatically).
 *
 * Owns: the floating chat widget (button + panel) and everything in
 * this file. It injects its own DOM, so no other file needs to
 * change for it to work — just add <script src="js/chatbot.js">
 * after api.js in index.html (and admin.html if wanted).
 *
 * UPGRADE NOTES (read this before starting Level 2 or 3):
 *
 * Level 2 (LLM chatbot):
 *   - Flip CONFIG.mode to "llm" and implement callLlmBackend() below.
 *   - Do NOT call an LLM API directly from this file with a client-side
 *     key — add a backend route (e.g. backend/routes/chat.js, mounted
 *     in server.js next to /api/tasks) that holds the API key server-side,
 *     and have callLlmBackend() POST to it. Send `history` (already
 *     tracked below) plus the matched task's JSON as grounding context,
 *     so the model answers from your real data instead of guessing.
 *   - getReply() already tries the configured responder first and falls
 *     back to the rule engine on any failure — keep that fallback when
 *     you wire in the LLM call, so the widget still works if the API
 *     is down or a key isn't set.
 *
 * Level 3 (advanced):
 *   - Location-aware: the main form already collects state/city
 *     (#state-input, #city-input) — read them into CONFIG.location and
 *     pass along with the LLM request, or use them to filter step data.
 *   - Official-source searching: backend/services/webSearch.js and
 *     backend/data/officialSources.json already exist for this — a new
 *     backend route can call searchOfficialWeb() and return citations
 *     alongside the answer.
 *   - Longer-term memory: `history` here only lives for the page session.
 *     Persist it the same way progress-tracker.js and search-history.js
 *     already persist their state, if you want it to survive a reload.
 * ---------------------------------------------------------------
 */
(function () {
  // ---- 0. Config — the one flag Level 2 flips ---------------------------
  const CONFIG = {
    mode: "llm", // "rule" (Level 1) | "llm" (Level 2). getReply() falls back
                 // to "rule" automatically if the backend errors or 501s
                 // (e.g. no ANTHROPIC_API_KEY set yet), so this is safe to
                 // leave on even before backend/.env is configured.
    llmEndpoint: "/api/chat" // backend route; never call an LLM API directly from the browser
  };
 
  // Rolling transcript, kept independent of the rule engine's own
  // taskId/stepId memory below. Not used by Level 1 logic today, but
  // this is exactly what a Level 2 LLM call needs to answer follow-ups
  // ("and how much does that cost?") — so it's tracked from day one.
  const MAX_HISTORY = 12;
  const history = [];
  function pushHistory(role, text) {
    history.push({ role, text });
    if (history.length > MAX_HISTORY) history.shift();
  }
 
  // ---- 1. Hand-curated aliases for the 4 known tasks -------------------
  // Keep this mirrored with task ids in backend/data/tasks.json. Adding a
  // 5th task later just means adding one more entry here.
  const TASK_ALIASES = {
    "register-small-business-in": [
      "business", "small business", "company", "startup", "shop", "enterprise",
      "register a business", "registering a business", "msme", "udyam",
      "incorporate", "incorporation", "llp", "pvt ltd", "private limited",
      "proprietorship", "gst", "trade license", "trade licence"
    ],
    "apply-passport-in": [
      "passport", "travel document", "psk", "passport seva",
      "renew passport", "renew my passport", "apply for a passport", "visa"
    ],
    "apply-pan-in": [
      "pan", "pan card", "permanent account number", "tax id", "income tax pan"
    ],
    "apply-driving-license-in": [
      "driving licence", "driving license", "driver's license", "drivers license",
      "dl", "learner's licence", "learners licence", "learner licence",
      "learner's license", "rto", "driving test"
    ]
  };
 
  const STOPWORDS = new Set([
    "the", "and", "for", "with", "this", "that", "your", "from", "have",
    "what", "when", "where", "does", "how", "much", "long", "will", "need",
    "about", "into", "step", "steps", "task", "tasks", "apply", "application"
  ]);
 
  // Short acronyms that would otherwise be dropped by the length filter
  // but are highly distinctive (worth more than an ordinary word match).
  const ACRONYMS = new Set(["gst", "pan", "dl", "rto"]);
 
  // ---- 2. Question-type patterns, most specific first -------------------
  const QUESTION_TYPES = [
    { type: "documents", re: /\b(document|documents|papers|paperwork|proof|id proof|what.*(need|bring|carry))\b/i },
    { type: "fee", re: /\b(fee|fees|cost|price|charge|charges|how much)\b/i },
    { type: "time", re: /\b(how long|duration|turnaround|takes?|days?\b|weeks?\b)\b/i },
    { type: "office", re: /\b(where|office|department|authority|whom|which office|who do i)\b/i },
    { type: "eligibility", re: /\b(eligib|who can|qualify|allowed to)\b/i },
    { type: "next", re: /\b(next|after (this|that)|then what|what.*next)\b/i },
    { type: "count", re: /\b(how many steps|number of steps)\b/i },
    { type: "overview", re: /\b(steps|procedure|process|how do i|walk me through|guide|what.*do i (need to )?do)\b/i }
  ];
 
  const GREETING_RE = /^\s*(hi|hello|hey|hola|namaste|yo)\b/i;
  const THANKS_RE = /\b(thanks|thank you|thx|cheers)\b/i;
  const BYE_RE = /\b(bye|goodbye|see ya|that'?s all)\b/i;
  const HELP_RE = /\b(help|what can you do|what do you do|capabilities)\b/i;
  const LIST_RE = /\b(what tasks|list (of )?tasks|what (all )?can i ask|options|what topics)\b/i;
 
  // ---- 3. Small in-memory cache of all 4 tasks (full step detail) ------
  let taskCache = null; // { [taskId]: task }
  let loadPromise = null;
 
  function loadAllTasks() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      const summaries = await API.listTasks();
      const full = await Promise.all(summaries.map((t) => API.getTask(t.id)));
      taskCache = Object.fromEntries(full.map((t) => [t.id, t]));
      return taskCache;
    })();
    return loadPromise;
  }
 
  function words(str) {
    return (str || "")
      .toLowerCase()
      .split(/[^a-z0-9']+/)
      .filter((w) => (w.length > 3 || ACRONYMS.has(w)) && !STOPWORDS.has(w));
  }
 
  // Crude 6-char-prefix stemming — just enough to treat "register" and
  // "registration" (or "document"/"documents") as the same word, without
  // pulling in a real stemming library for a rule-based Level 1 bot.
  function stem(word) {
    return word.length <= 6 ? word : word.slice(0, 6);
  }
 
  // Words in a step's title that also show up in its own task's title
  // (e.g. "business" inside every step of "Register a small business")
  // aren't distinctive — matching on them would make every step of a
  // task look equally relevant. Strip those before scoring a step.
  function distinctiveStepWords(step, task) {
    const titleStems = new Set(words(task.title).map(stem));
    return words(step.title)
      .map((w) => ({ word: w, stem: stem(w) }))
      .filter((o) => !titleStems.has(o.stem));
  }
 
  function matchTask(text) {
    const needle = text.toLowerCase();
    let best = null, bestScore = 0;
    for (const task of Object.values(taskCache)) {
      let score = 0;
      for (const alias of TASK_ALIASES[task.id] || []) {
        if (needle.includes(alias)) score += 2;
      }
      for (const w of words(task.title)) {
        if (needle.includes(w)) score += 1;
      }
      if (score > bestScore) { bestScore = score; best = task; }
    }
    return bestScore > 0 ? best : null;
  }
 
  function scoreStep(step, task, needle) {
    let score = 0;
    for (const { word, stem: s } of distinctiveStepWords(step, task)) {
      if (needle.includes(s)) score += ACRONYMS.has(word) ? 2 : 1;
    }
    return score;
  }
 
  // Search every step of every task for a title match, regardless of
  // whether the task itself was named this turn — lets people jump
  // straight to "what documents do I need for GST registration".
  function matchStepGlobal(text) {
    const needle = text.toLowerCase();
    let best = null, bestScore = 0, bestTask = null;
    for (const task of Object.values(taskCache)) {
      for (const step of task.steps) {
        const score = scoreStep(step, task, needle);
        if (score > bestScore) { bestScore = score; best = step; bestTask = task; }
      }
    }
    return bestScore >= 2 ? { task: bestTask, step: best } : null;
  }
 
  function matchStepWithinTask(text, task) {
    const needle = text.toLowerCase();
    let best = null, bestScore = 0;
    for (const step of task.steps) {
      const score = scoreStep(step, task, needle);
      if (score > bestScore) { bestScore = score; best = step; }
    }
    return bestScore > 0 ? best : null;
  }
 
  function matchQuestionType(text) {
    for (const { type, re } of QUESTION_TYPES) {
      if (re.test(text)) return type;
    }
    return null;
  }
 
  function taskListSentence() {
    return Object.values(taskCache).map((t) => `“${t.title}”`).join(", ");
  }
 
  function stepsInOrder(task) {
    return [...task.steps].sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
  }
 
  // ---- 4. Reply composition ---------------------------------------------
  const session = { taskId: null, stepId: null };
 
  // ---- Level 1 rule engine entry point -----------------------------------
  function ruleBasedReply(rawText) {
    const text = rawText.trim();
    if (!text) return "Type a question and I'll do my best — try “what documents do I need for a passport?”";
 
    if (GREETING_RE.test(text) && text.length < 20) {
      return `Hi! I can walk you through: ${taskListSentence()}. What are you trying to get done?`;
    }
    if (THANKS_RE.test(text)) {
      return "You're welcome! Anything else — fees, documents, timing, or what comes next?";
    }
    if (BYE_RE.test(text)) {
      return "Good luck with the paperwork — come back anytime you get stuck on a step.";
    }
    if (HELP_RE.test(text) || LIST_RE.test(text)) {
      return `I can answer questions about these tasks: ${taskListSentence()}.\n\nAsk me things like:\n• “What documents do I need to register a business?”\n• “How much does a passport cost?”\n• “Where do I go for the driving test?”\n• “What's next after I get my learner's licence?”`;
    }
 
    // A named task always wins first — this avoids a step in the wrong
    // task's list (e.g. "Apply for a business PAN", inside the business
    // task) accidentally hijacking a question that's really about the
    // dedicated "Apply for a PAN card" task. Cross-task step search is
    // only used as a fallback when no task could be identified at all.
    const taskHit = matchTask(text);
    const stepHit = taskHit ? null : matchStepGlobal(text);
 
    let task = taskHit || (stepHit && stepHit.task) || (session.taskId && taskCache[session.taskId]);
    if (!task) {
      return `I didn't catch which task that's about. I can help with: ${taskListSentence()}. Which one do you mean?`;
    }
 
    // If a *different* task got named this turn, drop any old step context.
    const taskChanged = session.taskId && session.taskId !== task.id;
    let step = stepHit
      ? stepHit.step
      : (taskHit ? matchStepWithinTask(text, task) : null);
    if (!step && !taskChanged && session.stepId) {
      step = task.steps.find((s) => s.id === session.stepId) || null;
    }
 
    session.taskId = task.id;
    session.stepId = step ? step.id : null;
 
    const qType = matchQuestionType(text) || "overview";
    return step
      ? replyForStep(task, step, qType)
      : replyForTask(task, qType, rawText);
  }
 
  function replyForStep(task, step, qType) {
    const head = `${step.title} (${task.title})`;
    switch (qType) {
      case "documents":
        return step.documentsNeeded && step.documentsNeeded.length
          ? `Documents needed for “${step.title}”:\n${bulletList(step.documentsNeeded)}`
          : `No documents are listed for “${step.title}” — it doesn't require paperwork of its own.`;
      case "fee":
        return `The fee for “${step.title}” is ${step.fee}.`;
      case "time":
        return `“${step.title}” typically takes ${step.estimatedTime}.`;
      case "office":
        return `“${step.title}” is handled by: ${step.office}.`;
      case "eligibility":
        return `Eligibility for “${step.title}”: ${step.eligibility}.`;
      case "count":
        return `That's a single step, not a set — ask me about the whole “${task.title}” roadmap for the full count.`;
      case "next": {
        const unlocks = task.steps.filter((s) => (s.dependsOn || []).includes(step.id));
        return unlocks.length
          ? `After “${step.title}”, you can move on to: ${unlocks.map((s) => `“${s.title}”`).join(", ")}.`
          : `“${step.title}” doesn't unlock any further steps in this roadmap — it may be one of the last ones, or run in parallel with others.`;
      }
      default:
        return `${head}\n${step.description}\n\nFee: ${step.fee} · Typical time: ${step.estimatedTime} · Office: ${step.office}\n\nAsk me about documents, eligibility, or what comes after this step.`;
    }
  }
 
  function replyForTask(task, qType, rawText) {
    const ordered = stepsInOrder(task);
    switch (qType) {
      case "documents": {
        const withDocs = ordered.filter((s) => s.documentsNeeded && s.documentsNeeded.length);
        return withDocs.length
          ? `Documents needed for “${task.title}”, by step:\n${withDocs.map((s) => `• ${s.title}: ${s.documentsNeeded.join(", ")}`).join("\n")}`
          : `None of the steps in “${task.title}” list specific documents.`;
      }
      case "fee":
        return `Fees for “${task.title}”, by step:\n${ordered.map((s) => `• ${s.title}: ${s.fee}`).join("\n")}`;
      case "time":
        return `Typical timing for “${task.title}”, by step:\n${ordered.map((s) => `• ${s.title}: ${s.estimatedTime}`).join("\n")}`;
      case "office":
        return `Who handles each step of “${task.title}”:\n${ordered.map((s) => `• ${s.title}: ${s.office}`).join("\n")}`;
      case "eligibility":
        return `Eligibility varies by step for “${task.title}”. Ask me about a specific one, e.g. “${ordered[0].title}”.`;
      case "count":
        return `“${task.title}” has ${task.steps.length} steps.`;
      case "next":
        return `The first step${ordered.filter((s) => (s.tier ?? 0) === 0).length > 1 ? "s are" : " is"}: ${ordered.filter((s) => (s.tier ?? 0) === 0).map((s) => `“${s.title}”`).join(", ")}. Ask “what's next” again once you tell me which step you're on.`;
      default:
        return `${task.title}: ${task.summary}\n\nSteps in order:\n${ordered.map((s, i) => `${i + 1}. ${s.title}`).join("\n")}\n\nAsk me about a specific step, or about documents, fees, timing, eligibility, or what's next.`;
    }
  }
 
  function bulletList(items) {
    return items.map((i) => `• ${i}`).join("\n");
  }
 
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
 
  // Turn "\n" separated plain text + our "•" bullets into safe HTML.
  function formatMessage(text) {
    return escapeHtml(text)
      .split("\n")
      .map((line) => (line.startsWith("• ") ? `<span class="cb-bullet">${line}</span>` : line))
      .join("<br>");
  }
 
  // ---- Level 2: LLM backend -------------------------------------------
  // Posts to backend/routes/chat.js, which holds the API key server-side
  // and grounds the model in the real task JSON. `history` is the rolling
  // transcript tracked above, sent so follow-ups ("how much does that
  // cost?") resolve correctly. Any failure (network error, 501 because
  // ANTHROPIC_API_KEY isn't set, etc.) throws, and getReply() below falls
  // back to the Level 1 rule engine — so this is always safe to leave on.
  async function callLlmBackend(rawText) {
    const res = await fetch(`${API.baseUrl}${CONFIG.llmEndpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: rawText, history })
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || `Chat backend returned ${res.status}`);
    if (!body.reply) throw new Error("Chat backend returned no reply");
    return body.reply;
  }
 
  // Single entry point the widget calls. Whichever mode is configured,
  // this always resolves to a string reply, falling back to the rule
  // engine if the LLM path isn't set up yet or a request fails — so
  // flipping CONFIG.mode back and forth is always safe.
  async function getReply(rawText) {
    await loadAllTasks();
    pushHistory("user", rawText);
    let reply;
    if (CONFIG.mode === "llm") {
      try {
        reply = await callLlmBackend(rawText);
      } catch (err) {
        reply = ruleBasedReply(rawText);
      }
    } else {
      reply = ruleBasedReply(rawText);
    }
    pushHistory("bot", reply);
    return reply;
  }
 
  // ---- 5. Widget UI -------------------------------------------------------
  const SUGGESTIONS = [
    "What documents do I need for a passport?",
    "How much does registering a business cost?",
    "What's next after the learner's licence test?"
  ];
 
  function buildWidget() {
    const root = document.createElement("div");
    root.id = "cb-root";
    root.innerHTML = `
      <button id="cb-toggle" class="cb-toggle" aria-label="Open task assistant">
        <span class="cb-toggle-icon">💬</span>
      </button>
      <div id="cb-panel" class="cb-panel" hidden>
        <div class="cb-header">
          <div>
            <p class="cb-header-title">Task Assistant</p>
            <p class="cb-header-sub">${
              CONFIG.mode === "llm"
                ? "AI-powered · grounded in the loaded tasks"
                : "Rule-based · answers from the 4 loaded tasks"
            }</p>
          </div>
          <button id="cb-close" class="cb-close" aria-label="Close">×</button>
        </div>
        <div id="cb-messages" class="cb-messages"></div>
        <div id="cb-suggestions" class="cb-suggestions"></div>
        <form id="cb-form" class="cb-form">
          <input id="cb-input" class="cb-input" type="text" autocomplete="off"
            placeholder="Ask about fees, documents, timing…" />
          <button type="submit" class="cb-send" aria-label="Send">➤</button>
        </form>
      </div>
    `;
    document.body.appendChild(root);
 
    const toggleBtn = root.querySelector("#cb-toggle");
    const closeBtn = root.querySelector("#cb-close");
    const panel = root.querySelector("#cb-panel");
    const messages = root.querySelector("#cb-messages");
    const suggestionsEl = root.querySelector("#cb-suggestions");
    const form = root.querySelector("#cb-form");
    const input = root.querySelector("#cb-input");
 
    let opened = false;
 
    function addMessage(text, who) {
      const bubble = document.createElement("div");
      bubble.className = `cb-msg cb-msg-${who}`;
      bubble.innerHTML = formatMessage(text);
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    }
 
    function addTyping() {
      const bubble = document.createElement("div");
      bubble.className = "cb-msg cb-msg-bot cb-typing";
      bubble.id = "cb-typing";
      bubble.innerHTML = "<span></span><span></span><span></span>";
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    }
 
    function removeTyping() {
      const el = document.getElementById("cb-typing");
      if (el) el.remove();
    }
 
    function renderSuggestions(list) {
      suggestionsEl.innerHTML = "";
      list.forEach((s) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "cb-chip";
        chip.textContent = s;
        chip.addEventListener("click", () => handleUserText(s));
        suggestionsEl.appendChild(chip);
      });
    }
 
    async function handleUserText(text) {
      addMessage(text, "user");
      input.value = "";
      suggestionsEl.innerHTML = "";
      addTyping();
      try {
        // Tiny artificial delay so the typing indicator reads as real,
        // not just a flash — the rule engine resolves instantly; an
        // LLM call in Level 2 will have real latency here anyway.
        const [reply] = await Promise.all([
          getReply(text),
          new Promise((r) => setTimeout(r, 250))
        ]);
        removeTyping();
        addMessage(reply, "bot");
      } catch (err) {
        removeTyping();
        addMessage(`Couldn't load task data (${err.message}). Try reloading the page.`, "bot");
      }
    }
 
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (text) handleUserText(text);
    });
 
    toggleBtn.addEventListener("click", () => {
      opened = !opened;
      panel.hidden = !opened;
      toggleBtn.setAttribute("aria-expanded", String(opened));
      if (opened && !messages.childElementCount) {
        addMessage(
          "Hi! What are you trying to get done — registering a business, a passport, a PAN card, or a driving licence?",
          "bot"
        );
        renderSuggestions(SUGGESTIONS);
        input.focus();
      }
    });
 
    closeBtn.addEventListener("click", () => {
      opened = false;
      panel.hidden = true;
      toggleBtn.setAttribute("aria-expanded", "false");
    });
  }
 
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
 
  // Small public surface — lets a future backend-integration script (or
  // a console/test session) drive the bot without the floating widget.
  window.ChatBot = {
    getReply,
    resetSession: () => { session.taskId = null; session.stepId = null; history.length = 0; }
  };
})();
 
