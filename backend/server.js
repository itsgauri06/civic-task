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
