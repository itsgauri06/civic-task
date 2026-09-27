/**
 * extractor.js
 * --------------------------------------------------------------------------
 * STUB — this is the one function a data/scraping team needs to implement
 * for real. Nothing else in the backend calls into scraping logic directly;
 * everything downstream (graphBuilder, routes) only ever sees the shape
 * documented below, so this file can be rewritten entirely without touching
 * the rest of the app.
 *
 * Why this is stubbed rather than built out in this scaffold:
 * Real extraction means (a) crawling dozens of jurisdiction-specific .gov
 * sites with wildly inconsistent structure, (b) parsing PDFs and scanned
 * forms, and (c) resolving conflicting or stale information — each of which
 * is its own substantial project with legal/ToS considerations per site.
 * This scaffold instead ships one hand-curated dataset
 * (backend/data/tasks.json) in the exact output shape below, so the rest of
 * the app can be built and tested against realistic data today.
 *
 * Required output shape (before graphBuilder validates/tiers it):
 *   {
 *     id, title, location, summary,
 *     steps: [{
 *       id, title, office, description, documentsNeeded, fee,
 *       estimatedTime, eligibility, sourceUrl, lastVerifiedAt,
 *       dependsOn, status
 *     }, ...]
 *   }
 * See backend/models/schema.md for field-by-field definitions.
 * --------------------------------------------------------------------------
 */

/**
 * @param {string} taskDescription - free text from the citizen, e.g. "I want to register a small business"
 * @param {string} location - e.g. "India", "California, US"
 * @returns {Promise<object>} a task object in the shape above
 *
 * TODO(data-team): implement real extraction. Suggested approach:
 *   1. Maintain a registry of known official sources per (task type, location)
 *      in backend/data/sources.json (a URL per office/department).
 *   2. Fetch + parse each source (HTML/PDF) into a raw-facts intermediate
 *      format — keep this stage jurisdiction-specific.
 *   3. Normalize raw facts into Step objects matching schema.md.
 *   4. Infer dependsOn edges (e.g. "PAN application" pages almost always
 *      say "after name approval") — this step likely needs either manual
 *      curation rules or an LLM extraction pass; do NOT guess silently,
 *      flag low-confidence edges with status: "draft" so an admin reviews
 *      them before they go live.
 *   5. Return the object; the caller runs it through graphBuilder.buildGraph().
 */
async function extractRawSourceData(taskDescription, location) {
  throw new Error(
    "extractRawSourceData() is not implemented. This scaffold serves " +
      "hand-curated data from backend/data/tasks.json instead — see the " +
      "file header comment for the data-team implementation plan."
  );
}

module.exports = { extractRawSourceData };
