import { MAX_SCORE } from "../data/gameData.js";
import { XP_TO_NEXT } from "../data/quests.js";
import { TRIAL_COOLDOWN_DAYS, TRIAL_MAX_SCORE } from "../data/trials.js";
import { scoreProgress } from "./progression.js";
import { daysBetween } from "./scoring.js";

/** Convert a raw measurement into an ability score using the trial's table. */
export function measureToScore(trial, value) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  const row = trial.lowerIsBetter
    ? trial.table.find(([threshold]) => value <= threshold)
    : trial.table.find(([threshold]) => value >= threshold);
  const score = row ? row[1] : trial.table[trial.table.length - 1][1];
  return Math.min(TRIAL_MAX_SCORE, score);
}

export function latestTrial(save, stat) {
  const list = (save.trials || []).filter((t) => t.stat === stat);
  return list.length ? list[list.length - 1] : null;
}

/** { available, daysLeft, last } — each Trial can be taken once per cooldown window. */
export function trialAvailability(save, stat, today) {
  const last = latestTrial(save, stat);
  if (!last) return { available: true, daysLeft: 0, last: null };
  const daysLeft = Math.max(0, TRIAL_COOLDOWN_DAYS - daysBetween(last.date, today));
  return { available: daysLeft === 0, daysLeft, last };
}

/**
 * Move an ability to a measured score. XP already banked toward the next point is kept
 * (up to just below the new threshold), so training effort isn't thrown away.
 */
export function recalibrate(base, xp, target) {
  const { into } = scoreProgress(base, xp);
  if (target >= MAX_SCORE) return { base: MAX_SCORE, xp: 0 };
  return { base: target, xp: Math.min(into, XP_TO_NEXT[target] - 1) };
}

/** A stat counts as "proven" if a Trial in the last 90 days matched or set it. */
export function isProven(save, stat, currentScore, today) {
  const last = latestTrial(save, stat);
  if (!last) return false;
  const fresh = daysBetween(last.date, today) <= 90;
  return fresh && (last.applied || last.measured >= currentScore);
}
