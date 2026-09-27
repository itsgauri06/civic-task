const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const DATA_PATH = path.join(__dirname, "..", "data", "tasks.json");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL =
  process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

const MAX_HISTORY_TURNS = 12;

const TASK_ALIASES = {
  "register-small-business-in": [
    "business",
    "small business",
    "company",
    "startup",
    "shop",
    "enterprise",
    "msme",
    "udyam",
    "incorporate",
    "incorporation",
    "llp",
    "pvt ltd",
    "private limited",
    "proprietorship",
    "gst",
    "trade license",
    "trade licence",
  ],

  "apply-passport-in": [
    "passport",
    "travel document",
    "psk",
    "passport seva",
    "renew passport",
    "renew my passport",
    "apply for a passport",
  ],

  "apply-pan-in": [
    "pan",
    "pan card",
    "permanent account number",
    "tax id",
    "income tax pan",
  ],

  "apply-driving-license-in": [
    "driving licence",
    "driving license",
    "driver's license",
    "drivers license",
    "learner's licence",
    "learners licence",
    "learner licence",
    "learner's license",
    "rto",
    "driving test",
  ],
};

function loadTasks() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}

function findRelevantTasks(message, tasks) {
  const text = message.toLowerCase();

  const scored = tasks.map((task) => {
    let score = 0;

    for (const alias of TASK_ALIASES[task.id] || []) {
      if (text.includes(alias)) {
        score += alias.length > 5 ? 2 : 1;
      }
    }

    if (text.includes(task.title.toLowerCase())) {
      score += 3;
    }

    return { task, score };
  });

  const hits = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return hits.length
    ? hits.slice(0, 2).map((x) => x.task)
    : tasks;
}

function buildSystemPrompt(allTasks, relevantTasks, location) {
  const locationLine =
    location && (location.state || location.city)
      ? `The user entered this location for context: ${
          location.city || ""
        }${location.city && location.state ? ", " : ""}${
          location.state || ""
        }. Do not invent location-specific rules; use the task data only.`
      : "No user location was provided.";

  return [
    "You are the Task Assistant for a civic-task website covering a small, fixed dataset of Indian government procedures.",
    "",

    "GROUNDING RULES — STRICT:",

    "1. Answer only from the supplied TASK DATA. It is the source of truth for this demo.",

    "2. Never invent or estimate a fee, processing time, document, eligibility rule, office, prerequisite, or URL.",

    "3. If the requested detail is not present in the data, say that the demo does not list that detail. Do not fill the gap from general knowledge.",

    "4. If the user asks about a task that is not in the dataset, say which tasks are supported and ask which one they mean.",

    "5. Use dependsOn to answer prerequisite / previous-step / next-step questions. Do not claim that two steps are sequential unless the data shows that dependency.",

    "6. Distinguish a task from a step. If a question names a step such as GST registration, answer that step inside the business roadmap unless the user clearly asks for the separate PAN task.",

    "7. For follow-up questions such as 'how much is that?' use the conversation history to resolve the current task/step.",

    "8. Do not give personalized legal, tax, financial, or immigration advice. You can report what this demo's data says.",

    "9. Keep answers concise and useful. For lists, use plain '-' bullets. Do not use markdown tables or headings.",

    "10. Do not print raw URLs. When an official source is available, say 'Official source available below.' The frontend will render the verified source link separately.",

    "",

    locationLine,

    "",

    "RELEVANT TASK DATA:",
    JSON.stringify(relevantTasks),

    "",

    "FULL TASK CATALOG (use this only to resolve an ambiguous task name or tell the user what is supported):",
    JSON.stringify(
      allTasks.map((t) => ({
        id: t.id,
        title: t.title,
        summary: t.summary,
      }))
    ),
  ].join("\n");
}

router.post("/", async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(501).json({
        error:
          "ANTHROPIC_API_KEY is not set. Copy backend/.env.example to backend/.env and add your key to enable the LLM chatbot.",
      });
    }

    const { message, history, location } = req.body || {};

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error:
          "Request body must include a non-empty 'message' string.",
      });
    }

    const allTasks = loadTasks();

    const relevantTasks = findRelevantTasks(
      message,
      allTasks
    );

    const priorTurns = (
      Array.isArray(history) ? history : []
    )
      .filter(
        (h) =>
          h &&
          typeof h.text === "string" &&
          (h.role === "user" || h.role === "bot")
      )
      .slice(-MAX_HISTORY_TURNS)
      .map((h) => ({
        role:
          h.role === "bot" ? "assistant" : "user",
        content: h.text.slice(0, 2000),
      }));

    const messages = [
      ...priorTurns,
      {
        role: "user",
        content: message.trim(),
      },
    ];

    const response = await fetch(
      ANTHROPIC_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },

        body: JSON.stringify({
          model: MODEL,

          max_tokens: 600,

          system: buildSystemPrompt(
            allTasks,
            relevantTasks,
            location
          ),

          messages,
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();

      console.error(
        "Anthropic API error:",
        response.status,
        errBody
      );

      return res.status(502).json({
        error: "The LLM backend request failed.",
      });
    }

    const data = await response.json();

    const reply = (data.content || [])
      .filter(
        (block) => block.type === "text"
      )
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!reply) {
      return res.status(502).json({
        error:
          "The LLM backend returned an empty reply.",
      });
    }

    const sources = [
      ...new Map(
        relevantTasks
          .flatMap(
            (task) => task.steps || []
          )
          .filter((step) =>
            /^https?:\/\//i.test(
              step.sourceUrl || ""
            )
          )
          .map((step) => [
            step.sourceUrl,
            {
              title: taskTitleForSource(
                relevantTasks,
                step
              ),
              url: step.sourceUrl,
            },
          ])
      ).values(),
    ];

    res.json({
      reply,
      sources,
    });
  } catch (err) {
    console.error(
      "POST /api/chat error:",
      err
    );

    res.status(500).json({
      error:
        "Unexpected error handling chat request.",
    });
  }
});

function taskTitleForSource(tasks, step) {
  const owner = tasks.find((task) =>
    (task.steps || []).some(
      (s) => s.id === step.id
    )
  );

  return owner
    ? owner.title
    : "Official source";
}

module.exports = router;