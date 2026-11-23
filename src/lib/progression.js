// Progression rules: how XP turns into ability points, and which quests the board offers.
import { ABILITY_KEYS, MAX_SCORE } from "../data/gameData.js";
import {
  QUESTS,
  XP_TO_NEXT,
  DAILY_XP,
  WEEKLY_XP,
  DAILY_SLOTS,
  WEEKLY_SLOTS,
  MAX_FOCUS,
  MAX_FOCUS_XP_PER_WEEK,
  questById,
  tierForScore,
} from "../data/quests.js";

// ── XP → ability score ───────────────────────────────────────────────

/**
 * Walk XP up the cost table from the quiz score.
 * Returns { score, into, needed, progress, capped }: `into` = XP banked toward the next point.
 */
export function scoreProgress(base, xp = 0) {
  let score = base;
  let remaining = Math.max(0, xp);
  while (score < MAX_SCORE && remaining >= XP_TO_NEXT[score]) {
    remaining -= XP_TO_NEXT[score];
    score += 1;
  }
  if (score >= MAX_SCORE) return { score: MAX_SCORE, into: 0, needed: 0, progress: 1, capped: true };
  const needed = XP_TO_NEXT[score];
  return { score, into: remaining, needed, progress: remaining / needed, capped: false };
}

/** Total XP to climb from score `from` to score `to`. */
export function xpBetween(from, to) {
  let sum = 0;
  for (let s = from; s < Math.min(to, MAX_SCORE); s++) sum += XP_TO_NEXT[s];
  return sum;
}

/** Weeks of full-effort focus training needed to bank `xp`. */
export function weeksAtFullEffort(xp) {
  return Math.max(1, Math.ceil(xp / MAX_FOCUS_XP_PER_WEEK));
}

// ── Character level ─────────────────────────────────────────────────
// Level n needs 125·n·(n−1) total XP: L2 250 · L3 750 · L4 1500 · L5 2500 · L10 11250

export function levelThreshold(level) {
  return 125 * level * (level - 1);
}

export function levelForXp(total) {
  let level = 1;
  while (total >= levelThreshold(level + 1)) level += 1;
  return level;
}

// ── Calendar ──────────────────────────────────────────────────────────

/** "YYYY-MM-DD" of the Monday that starts the week containing `dayKey`. */
export function weekKey(dayKey) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const offset = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - offset);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

/** Days left in the week, counting today (Sunday = 1). */
export function daysLeftInWeek(dayKey) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 ? 1 : 8 - day;
}

// ── Seeded randomness (same board all day, different each day) ──────────

function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function pickWeighted(rng, items, weightOf) {
  const total = items.reduce((s, it) => s + weightOf(it), 0);
  let r = rng() * total;
  for (const it of items) {
    r -= weightOf(it);
    if (r < 0) return it;
  }
  return items[items.length - 1];
}

// ── The board ──────────────────────────────────────────────────────────

/** Keep only valid, distinct ability keys, at most MAX_FOCUS. */
export function normalizeFocus(focus, fallback) {
  const valid = (focus || []).filter((k, i, arr) => ABILITY_KEYS.includes(k) && arr.indexOf(k) === i).slice(0, MAX_FOCUS);
  return valid.length ? valid : fallback;
}

function offer(quest, scores) {
  const tier = tierForScore(scores[quest.stat]);
  return {
    quest,
    tier,
    task: quest.tasks[tier],
    xp: quest.freq === "weekly" ? WEEKLY_XP : DAILY_XP,
  };
}

/**
 * Build the quests on offer today.
 *  • Daily (3): one per focus ability (two if only one focus), plus one "wildcard"
 *    from another ability, favoring lower scores so no ability is forgotten.
 *  • Weekly (2): one bounty per focus ability (two if only one focus).
 * The same seed, day and focus always produce the same board.
 */
export function generateBoard({ focus, scores, seed, today }) {
  const week = weekKey(today);
  const dayRng = mulberry32(hashString(`${seed}|day|${today}`));
  const weekRng = mulberry32(hashString(`${seed}|week|${week}`));

  const dailySlots = focus.length >= 2 ? [focus[0], focus[1]] : [focus[0], focus[0]];
  const others = ABILITY_KEYS.filter((k) => !focus.includes(k));
  dailySlots.push(pickWeighted(dayRng, others, (k) => MAX_SCORE + 1 - scores[k]));

  const usedDaily = new Set();
  const daily = dailySlots.slice(0, DAILY_SLOTS).map((stat) => {
    const options = QUESTS.filter((q) => q.stat === stat && q.freq === "daily" && !usedDaily.has(q.id));
    const quest = pick(dayRng, options);
    usedDaily.add(quest.id);
    return offer(quest, scores);
  });

  const weeklySlots = focus.length >= 2 ? [focus[0], focus[1]] : [focus[0], focus[0]];
  const usedWeekly = new Set();
  const weekly = weeklySlots.slice(0, WEEKLY_SLOTS).map((stat) => {
    const options = QUESTS.filter((q) => q.stat === stat && q.freq === "weekly" && !usedWeekly.has(q.id));
    const quest = pick(weekRng, options);
    usedWeekly.add(quest.id);
    return offer(quest, scores);
  });

  return { daily, weekly };
}

// ── Completion rules ───────────────────────────────────────────────────

// Entries from quests that no longer exist (older app versions) don't count toward quotas.
function entryFreq(entry) {
  return entry.freq || questById(entry.questId)?.freq || null;
}

/** What has been done in the current day and week. */
export function periodProgress(history, today) {
  const week = weekKey(today);
  const dailyDone = history.filter((h) => entryFreq(h) === "daily" && h.date === today);
  const weeklyDone = history.filter((h) => entryFreq(h) === "weekly" && weekKey(h.date) === week);
  return {
    dailyDone,
    weeklyDone,
    dailyLeft: Math.max(0, DAILY_SLOTS - dailyDone.length),
    weeklyLeft: Math.max(0, WEEKLY_SLOTS - weeklyDone.length),
  };
}

/** "available" | "done" | "locked" (the day's or week's quota is already used). */
export function questStatus(questId, history, today) {
  const quest = questById(questId);
  if (!quest) return "locked";
  const p = periodProgress(history, today);
  const done = (quest.freq === "weekly" ? p.weeklyDone : p.dailyDone).some((h) => h.questId === questId);
  if (done) return "done";
  const left = quest.freq === "weekly" ? p.weeklyLeft : p.dailyLeft;
  return left > 0 ? "available" : "locked";
}

/** A quest may be claimed only if it is on today's board and still available. */
export function canClaim(questId, board, history, today) {
  const onBoard = [...board.daily, ...board.weekly].some((o) => o.quest.id === questId);
  return onBoard && questStatus(questId, history, today) === "available";
}
