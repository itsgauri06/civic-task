(async function () {
  const els = {
    taskSelect: document.getElementById("task-select"),
    stepCount: document.getElementById("step-count"),
    tbody: document.getElementById("admin-tbody"),
    addBtn: document.getElementById("add-step-btn"),
    panel: document.getElementById("edit-panel"),
    backdrop: document.getElementById("edit-backdrop"),
  };

  let currentTask = null;
  const STALE_DAYS = 180;

  const tasks = await API.listTasks();

  els.taskSelect.innerHTML = tasks
    .map(
      (t) =>
        `<option value="${t.id}">${escapeHtml(t.title)} — ${escapeHtml(t.location)}</option>`
    )
    .join("");

  els.taskSelect.addEventListener("change", () =>
    loadTask(els.taskSelect.value)
  );

  await loadTask(tasks[0].id);

  els.addBtn.addEventListener("click", () => openPanel(null));
  els.backdrop.addEventListener("click", closePanel);

  async function loadTask(taskId) {
    currentTask = await API.getAdminTask(taskId);
    renderTable();
  }

  function renderTable() {
    els.stepCount.textContent = `${currentTask.steps.length} steps`;

    els.tbody.innerHTML = currentTask.steps
      .map((step) => {
        const stale = isStale(step.lastVerifiedAt);

        return `
          <tr>
            <td>
              <strong>${escapeHtml(step.title)}</strong>
              <div class="row-id">${escapeHtml(step.id)}</div>
            </td>

            <td>${escapeHtml(step.office)}</td>

            <td>${escapeHtml(step.fee)}</td>

            <td>
              ${escapeHtml(step.lastVerifiedAt)}
              ${stale
            ? '<span class="stale-flag">● needs re-check</span>'
            : ""
          }
            </td>

            <td>
              <span class="status-pill ${step.status}">
                ${step.status}
              </span>
            </td>

            <td class="row-actions">
              <button data-edit="${step.id}">Edit</button>
            </td>
          </tr>
        `;
      })
      .join("");

    els.tbody.querySelectorAll("[data-edit]").forEach((btn) =>
      btn.addEventListener("click", () =>
        openPanel(btn.dataset.edit)
      )
    );
  }

  function isStale(dateStr) {
    const then = new Date(dateStr);
    const days = (Date.now() - then.getTime()) / 86400000;
    return days > STALE_DAYS;
  }

  function openPanel(stepId) {
    const step = stepId
      ? currentTask.steps.find((s) => s.id === stepId)
      : {
        id: "",
        title: "",
        office: "",
        description: "",
        fee: "",
        estimatedTime: "",
        eligibility: "",
        sourceUrl: "",
        lastVerifiedAt: new Date().toISOString().slice(0, 10),
        documentsNeeded: [],
        dependsOn: [],
        status: "draft",
      };

    const isNew = !stepId;

    els.panel.innerHTML = `
      <h3>${isNew ? "Add a step" : "Edit step"}</h3>

      <div id="edit-error-slot"></div>

      <form id="edit-form">

        <div class="edit-field">
          <label>Step id (slug, unique)</label>
          <input
            name="id"
            value="${escapeAttr(step.id)}"
            ${isNew ? "" : "readonly"}
            required
          />
        </div>

        <div class="edit-field">
          <label>Title</label>
          <input
            name="title"
            value="${escapeAttr(step.title)}"
            required
          />
        </div>

        <div class="edit-field">
          <label>Office</label>
          <input
            name="office"
            value="${escapeAttr(step.office)}"
          />
        </div>

        <div class="edit-field">
          <label>Description</label>
          <textarea name="description">${escapeHtml(
      step.description || ""
    )}</textarea>
        </div>

        <div class="edit-field">
          <label>Fee</label>
          <input
            name="fee"
            value="${escapeAttr(step.fee)}"
          />
        </div>

        <div class="edit-field">
          <label>Estimated time</label>
          <input
            name="estimatedTime"
            value="${escapeAttr(step.estimatedTime)}"
          />
        </div>

        <div class="edit-field">
          <label>Eligibility</label>
          <input
            name="eligibility"
            value="${escapeAttr(step.eligibility)}"
          />
        </div>

        <div class="edit-field">
          <label>Documents needed (comma-separated)</label>
          <input
            name="documentsNeeded"
            value="${escapeAttr(
      (step.documentsNeeded || []).join(", ")
    )}"
          />
        </div>

        <div class="edit-field">
          <label>Depends on (step ids, comma-separated)</label>
          <input
            name="dependsOn"
            value="${escapeAttr(
      (step.dependsOn || []).join(", ")
    )}"
          />
        </div>

        <div class="edit-field">
          <label>Source URL</label>
          <input
            name="sourceUrl"
            value="${escapeAttr(step.sourceUrl)}"
          />
        </div>

        <div class="edit-field">
          <label>Last verified (YYYY-MM-DD)</label>
          <input
            name="lastVerifiedAt"
            value="${escapeAttr(step.lastVerifiedAt)}"
          />
        </div>

        <div class="edit-field">
          <label>Status</label>

          <select name="status">
            <option
              value="published"
              ${step.status === "published" ? "selected" : ""}
            >
              Published
            </option>

            <option
              value="draft"
              ${step.status === "draft" ? "selected" : ""}
            >
              Draft (hidden from citizens)
            </option>
          </select>
        </div>

        <div class="edit-actions">
          <button type="submit" class="save-btn">
            ${isNew ? "Add step" : "Save changes"}
          </button>

          <button
            type="button"
            class="cancel-btn"
            id="cancel-edit"
          >
            Cancel
          </button>
        </div>

      </form>
    `;

    els.panel.classList.add("open");
    els.backdrop.classList.add("open");

    els.panel
      .querySelector("#cancel-edit")
      .addEventListener("click", closePanel);

    els.panel
      .querySelector("#edit-form")
      .addEventListener("submit", (e) =>
        handleSave(e, isNew)
      );
  }

  function closePanel() {
    els.panel.classList.remove("open");
    els.backdrop.classList.remove("open");
  }

  async function handleSave(e, isNew) {
    e.preventDefault();

    const form = new FormData(e.target);

    const patch = {
      title: form.get("title").trim(),
      office: form.get("office").trim(),
      description: form.get("description").trim(),
      fee: form.get("fee").trim(),
      estimatedTime: form.get("estimatedTime").trim(),
      eligibility: form.get("eligibility").trim(),
      documentsNeeded: splitList(form.get("documentsNeeded")),
      dependsOn: splitList(form.get("dependsOn")),
      sourceUrl: form.get("sourceUrl").trim(),
      lastVerifiedAt: form.get("lastVerifiedAt").trim(),
      status: form.get("status"),
    };

    const stepId = form.get("id").trim();

    try {
      currentTask = isNew
        ? await API.addStep(currentTask.id, {
          id: stepId,
          ...patch,
        })
        : await API.updateStep(
          currentTask.id,
          stepId,
          patch
        );

      closePanel();
      renderTable();
    } catch (err) {
      showError(err.message);
    }
  }

  function showError(msg) {
    const slot = els.panel.querySelector("#edit-error-slot");

    slot.innerHTML = `
      <div class="edit-error">
        ${escapeHtml(msg)}
      </div>
    `;
  }

  function splitList(str) {
    return (str || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return escapeHtml(str || "").replace(/"/g, "&quot;");
  }
})();