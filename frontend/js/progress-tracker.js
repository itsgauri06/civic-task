
const ProgressTracker = (() => {
  function keyFor(taskId) {
    return `progress:${taskId}`;
  }

  function getDone(taskId) {
    try {
      return new Set(JSON.parse(localStorage.getItem(keyFor(taskId))) || []);
    } catch {
      return new Set();
    }
  }

  function toggle(taskId, stepId) {
    const done = getDone(taskId);
    done.has(stepId) ? done.delete(stepId) : done.add(stepId);
    localStorage.setItem(keyFor(taskId), JSON.stringify([...done]));
    return done;
  }

  function isUnlocked(step, doneSet) {
    return (step.dependsOn || []).every((dep) => doneSet.has(dep));
  }

  return { getDone, toggle, isUnlocked };
})();
