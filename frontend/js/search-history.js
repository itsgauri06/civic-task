/**
 * search-history.js
 * ---------------------------------------------------------------
 * Per-browser history of searches the citizen has run, stored in
 * localStorage — same persistence model as progress-tracker.js.
 * No accounts exist in this scaffold, so this is a local convenience
 * list, not a synced/server-side history.
 * ---------------------------------------------------------------
 */
const SearchHistory = (() => {
  const KEY = "searchHistory:v1";
  const MAX_ENTRIES = 12;

  function getAll() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY)) || [];
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function save(entries) {
    try {
      localStorage.setItem(KEY, JSON.stringify(entries));
    } catch {
      // localStorage unavailable (private mode, quota, etc.) — fail silently,
      // history just won't persist this session.
    }
  }

  // Records a search. Dedupes on (query, location) so re-running the same
  // search bumps it to the top instead of piling up duplicates.
  function add({ query, location, taskId, matched }) {
    const query_ = (query || "").trim();
    if (!query_) return getAll();

    const location_ = (location || "").trim();
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      query: query_,
      location: location_,
      taskId: taskId || null,
      matched: !!matched,
      at: new Date().toISOString(),
    };

    const rest = getAll().filter(
      (e) => !(e.query.toLowerCase() === query_.toLowerCase() && e.location.toLowerCase() === location_.toLowerCase())
    );
    const next = [entry, ...rest].slice(0, MAX_ENTRIES);
    save(next);
    return next;
  }

  function remove(id) {
    const next = getAll().filter((e) => e.id !== id);
    save(next);
    return next;
  }

  function clear() {
    save([]);
    return [];
  }

  return { getAll, add, remove, clear };
})();
