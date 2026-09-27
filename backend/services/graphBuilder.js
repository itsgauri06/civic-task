/**
 * graphBuilder.js
 * --------------------------------------------------------------------------
 * Owns the ONE piece of logic every other part of the app trusts:
 * turning a task's flat `steps` array (with `dependsOn` edges) into a
 * validated, tiered dependency graph.
 *
 * Nobody else should compute `tier` or check for cycles — call these
 * functions instead, so there's exactly one place this logic can have a bug.
 * --------------------------------------------------------------------------
 */

/**
 * Validates a task's steps: every dependsOn id must exist, and the graph
 * must be acyclic. Throws a GraphError with a human-readable message
 * (routes should catch this and respond 400) if not.
 */
function validateGraph(steps) {
  const ids = new Set(steps.map((s) => s.id));

  for (const step of steps) {
    for (const dep of step.dependsOn || []) {
      if (!ids.has(dep)) {
        throw new GraphError(
          `Step "${step.id}" depends on unknown step "${dep}"`
        );
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const stepsById = Object.fromEntries(steps.map((s) => [s.id, s]));

  function visit(id, path) {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new GraphError(
        `Would create a cycle: ${[...path, id].join(" -> ")}`
      );
    }
    visiting.add(id);
    for (const dep of stepsById[id].dependsOn || []) {
      visit(dep, [...path, id]);
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const step of steps) visit(step.id, []);
}

/**
 * Computes each step's tier = length of the longest dependency chain ending
 * at that step. Tier 0 = no prerequisites. The frontend lays out columns by
 * tier, so steps in the same tier can be worked on in parallel.
 * Assumes validateGraph() has already been called (no cycles, no dangling refs).
 */
function computeTiers(steps) {
  const stepsById = Object.fromEntries(steps.map((s) => [s.id, s]));
  const tierCache = new Map();

  function tierOf(id) {
    if (tierCache.has(id)) return tierCache.get(id);
    const deps = stepsById[id].dependsOn || [];
    const tier = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(tierOf));
    tierCache.set(id, tier);
    return tier;
  }

  return steps.map((s) => ({ ...s, tier: tierOf(s.id) }));
}

/**
 * Full pipeline: validate, then tier, then drop draft steps unless
 * includeDrafts is true (the public API hides drafts; the admin API doesn't).
 */
function buildGraph(steps, { includeDrafts = false } = {}) {
  validateGraph(steps);
  const tiered = computeTiers(steps);
  return includeDrafts
    ? tiered
    : tiered.filter((s) => s.status !== "draft");
}

class GraphError extends Error {}

module.exports = { validateGraph, computeTiers, buildGraph, GraphError };
