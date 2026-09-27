// Load backend/.env (ANTHROPIC_API_KEY etc.) if present. Uses Node's built-in
// loader (no dotenv dependency needed) — safe to skip if the file doesn't
// exist, e.g. before Level 2 is set up, so Level 1 (rule-based) still runs.
try {
  process.loadEnvFile(require("path").join(__dirname, ".env"));
} catch (err) {
  // No backend/.env yet — fine for Level 1. Level 2's /api/chat route
  // reports this itself (as a 501) if ANTHROPIC_API_KEY is missing.
}

const express = require("express");
const cors = require("cors");
const tasksRouter = require("./routes/tasks");
const adminRouter = require("./routes/admin");
const chatRouter = require("./routes/chat");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/tasks", tasksRouter);
app.use("/api/admin", adminRouter);
app.use("/api/chat", chatRouter); // Level 2 extension point — see backend/routes/chat.js

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Civic Task Navigator API listening on http://localhost:${PORT}`);
});
