/**
 * Setup Advisor - recommends kart setup based on historical session data.
 *
 * Matching priority (highest first):
 *   1. Conditions (wet / dry) - mandatory filter via tyre type
 *   2. Temperature - closer temps score higher
 *   3. Track - same track scores higher
 *   4. Tyre make - same make scores higher
 */

/**
 * Determine whether a tyre type string represents wet conditions.
 * Matches common labels: "Wet", "Rain", etc.
 * @param {string} tyreType
 * @returns {boolean}
 */
export function isWetTyre(tyreType) {
  if (!tyreType) return false;
  const t = tyreType.toLowerCase();
  return t === 'wet' || t === 'rain' || t === 'intermediate';
}

/**
 * Score a historical session against the requested conditions.
 * Higher score = better match.
 *
 * @param {object} session  - joined session (must include .tyre and .circuit)
 * @param {object} criteria - { conditions: 'wet'|'dry', temperature: number, trackId: string, tyreMake: string }
 * @returns {number|null}   - null means the session should be excluded entirely
 */
export function scoreSession(session, criteria) {
  // --- Mandatory: tyre type must match conditions ---
  const wet = isWetTyre(session.tyre?.type);
  if (criteria.conditions === 'wet' && !wet) return null;
  if (criteria.conditions === 'dry' && wet) return null;

  let score = 0;

  // --- Temperature (max 30 points) ---
  // Sessions with no temperature recorded get a small baseline
  if (session.temp != null && criteria.temperature != null) {
    const diff = Math.abs(session.temp - criteria.temperature);
    // Full marks at 0 diff, linearly decreasing, floor at 0
    score += Math.max(0, 30 - diff * 2);
  }

  // --- Track (20 points for exact match) ---
  if (criteria.trackId && session.circuitId === criteria.trackId) {
    score += 20;
  }

  // --- Tyre make (10 points for exact match) ---
  if (
    criteria.tyreMake &&
    session.tyre?.make?.toLowerCase() === criteria.tyreMake.toLowerCase()
  ) {
    score += 10;
  }

  return score;
}

/**
 * Calculate the mode (most common value) of an array.
 * @param {Array} values
 * @returns {*} most common value, or null if empty
 */
function mode(values) {
  if (!values.length) return null;
  const counts = {};
  let maxCount = 0;
  let maxVal = values[0];
  for (const v of values) {
    const key = String(v);
    counts[key] = (counts[key] || 0) + 1;
    if (counts[key] > maxCount) {
      maxCount = counts[key];
      maxVal = v;
    }
  }
  return maxVal;
}

/**
 * Compute a weighted average of numeric values using their scores as weights.
 * @param {Array<{value: number, weight: number}>} items
 * @returns {number|null}
 */
function weightedAvg(items) {
  if (!items.length) return null;
  let sumW = 0;
  let sumVW = 0;
  for (const { value, weight } of items) {
    sumW += weight;
    sumVW += value * weight;
  }
  return sumW > 0 ? sumVW / sumW : null;
}

/**
 * Round a number to a given precision.
 */
function round(n, decimals = 2) {
  if (n == null) return null;
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Build setup recommendations from scored sessions.
 *
 * @param {Array<{session: object, score: number}>} scored
 * @returns {object} recommendation
 */
export function buildRecommendation(scored) {
  if (!scored.length) {
    return { confidence: 'none', matchCount: 0 };
  }

  // Extract weighted numeric values
  const pressureFI = [];
  const pressureFO = [];
  const pressureRI = [];
  const pressureRO = [];
  const frontSprockets = [];
  const rearSprockets = [];
  const jets = [];
  const casters = [];
  const rideHeights = [];

  for (const { session: s, score } of scored) {
    const w = score + 1; // +1 so even score-0 sessions contribute a little

    if (s.frontInner != null) pressureFI.push({ value: s.frontInner, weight: w });
    if (s.frontOuter != null) pressureFO.push({ value: s.frontOuter, weight: w });
    if (s.rearInner != null) pressureRI.push({ value: s.rearInner, weight: w });
    if (s.rearOuter != null) pressureRO.push({ value: s.rearOuter, weight: w });
    if (s.frontSprocket != null) frontSprockets.push({ value: s.frontSprocket, weight: w });
    if (s.rearSprocket != null) rearSprockets.push({ value: s.rearSprocket, weight: w });
    if (s.jet != null) jets.push({ value: s.jet, weight: w });
    if (s.caster) casters.push(s.caster);
    if (s.rideHeight) rideHeights.push(s.rideHeight);
  }

  const confidence =
    scored.length >= 5 ? 'high' : scored.length >= 2 ? 'medium' : 'low';

  return {
    confidence,
    matchCount: scored.length,

    // Primary
    tyrePressures: {
      frontInner: round(weightedAvg(pressureFI)),
      frontOuter: round(weightedAvg(pressureFO)),
      rearInner: round(weightedAvg(pressureRI)),
      rearOuter: round(weightedAvg(pressureRO)),
    },
    sprockets: {
      front: round(weightedAvg(frontSprockets), 0),
      rear: round(weightedAvg(rearSprockets), 0),
      ratio:
        weightedAvg(rearSprockets) && weightedAvg(frontSprockets)
          ? round(weightedAvg(rearSprockets) / weightedAvg(frontSprockets))
          : null,
    },

    // Secondary
    caster: mode(casters),
    rideHeight: mode(rideHeights),
    jet: round(weightedAvg(jets), 0),
  };
}

/**
 * Main entry point: given all sessions (with joined tyre/circuit data)
 * and the user's criteria, return a recommendation object plus the
 * scored sessions used to produce it.
 *
 * @param {Array} sessions   - sessions with joined .tyre and .circuit
 * @param {object} criteria  - { conditions, temperature, trackId, tyreMake }
 * @returns {{ recommendation: object, scoredSessions: Array }}
 */
export function getSetupRecommendation(sessions, criteria) {
  const scored = [];

  for (const session of sessions) {
    const s = scoreSession(session, criteria);
    if (s !== null) {
      scored.push({ session, score: s });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const recommendation = buildRecommendation(scored);

  return { recommendation, scoredSessions: scored };
}
