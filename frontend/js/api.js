const API = (() => {
  const BASE_URL = "http://localhost:3001";

  async function request(path, options = {}) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, options);

      let body;
      try {
        body = await res.json();
      } catch {
        body = {};
      }

      if (!res.ok) {
        throw new Error(body.error || "Server request failed");
      }

      return body;
    } catch (err) {
      if (err.name === "TypeError" || err.name === "AbortError") {
        throw new Error(
          "Unable to connect to the backend server. Please start the backend and try again."
        );
      }

      throw err;
    }
  }

  // ---------------------------------------------------------
  // Backend health
  // ---------------------------------------------------------

  async function checkBackend() {
    try {
      const res = await fetch(`${BASE_URL}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });

      return res.ok;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------
  // Citizen APIs
  // ---------------------------------------------------------

  async function listTasks() {
    return request("/api/tasks");
  }

  async function getTask(taskId) {
    return request(`/api/tasks/${encodeURIComponent(taskId)}`);
  }

  async function resolveTask(description, state, city) {
    return request("/api/tasks/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description,
        state,
        city,
      }),
    });
  }

  // ---------------------------------------------------------
  // Admin APIs
  // ---------------------------------------------------------

  async function getAdminTask(taskId) {
    return request(
      `/api/admin/tasks/${encodeURIComponent(taskId)}`
    );
  }

  async function updateStep(taskId, stepId, patch) {
    return request(
      `/api/admin/tasks/${encodeURIComponent(taskId)}/steps/${encodeURIComponent(stepId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      }
    );
  }

  async function addStep(taskId, step) {
    return request(
      `/api/admin/tasks/${encodeURIComponent(taskId)}/steps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(step),
      }
    );
  }

  return {
    listTasks,
    getTask,
    resolveTask,
    checkBackend,
    getAdminTask,
    updateStep,
    addStep,
    baseUrl: BASE_URL,
  };
})();