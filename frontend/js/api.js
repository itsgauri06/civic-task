/**
 * api.js
 * ---------------------------------------------------------------
 * The ONLY file that knows whether data comes from a live backend
 * or the bundled demo dataset. Every other frontend file just calls
 * these functions and gets back the shape documented in
 * docs/API_SPEC.md — it never needs to know which source answered.
 * ---------------------------------------------------------------
 */
const API = (() => {
  const BASE_URL = "http://localhost:3001";
  let backendAvailable = null; // null = unknown yet, true/false once checked

  async function checkBackend() {
    if (backendAvailable !== null) return backendAvailable;
    try {
      // Bumped from 1200ms: a cold first request right after a page refresh
      // can legitimately take a bit longer, and a too-short timeout here
      // was causing this to falsely decide "no backend" and get stuck in
      // demo mode for the rest of the session.
      const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
      backendAvailable = res.ok;
    } catch {
      backendAvailable = false;
    }
    return backendAvailable;
  }

  // Mirrors backend/services/graphBuilder.js so demo mode lays out
  // identically to the real API. Kept intentionally tiny and dependency-free.
  function computeTiersLocally(steps) {
    const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
    const cache = new Map();
    function tierOf(id) {
      if (cache.has(id)) return cache.get(id);
      const deps = byId[id].dependsOn || [];
      const tier = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(tierOf));
      cache.set(id, tier);
      return tier;
    }
    return steps.map((s) => ({ ...s, tier: tierOf(s.id) }));
  }

  // Mirrors backend/services/graphBuilder.js's validateGraph(). Throws with
  // a human-readable message on cycles or dangling dependsOn references.
  function validateGraphLocally(steps) {
    const ids = new Set(steps.map((s) => s.id));
    for (const step of steps) {
      for (const dep of step.dependsOn || []) {
        if (!ids.has(dep)) throw new Error(`Step "${step.id}" depends on unknown step "${dep}"`);
      }
    }
    const visiting = new Set(), visited = new Set();
    const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
    function visit(id, path) {
      if (visited.has(id)) return;
      if (visiting.has(id)) throw new Error(`Would create a cycle: ${[...path, id].join(" -> ")}`);
      visiting.add(id);
      (byId[id].dependsOn || []).forEach((dep) => visit(dep, [...path, id]));
      visiting.delete(id);
      visited.add(id);
    }
    steps.forEach((s) => visit(s.id, []));
  }

  async function listTasks() {
    if (await checkBackend()) {
      const res = await fetch(`${BASE_URL}/api/tasks`);
      return res.json();
    }
    return window.SAMPLE_TASKS.map(({ id, title, location }) => ({ id, title, location }));
  }

  async function getTask(taskId) {
    if (await checkBackend()) {
      const res = await fetch(`${BASE_URL}/api/tasks/${encodeURIComponent(taskId)}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load task");
      return res.json();
    }
    const task = window.SAMPLE_TASKS.find((t) => t.id === taskId);
    if (!task) throw new Error("Unknown task id");
    const published = task.steps.filter((s) => s.status !== "draft");
    return { ...task, steps: computeTiersLocally(published) };
  }

  async function resolveTask(description, state, city) {
    if (await checkBackend()) {
      const res = await fetch(`${BASE_URL}/api/tasks/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, state, city }),
      });
      return res.json();
    }
    // Same loose keyword match as backend/routes/tasks.js, for demo parity.
    // Keep this map mirrored with keywordsByTask in backend/routes/tasks.js —
    // this used to be hardcoded to a single task, which is why any new task
    // (like passport) silently failed to resolve whenever this fallback ran.
    const keywordsByTask = {
      "register-small-business-in": ["business", "shop", "startup", "company", "enterprise", "msme"],
      "apply-for-passport-in": ["passport", "travel document", "passport seva", "renew passport", "psk"],
    };
    const needle = description.toLowerCase();

    let best = null;
    let bestScore = 0;
    for (const task of window.SAMPLE_TASKS) {
      const keywords = keywordsByTask[task.id] || [];
      const score = keywords.filter((k) => needle.includes(k)).length;
      if (score > bestScore) {
        bestScore = score;
        best = task;
      }
    }
    if (best) {
      return { taskId: best.id, confidence: Math.min(0.5 + bestScore * 0.15, 0.95) };
    }
    return { taskId: null, confidence: 0, suggestions: window.SAMPLE_TASKS.map((t) => t.id) };
  }

  async function isLiveBackend() {
    return checkBackend();
  }

  // ---- Admin operations ----
  // Demo mode mutates window.SAMPLE_TASKS in memory only (resets on page
  // reload) so the admin dashboard is still fully usable without a backend,
  // with a clear "changes aren't saved" note shown in admin.js.

  async function getAdminTask(taskId) {
    if (await checkBackend()) {
      const res = await fetch(`${BASE_URL}/api/admin/tasks/${encodeURIComponent(taskId)}`);
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }
    const task = window.SAMPLE_TASKS.find((t) => t.id === taskId);
    if (!task) throw new Error("Unknown task id");
    return { ...task, steps: computeTiersLocally(task.steps) };
  }

  async function updateStep(taskId, stepId, patch) {
    if (await checkBackend()) {
      const res = await fetch(
        `${BASE_URL}/api/admin/tasks/${encodeURIComponent(taskId)}/steps/${encodeURIComponent(stepId)}`,
        { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      return body;
    }
    const task = window.SAMPLE_TASKS.find((t) => t.id === taskId);
    const idx = task.steps.findIndex((s) => s.id === stepId);
    const candidate = task.steps.map((s, i) => (i === idx ? { ...s, ...patch, id: stepId } : s));
    validateGraphLocally(candidate); // throws if invalid — caller should catch
    task.steps = candidate;
    return { ...task, steps: computeTiersLocally(task.steps) };
  }

  async function addStep(taskId, step) {
    if (await checkBackend()) {
      const res = await fetch(`${BASE_URL}/api/admin/tasks/${encodeURIComponent(taskId)}/steps`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(step),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      return body;
    }
    const task = window.SAMPLE_TASKS.find((t) => t.id === taskId);
    if (task.steps.some((s) => s.id === step.id)) throw new Error(`Step id "${step.id}" already exists`);
    const candidate = [...task.steps, { dependsOn: [], status: "draft", ...step }];
    validateGraphLocally(candidate);
    task.steps = candidate;
    return { ...task, steps: computeTiersLocally(task.steps) };
  }

  async function deleteStep(taskId, stepId) {
    if (await checkBackend()) {
      const res = await fetch(
        `${BASE_URL}/api/admin/tasks/${encodeURIComponent(taskId)}/steps/${encodeURIComponent(stepId)}`,
        { method: "DELETE" }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      return body;
    }
    const task = window.SAMPLE_TASKS.find((t) => t.id === taskId);
    const referencedBy = task.steps.filter((s) => s.id !== stepId && (s.dependsOn || []).includes(stepId));
    if (referencedBy.length) throw new Error(`Cannot delete: still depended on by ${referencedBy.map((s) => s.id).join(", ")}`);
    task.steps = task.steps.filter((s) => s.id !== stepId);
    return { ...task, steps: computeTiersLocally(task.steps) };
  }

  return {
    listTasks, getTask, resolveTask, isLiveBackend,
    getAdminTask, updateStep, addStep, deleteStep,
  };
})();