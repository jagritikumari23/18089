/**
 * Priority Scoring Strategy
 *
 * Final Score = TYPE_WEIGHT * TYPE_WEIGHT_FACTOR + RECENCY_SCORE * RECENCY_FACTOR
 *
 * Type weights (importance hierarchy):
 *   Placement = 3  (highest)
 *   Result    = 2
 *   Event     = 1  (lowest)
 *
 * Recency score:
 *   Unix timestamp in seconds, normalized to [0, 1] using a sliding window.
 *   We use: recencyScore = timestamp / MAX_OBSERVED_TIMESTAMP
 *   This means newer notifications always score higher within the same type.
 *
 * Blended score = (typeWeight / 3) * 0.6 + (recencyNorm) * 0.4
 *   => Type hierarchy dominates (60%), recency breaks ties within same type (40%)
 *
 * To avoid floating point drift we scale the final score * 1_000_000.
 */

const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

const TYPE_WEIGHT_FACTOR = 0.6;
const RECENCY_FACTOR = 0.4;
const MAX_TYPE_WEIGHT = 3;

// Tracks the max timestamp seen so far for normalization
let maxTimestampSeen = 0;

/**
 * Parse "YYYY-MM-DD HH:MM:SS" timestamp string into a Unix epoch (seconds).
 */
function parseTimestamp(ts) {
  // Replace space with T so it's ISO-8601 compatible
  return Math.floor(new Date(ts.replace(' ', 'T') + 'Z').getTime() / 1000);
}

/**
 * Compute a normalized priority score for a notification.
 * @param {object} notification - raw notification from API
 * @returns {number} score (higher = more important)
 */
function computeScore(notification) {
  const typeWeight = TYPE_WEIGHTS[notification.Type] || 0;
  const ts = parseTimestamp(notification.Timestamp);

  // Update max timestamp window for normalization
  if (ts > maxTimestampSeen) maxTimestampSeen = ts;

  // Normalize recency: ts / maxTimestampSeen ≈ 1 for newest
  const recencyNorm = maxTimestampSeen > 0 ? ts / maxTimestampSeen : 0;

  const score =
    (typeWeight / MAX_TYPE_WEIGHT) * TYPE_WEIGHT_FACTOR +
    recencyNorm * RECENCY_FACTOR;

  return Math.round(score * 1_000_000);
}

/**
 * Re-score all notifications after maxTimestamp may have changed.
 * Called when a new batch updates maxTimestampSeen.
 */
function rescoreAll(notifications) {
  return notifications.map((n) => ({
    ...n,
    score: computeScore(n),
  }));
}

module.exports = { computeScore, rescoreAll, parseTimestamp };
