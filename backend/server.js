const express = require("express");
const cors = require("cors");
const tasksRouter = require("./routes/tasks");
const adminRouter = require("./routes/admin");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/tasks", tasksRouter);
app.use("/api/admin", adminRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Civic Task Navigator API listening on http://localhost:${PORT}`);
});
