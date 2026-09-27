const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const DATA_PATH = path.join(__dirname, "..", "data", "tasks.json");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
// Cheap + fast model — plenty for a grounded FAQ bot over ~4 small tasks.
// Override with ANTHROPIC_MODEL in backend/.env if you want a bigger model.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const MAX_HISTORY_TURNS = 12; // mirrors frontend/js/chatbot.js's MAX_HISTORY

function loadTasks() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}

// Grounding is just "hand the model the real data and tell it not to
// improvise" — the whole dataset is ~16KB (4 tasks), so there's no need to
// pre-select a subset the way the Level 1 rule engine has to.
function buildSystemPrompt(tasks) {
  return [
    "You are the chat assistant on a civic-task website that walks users",
    "through Indian government procedures: registering a small business,",
    "applying for a passport, applying for a PAN card, and applying for a",
    "driving licence.",
    "",
    "Answer ONLY from the TASK DATA JSON below — it is the single source of",
    "truth for steps, fees, documents, offices, timing, and eligibility.",
    "Never invent a fee, document, office, or URL that isn't in the data.",
    "If someone asks about something the data doesn't cover (a task that",
    "isn't listed, or a detail a step doesn't have), say so plainly and, if a",
    "relevant step has a sourceUrl, point them to it instead of guessing.",
    "",
    "Keep replies short and conversational — a few sentences, or a short",
    "plain-text bullet list (using \"- \") for multi-part answers like a list",
    "of documents. No markdown headers or bold. Refer to tasks and steps by",
    "their titles, not their internal ids. Use the conversation history to",
    "resolve follow-ups like \"how much does that cost?\".",
    "",
    "TASK DATA (JSON):",
    JSON.stringify(tasks),
  ].join("\n");
}

/**
 * POST /api/chat — Level 2: LLM-backed chatbot.
 *
 * frontend/js/chatbot.js calls this whenever CONFIG.mode is "llm", and
 * falls back to its own rule engine if this errors — so it's safe to leave
 * ANTHROPIC_API_KEY unset (this just returns 501) or to have this route
 * fail transiently.
 *
 * Request body:  { message: string, history?: [{ role: "user"|"bot", text: string }] }
 * Response body: { reply: string }
 */
router.post("/", async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(501).json({
        error:
          "ANTHROPIC_API_KEY is not set. Copy backend/.env.example to backend/.env " +
          "and add your key to enable the LLM chatbot.",
      });
    }

    const { message, history } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Request body must include a non-empty 'message' string." });
    }

    // The frontend's history uses {role: "user"|"bot", text}; the Anthropic
    // API wants {role: "user"|"assistant", content}.
    const priorTurns = (Array.isArray(history) ? history : [])
      .filter((h) => h && typeof h.text === "string" && (h.role === "user" || h.role === "bot"))
      .slice(-MAX_HISTORY_TURNS)
      .map((h) => ({ role: h.role === "bot" ? "assistant" : "user", content: h.text }));

    const messages = [...priorTurns, { role: "user", content: message }];

    const tasks = loadTasks();

    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: buildSystemPrompt(tasks),
        messages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      return res.status(502).json({ error: "The LLM backend request failed." });
    }

    const data = await response.json();
    const reply = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!reply) {
      return res.status(502).json({ error: "The LLM backend returned an empty reply." });
    }

    res.json({ reply });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    res.status(500).json({ error: "Unexpected error handling chat request." });
  }
});

module.exports = router;
