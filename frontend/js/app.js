
(async function () {
  const els = {
    form: document.getElementById("task-form"),
    input: document.getElementById("task-input"),
    state: document.getElementById("state-input"),
    city: document.getElementById("city-input"),
    resultArea: document.getElementById("result-area"),
    emptyState: document.getElementById("empty-state"),
    taskTitle: document.getElementById("task-title"),
    taskSummary: document.getElementById("task-summary"),
    progressFill: document.getElementById("progress-fill"),
    progressLabel: document.getElementById("progress-label"),
    graphContainer: document.getElementById("graph-container"),
    drawer: document.getElementById("step-drawer"),
    drawerClose: document.getElementById("drawer-close"),
    historyPanel: document.getElementById("search-history"),
    historyList: document.getElementById("search-history-list"),
    historyClear: document.getElementById("search-history-clear"),
  };

  let currentTask = null;
  let selectedStepId = null;


  els.form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const description = els.input.value.trim();
    const state = els.state.value.trim() || "Maharashtra";
    const city = els.city.value.trim() || "Mumbai";

    if (!description) {
      alert("Please enter what you want to do.");
      return;
    }

    setLoading(true);

    try {
      const { taskId, suggestions } = await API.resolveTask(
        description,
        state,
        city
      );
      if (!taskId) {
        setLoading(false);
        SearchHistory.add({
          query: description,
          location: `${city}, ${state}`,
          taskId: null,
          matched: false
        });
        renderHistory();
        alert(
          "Couldn't match that to a task in this demo yet. Try: \"register a small business\"."
        );
        return;
      }
      currentTask = await API.getTask(taskId);
      selectedStepId = null;
      SearchHistory.add({
        query: description,
        location: `${city}, ${state}`,
        taskId,
        matched: true
      });
      renderHistory();
      renderTask();
    } catch (err) {
      setLoading(false);
      alert(`Something went wrong: ${err.message}`);
    }
  });

  els.drawerClose.addEventListener("click", closeDrawer);
  document.getElementById("drawer-backdrop").addEventListener("click", closeDrawer);

  els.historyClear.addEventListener("click", () => {
    SearchHistory.clear();
    renderHistory();
  });

  renderHistory();

  function renderHistory() {
    const entries = SearchHistory.getAll();
    els.historyPanel.hidden = entries.length === 0;
    if (entries.length === 0) {
      els.historyList.innerHTML = "";
      return;
    }

    els.historyList.innerHTML = entries
      .map(
        (e) => `
      <li class="history-chip ${e.matched ? "" : "history-chip-unmatched"}" data-id="${e.id}" tabindex="0" role="button">
        <span class="history-chip-query">${escapeHtml(e.query)}</span>
        <span class="history-chip-meta">${escapeHtml(e.location || "India")} · ${timeAgo(e.at)}</span>
        <button class="history-chip-remove" data-remove="${e.id}" aria-label="Remove from history">×</button>
      </li>`
      )
      .join("");

    els.historyList.querySelectorAll(".history-chip").forEach((chip) => {
      const rerun = () => {
        const entry = entries.find((e) => e.id === chip.dataset.id);
        if (!entry) return;

        els.input.value = entry.query;

        const parts = (entry.location || "").split(",");
        els.city.value = parts[0]?.trim() || "Mumbai";
        els.state.value = parts[1]?.trim() || "Maharashtra";

        els.form.requestSubmit();
      };
      chip.addEventListener("click", (evt) => {
        if (evt.target.closest(".history-chip-remove")) return;
        rerun();
      });
      chip.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          rerun();
        }
      });
    });

    els.historyList.querySelectorAll(".history-chip-remove").forEach((btn) => {
      btn.addEventListener("click", (evt) => {
        evt.stopPropagation();
        SearchHistory.remove(btn.dataset.remove);
        renderHistory();
      });
    });
  }

  function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  }

  function setLoading(isLoading) {
    els.form.querySelector("button").disabled = isLoading;
    els.form.querySelector("button").textContent = isLoading ? "Loading…" : "Show me the steps";
  }

  function renderTask() {
    setLoading(false);
    els.emptyState.hidden = true;
    els.resultArea.hidden = false;
    els.taskTitle.textContent = currentTask.title;
    els.taskSummary.textContent = currentTask.summary;
    drawGraph();
    updateProgress();
  }

  function drawGraph() {
    const done = ProgressTracker.getDone(currentTask.id);
    GraphRenderer.render(els.graphContainer, currentTask.steps, done, openDrawer, selectedStepId);
  }

  function updateProgress() {
    const done = ProgressTracker.getDone(currentTask.id);
    const total = currentTask.steps.length;
    const pct = total ? Math.round((done.size / total) * 100) : 0;
    els.progressFill.style.width = `${pct}%`;
    els.progressLabel.textContent = `${done.size} of ${total} steps done`;
  }

  function openDrawer(stepId) {
    selectedStepId = stepId;
    const step = currentTask.steps.find((s) => s.id === stepId);
    const done = ProgressTracker.getDone(currentTask.id);
    const unlocked = ProgressTracker.isUnlocked(step, done);
    const isDone = done.has(step.id);

    const blockedNote =
      !unlocked && !isDone
        ? `<p class="drawer-blocked">Complete its prerequisites first, or mark it done anyway if you've done this out of order.</p>`
        : "";

    els.drawer.innerHTML = `
      <button id="drawer-close" class="drawer-close" aria-label="Close">×</button>
      <p class="drawer-office">${escapeHtml(step.office)}</p>
      <h3>${escapeHtml(step.title)}</h3>
      <p class="drawer-desc">${escapeHtml(step.description)}</p>
      ${blockedNote}
      <dl class="drawer-facts">
        <dt>Fee</dt><dd>${escapeHtml(step.fee)}</dd>
        <dt>Typical time</dt><dd>${escapeHtml(step.estimatedTime)}</dd>
        <dt>Eligibility</dt><dd>${escapeHtml(step.eligibility)}</dd>
      </dl>
      ${step.documentsNeeded && step.documentsNeeded.length
        ? `<p class="drawer-label">Documents needed</p>
             <ul class="drawer-docs">${step.documentsNeeded.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>`
        : ""
      }
      <a class="drawer-source" href="${step.sourceUrl}" target="_blank" rel="noopener">
        Verify on the official source ↗
      </a>
      <p class="drawer-verified">Last verified ${escapeHtml(step.lastVerifiedAt)}</p>
      <button class="drawer-toggle-done ${isDone ? "is-done" : ""}" id="toggle-done">
        ${isDone ? "Marked done — undo" : "Mark this step done"}
      </button>
    `;
    els.drawer.classList.add("open");
    document.getElementById("drawer-backdrop").classList.add("open");
    els.drawer.querySelector("#drawer-close").addEventListener("click", closeDrawer);
    els.drawer.querySelector("#toggle-done").addEventListener("click", () => {
      ProgressTracker.toggle(currentTask.id, step.id);
      drawGraph();
      updateProgress();
      openDrawer(step.id); // refresh drawer contents
    });
    drawGraph(); // re-render to show the "selected" outline
  }

  function closeDrawer() {
    selectedStepId = null;
    els.drawer.classList.remove("open");
    document.getElementById("drawer-backdrop").classList.remove("open");
    if (currentTask) drawGraph();
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();