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
  FOCUS_DAILY_SLOTS,
  WEEKLY_STAT_XP_CAP,
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

/** Human-friendly duration: "3 weeks", "5 months", "1.5 years". */
export function formatWeeks(weeks) {
  if (weeks < 9) return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  const months = Math.round(weeks / 4.345);
  if (months < 12) return `${months} months`;
  const years = Math.round((weeks / 52.18) * 2) / 2;
  return `${years} ${years === 1 ? "year" : "years"}`;
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

function shuffled(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Which focus abilities fill the `count` focus slots (repeating if there are fewer picks). */
function focusSlots(rng, focus, count) {
  const order = shuffled(rng, focus);
  return Array.from({ length: count }, (_, i) => order[i % order.length]);
}

/**
 * Build the quests on offer today.
 *  • Daily (3): FOCUS_DAILY_SLOTS (2) come from the hero's chosen abilities, so most of
 *    the board is what they asked for, and the rest are "wildcards" from other abilities,
 *    favoring lower scores so no ability is forgotten. With 3 picks, the two focus slots
 *    rotate among them day to day; with 1 pick, both are that ability (different quests).
 *  • Weekly (2): bounties for the chosen abilities; with a single pick, one is a wildcard.
 * Growth stays at the intended pace because each ability can absorb at most
 * WEEKLY_STAT_XP_CAP per week (see claimQuest).
 * The same seed, day and focus always produce the same board.
 */
export function generateBoard({ focus, scores, seed, today }) {
  const week = weekKey(today);
  const dayRng = mulberry32(hashString(`${seed}|day|${today}`));
  const weekRng = mulberry32(hashString(`${seed}|week|${week}`));

  const others = ABILITY_KEYS.filter((k) => !focus.includes(k));
  const wildcards = (rng, count) => {
    const pool = [...others];
    const picked = [];
    while (picked.length < count && pool.length) {
      const k = pickWeighted(rng, pool, (s) => MAX_SCORE + 1 - scores[s]);
      picked.push(k);
      pool.splice(pool.indexOf(k), 1);
    }
    return picked;
  };
  const dailySlots = focusSlots(dayRng, focus, FOCUS_DAILY_SLOTS);
  dailySlots.push(...wildcards(dayRng, DAILY_SLOTS - dailySlots.length));

  const usedDaily = new Set();
  const daily = dailySlots.slice(0, DAILY_SLOTS).map((stat) => {
    const options = QUESTS.filter((q) => q.stat === stat && q.freq === "daily" && !usedDaily.has(q.id));
    const quest = pick(dayRng, options);
    usedDaily.add(quest.id);
    return offer(quest, scores);
  });

  // One bounty per distinct pick (up to 2); a single pick gets one bounty plus a wildcard.
  const weeklySlots = shuffled(weekRng, focus).slice(0, WEEKLY_SLOTS);
  weeklySlots.push(...wildcards(weekRng, WEEKLY_SLOTS - weeklySlots.length));
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

// ── Weekly training limit per ability ─────────────────────────────────

/** Quest XP that actually went into `stat` this week (Trials and loot are separate). */
export function statXpThisWeek(history, stat, today) {
  const week = weekKey(today);
  return (history || []).reduce((sum, h) => {
    const freq = entryFreq(h);
    if ((freq !== "daily" && freq !== "weekly") || weekKey(h.date) !== week) return sum;
    if ((h.stat || questById(h.questId)?.stat) !== stat) return sum;
    return sum + (h.statXp ?? h.xp ?? 0);
  }, 0);
}

/** XP an ability can still absorb from quests this week. */
export function statRoomThisWeek(history, stat, today) {
  return Math.max(0, WEEKLY_STAT_XP_CAP - statXpThisWeek(history, stat, today));
}

/**
 * Claim a quest: returns the updated save, or the same save if the claim isn't allowed.
 * The full XP always counts toward level and the party boss (history `xp`), but only
 * what fits under the ability's weekly limit raises the ability (`statXp`).
 */
export function claimQuest(save, questId, board, today) {
  if (!canClaim(questId, board, save.history, today)) return save;
  const o = [...board.daily, ...board.weekly].find((x) => x.quest.id === questId);
  const { stat, freq } = o.quest;
  const statXp = Math.min(o.xp, statRoomThisWeek(save.history, stat, today));
  return {
    ...save,
    xp: { ...save.xp, [stat]: (save.xp[stat] || 0) + statXp },
    history: [...save.history, { questId, date: today, xp: o.xp, statXp, stat, freq }],
  };
}
