import {
  ABILITY_KEYS,
  QUESTIONS,
  CLASS_BY_PAIR,
  MIN_SCORE,
  MAX_SCORE,
  SKILLS,
  BACKGROUND_BY_STAT,
  HIT_DIE,
  TITLES,
} from "../data/gameData.js";
import { scoreProgress, levelForXp, levelThreshold, generateBoard, normalizeFocus } from "./progression.js";

export { questById } from "../data/quests.js";

const MAX_ANSWER = 4;

/** Map a raw questionnaire total (0..maxRaw) onto the 3–20 ability score range. */
export function rawToScore(raw, maxRaw) {
  if (maxRaw <= 0) return MIN_SCORE;
  const clamped = Math.max(0, Math.min(raw, maxRaw));
  return MIN_SCORE + Math.round((clamped / maxRaw) * (MAX_SCORE - MIN_SCORE));
}

/** Standard D&D modifier: floor((score - 10) / 2). */
export function modifier(score) {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * answers[i] is the chosen option index (0–4) for QUESTIONS[i].
 * Returns { STR: n, DEX: n, ... } on the 3–20 scale.
 */
export function computeBaseScores(answers, questions = QUESTIONS) {
  const raw = Object.fromEntries(ABILITY_KEYS.map((k) => [k, 0]));
  const max = Object.fromEntries(ABILITY_KEYS.map((k) => [k, 0]));
  questions.forEach((question, i) => {
    max[question.stat] += MAX_ANSWER;
    const answer = answers[i];
    if (typeof answer === "number") raw[question.stat] += answer;
  });
  return Object.fromEntries(ABILITY_KEYS.map((k) => [k, rawToScore(raw[k], max[k])]));
}

/** Score after training: XP climbs the cost table in data/quests.js (higher scores cost more). */
export function currentScore(base, xp = 0) {
  return scoreProgress(base, xp).score;
}

/** Progress (0–1) toward the next point in an ability. 1 when capped. */
export function progressToNextPoint(base, xp = 0) {
  return scoreProgress(base, xp).progress;
}

export function currentScores(base, xp) {
  return Object.fromEntries(ABILITY_KEYS.map((k) => [k, currentScore(base[k], xp[k] || 0)]));
}

/** Abilities sorted highest to lowest (ties keep the standard STR→CHA order). */
export function rankAbilities(scores) {
  return [...ABILITY_KEYS].sort((a, b) => scores[b] - scores[a] || ABILITY_KEYS.indexOf(a) - ABILITY_KEYS.indexOf(b));
}

/** Class from the top two abilities, or "Adventurer" when every score is within 1 point. */
export function pickClass(scores) {
  const values = ABILITY_KEYS.map((k) => scores[k]);
  if (Math.max(...values) - Math.min(...values) <= 1) return "Adventurer";
  const [first, second] = rankAbilities(scores);
  return CLASS_BY_PAIR[`${first}+${second}`];
}

/** The two weakest abilities, which training should focus on. Capped scores are skipped. */
export function weakestAbilities(scores, count = 2) {
  return rankAbilities(scores)
    .reverse()
    .filter((k) => scores[k] < MAX_SCORE)
    .slice(0, count);
}

/** Band index 0–4 for TIER_TEXT: 3–5, 6–9, 10–12, 13–16, 17–20. */
export function tierIndex(score) {
  if (score <= 5) return 0;
  if (score <= 9) return 1;
  if (score <= 12) return 2;
  if (score <= 16) return 3;
  return 4;
}

export function totalXp(xp) {
  return ABILITY_KEYS.reduce((sum, k) => sum + (xp[k] || 0), 0);
}

export function characterLevel(xp) {
  return levelForXp(totalXp(xp));
}

// ── Dates ──────────────────────────────────────────────────────────────

/** Local calendar date as "YYYY-MM-DD". */
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whole days from date key a to date key b. */
export function daysBetween(a, b) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86400000);
}

/** Consecutive days (ending today or yesterday) with at least one quest done. */
export function streak(history, todayKey) {
  const days = new Set(history.map((h) => h.date));
  let count = 0;
  let cursor = todayKey;
  if (!days.has(cursor)) {
    cursor = shiftKey(cursor, -1);
  }
  while (days.has(cursor)) {
    count += 1;
    cursor = shiftKey(cursor, -1);
  }
  return count;
}

function shiftKey(key, deltaDays) {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + deltaDays));
}

// ── Quest board for a saved hero ─────────────────────────────────────────

/** The hero's chosen focus, or their two weakest abilities by default. */
export function heroFocus(save) {
  const scores = currentScores(save.base, save.xp);
  const fallback = weakestAbilities(scores);
  return normalizeFocus(save.focus, fallback.length ? fallback : ["STR"]);
}

export function boardFor(save, today) {
  return generateBoard({
    focus: heroFocus(save),
    scores: currentScores(save.base, save.xp),
    seed: save.createdAt || "hero",
    today,
  });
}

// ── Full character sheet ─────────────────────────────────────────────────

export function proficiencyBonus(level) {
  return 2 + Math.floor((level - 1) / 4);
}

/** Every derived number the character sheet shows, from the saved character. */
export function buildSheet(save) {
  const scores = currentScores(save.base, save.xp);
  const mods = Object.fromEntries(ABILITY_KEYS.map((k) => [k, modifier(scores[k])]));
  const ranked = rankAbilities(scores);
  const heroClass = pickClass(scores);
  const level = characterLevel(save.xp);
  const pb = proficiencyBonus(level);

  // Proficient in the saves of your two best abilities, and up to two skills of each.
  const proficientStats = ranked.slice(0, 2);
  const proficientSkills = new Set(
    proficientStats.flatMap((stat) => SKILLS.filter((s) => s.stat === stat).slice(0, 2).map((s) => s.name))
  );

  const saves = ABILITY_KEYS.map((k) => {
    const proficient = proficientStats.includes(k);
    return { stat: k, proficient, bonus: mods[k] + (proficient ? pb : 0) };
  });
  const skills = SKILLS.map((s) => {
    const proficient = proficientSkills.has(s.name);
    return { ...s, proficient, bonus: mods[s.stat] + (proficient ? pb : 0) };
  });
  const perception = skills.find((s) => s.name === "Perception").bonus;

  const hitDie = HIT_DIE[heroClass] || 8;
  const perLevel = Math.max(1, hitDie / 2 + 1 + mods.CON);
  const maxHp = Math.max(1, hitDie + mods.CON) + (level - 1) * perLevel;

  return {
    scores,
    mods,
    ranked,
    heroClass,
    level,
    title: TITLES[Math.min(level, TITLES.length) - 1],
    background: BACKGROUND_BY_STAT[ranked[0]],
    xpTotal: totalXp(save.xp),
    levelStartsAt: levelThreshold(level),
    nextLevelAt: levelThreshold(level + 1),
    proficiencyBonus: pb,
    saves,
    skills,
    passivePerception: 10 + perception,
    armorClass: 10 + mods.DEX,
    initiative: mods.DEX,
    speed: 30,
    hitDie,
    maxHp,
    strengths: ranked.slice(0, 2),
    weaknesses: weakestAbilities(scores),
  };
}
