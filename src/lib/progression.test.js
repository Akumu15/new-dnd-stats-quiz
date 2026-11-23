import { describe, it, expect } from "vitest";
import {
  scoreProgress,
  xpBetween,
  weekKey,
  daysLeftInWeek,
  generateBoard,
  periodProgress,
  questStatus,
  canClaim,
  normalizeFocus,
  formatWeeks,
  claimQuest,
  statXpThisWeek,
  statRoomThisWeek,
} from "./progression.js";
import { QUESTS, DAILY_SLOTS, WEEKLY_SLOTS, MAX_FOCUS_XP_PER_WEEK, WEEKLY_STAT_XP_CAP } from "../data/quests.js";
import { ABILITY_KEYS } from "../data/gameData.js";
import { currentScores, dateKey } from "./scoring.js";

const baseScores = { STR: 12, DEX: 12, CON: 12, INT: 12, WIS: 12, CHA: 12 };

describe("quest pool", () => {
  it("has 5 daily quests and 2 weekly bounties per ability, each with 3 tiers", () => {
    for (const k of ABILITY_KEYS) {
      expect(QUESTS.filter((q) => q.stat === k && q.freq === "daily")).toHaveLength(5);
      expect(QUESTS.filter((q) => q.stat === k && q.freq === "weekly")).toHaveLength(2);
    }
    QUESTS.forEach((q) => expect(q.tasks).toHaveLength(3));
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(QUESTS.length);
  });
});

describe("cost table", () => {
  it("makes higher scores cost more", () => {
    expect(xpBetween(8, 9)).toBe(200);
    expect(xpBetween(12, 15)).toBe(1700);
    expect(xpBetween(17, 18)).toBe(5000);
    expect(xpBetween(18, 20)).toBe(20000);
  });
  it("makes every step above 15 at least twice as costly as the last", () => {
    for (const s of [15, 16, 17]) expect(xpBetween(s + 1, s + 2)).toBeGreaterThanOrEqual(1.5 * xpBetween(s, s + 1));
    expect(xpBetween(16, 17)).toBeGreaterThanOrEqual(2 * xpBetween(15, 16));
  });
  it("tracks XP banked toward the next point", () => {
    expect(scoreProgress(12, 500)).toMatchObject({ score: 13, into: 50, needed: 450 });
  });
  it("formats long estimates in months and years", () => {
    expect(formatWeeks(1)).toBe("1 week");
    expect(formatWeeks(8)).toBe("8 weeks");
    expect(formatWeeks(13)).toBe("3 months");
    expect(formatWeeks(48)).toBe("11 months");
    expect(formatWeeks(77)).toBe("1.5 years");
  });
});

describe("calendar", () => {
  it("starts weeks on Monday", () => {
    expect(weekKey("2026-11-23")).toBe("2026-11-23"); // Monday
    expect(weekKey("2026-11-29")).toBe("2026-11-23"); // Sunday
    expect(weekKey("2026-11-30")).toBe("2026-11-30");
    expect(daysLeftInWeek("2026-11-23")).toBe(7);
    expect(daysLeftInWeek("2026-11-29")).toBe(1);
  });
});

describe("generateBoard", () => {
  const args = { focus: ["STR", "INT"], scores: baseScores, seed: "s", today: "2026-11-24" };

  const statsOf = (offers) => offers.map((o) => o.quest.stat);

  it("offers 3 daily quests (2 from the chosen abilities + a wildcard) and 2 bounties", () => {
    const board = generateBoard(args);
    expect(board.daily).toHaveLength(DAILY_SLOTS);
    expect(board.weekly).toHaveLength(WEEKLY_SLOTS);
    expect(statsOf(board.daily.slice(0, 2)).sort()).toEqual(["INT", "STR"]);
    expect(["STR", "INT"]).not.toContain(board.daily[2].quest.stat);
    expect(statsOf(board.weekly).sort()).toEqual(["INT", "STR"]);
  });
  it("makes the chosen abilities the majority, but never the whole board", () => {
    for (const focus of [["CHA"], ["STR", "INT"], ["STR", "DEX", "WIS"]]) {
      for (let d = 23; d <= 29; d++) {
        const stats = statsOf(generateBoard({ ...args, focus, today: `2026-11-${d}` }).daily);
        expect(stats.filter((s) => focus.includes(s)).length).toBe(2);
        expect(stats.filter((s) => !focus.includes(s)).length).toBe(1);
      }
    }
  });
  it("rotates three chosen abilities across the week", () => {
    const focus = ["STR", "DEX", "WIS"];
    const seen = new Set();
    for (let d = 23; d <= 29; d++) statsOf(generateBoard({ ...args, focus, today: `2026-11-${d}` }).daily.slice(0, 2)).forEach((s) => seen.add(s));
    expect([...seen].sort()).toEqual(["DEX", "STR", "WIS"]);
  });
  it("is stable within a day and changes across days", () => {
    const ids = (b) => b.daily.map((o) => o.quest.id).join();
    expect(ids(generateBoard(args))).toBe(ids(generateBoard(args)));
    const week = Array.from({ length: 7 }, (_, i) => ids(generateBoard({ ...args, today: `2026-11-${23 + i}` })));
    expect(new Set(week).size).toBeGreaterThan(1);
  });
  it("scales the task to the hero's score", () => {
    const strOffer = (scores) => generateBoard({ ...args, scores }).daily.find((o) => o.quest.stat === "STR");
    const low = strOffer({ ...baseScores, STR: 6 });
    const high = strOffer({ ...baseScores, STR: 17 });
    expect(low.tier).toBe(0);
    expect(high.tier).toBe(2);
    expect(low.task).not.toBe(high.task);
  });
  it("gives a single chosen ability two different daily quests and one bounty", () => {
    const board = generateBoard({ ...args, focus: ["CHA"] });
    const cha = board.daily.filter((o) => o.quest.stat === "CHA");
    expect(cha).toHaveLength(2);
    expect(cha[0].quest.id).not.toBe(cha[1].quest.id);
    expect(board.weekly.filter((o) => o.quest.stat === "CHA")).toHaveLength(1);
  });
  it("normalizes focus", () => {
    expect(normalizeFocus(["STR", "STR", "XYZ", "INT", "WIS", "CHA"], ["CHA"])).toEqual(["STR", "INT", "WIS"]);
    expect(normalizeFocus(null, ["CHA"])).toEqual(["CHA"]);
  });
});

describe("quotas", () => {
  it("locks remaining daily quests once 3 are done today", () => {
    const today = "2026-11-24";
    const history = ["str-pushups", "str-squats", "int-read"].map((questId) => ({ questId, date: today, xp: 10, freq: "daily" }));
    expect(periodProgress(history, today).dailyLeft).toBe(0);
    expect(questStatus("str-pushups", history, today)).toBe("done");
    expect(questStatus("cha-kind", history, today)).toBe("locked");
    expect(questStatus("cha-kind", history, "2026-11-25")).toBe("available");
  });
  it("only allows claiming quests that are on the board", () => {
    const board = generateBoard({ focus: ["STR", "INT"], scores: baseScores, seed: "s", today: "2026-11-24" });
    const offBoard = QUESTS.find((q) => q.freq === "daily" && !board.daily.some((o) => o.quest.id === q.id));
    expect(canClaim(board.daily[0].quest.id, board, [], "2026-11-24")).toBe(true);
    expect(canClaim(offBoard.id, board, [], "2026-11-24")).toBe(false);
  });
});

// ── Balance simulation: a perfect hero who claims everything, every day ──
function simulate({ base, focus, days, start = new Date(2026, 0, 5) }) {
  const save = { base, xp: Object.fromEntries(ABILITY_KEYS.map((k) => [k, 0])), history: [] };
  for (let d = 0; d < days; d++) {
    const today = dateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + d));
    const board = generateBoard({ focus, scores: currentScores(save.base, save.xp), seed: "sim", today });
    for (const offer of [...board.daily, ...board.weekly]) {
      Object.assign(save, claimQuest(save, offer.quest.id, board, today)); // same logic as the app
    }
  }
  return { scores: currentScores(save.base, save.xp), save };
}

describe("weekly training limit", () => {
  it("caps what an ability absorbs, but keeps full XP for level and boss", () => {
    const today = "2026-11-26";
    const history = [
      { questId: "str-pushups", date: "2026-11-23", xp: 10, statXp: 10, stat: "STR", freq: "daily" },
      { questId: "str-session", date: "2026-11-24", xp: 35, statXp: 35, stat: "STR", freq: "weekly" },
      { questId: "str-squats", date: "2026-11-25", xp: 10, statXp: 10, stat: "STR", freq: "daily" },
      { questId: "str-plank", date: "2026-11-16", xp: 10, stat: "STR", freq: "daily" }, // last week
    ];
    expect(statXpThisWeek(history, "STR", today)).toBe(55);
    expect(statRoomThisWeek(history, "STR", today)).toBe(WEEKLY_STAT_XP_CAP - 55);

    const full = Array.from({ length: 10 }, (_, i) => ({ questId: "str-grip", date: `2026-11-2${3 + (i % 4)}`, xp: 10, statXp: 10, stat: "STR", freq: "daily" }));
    const board = generateBoard({ focus: ["STR"], scores: baseScores, seed: "s", today });
    const strOffer = board.daily.find((o) => o.quest.stat === "STR");
    const save = { base: baseScores, xp: { STR: 100 }, history: full.slice(0, 10) };
    const after = claimQuest(save, strOffer.quest.id, board, today);
    const entry = after.history.at(-1);
    expect(entry.xp).toBe(10); // counts toward level and boss
    expect(entry.statXp).toBe(5); // only 5 XP of room left this week (100 used)
    expect(after.xp.STR).toBe(105);
  });
  it("ignores claims that aren't on the board", () => {
    const board = generateBoard({ focus: ["STR"], scores: baseScores, seed: "s", today: "2026-11-26" });
    const save = { base: baseScores, xp: {}, history: [] };
    expect(claimQuest(save, "cha-kind-not-real", board, "2026-11-26")).toBe(save);
  });
});

describe("balance", () => {
  it("never gives a focused ability more than ~105 XP in a week", () => {
    const { save } = simulate({ base: baseScores, focus: ["STR", "INT"], days: 7 });
    // Wildcards never pick a focus ability, so this bound is exact.
    expect(save.xp.STR).toBeLessThanOrEqual(MAX_FOCUS_XP_PER_WEEK);
    expect(save.history.filter((h) => h.freq === "daily")).toHaveLength(7 * DAILY_SLOTS);
  });
  it("gives no extra ability growth for focusing on a single ability", () => {
    const { save } = simulate({ base: baseScores, focus: ["STR"], days: 7 * 8 });
    expect(save.xp.STR).toBe(8 * MAX_FOCUS_XP_PER_WEEK);
    // …but the extra quests still count toward level and the party boss.
    const strQuestXp = save.history.filter((h) => h.stat === "STR").reduce((s, h) => s + h.xp, 0);
    expect(strQuestXp).toBeGreaterThan(8 * MAX_FOCUS_XP_PER_WEEK);
  });
  it("keeps three chosen abilities on the same slow pace", () => {
    const { save } = simulate({ base: baseScores, focus: ["STR", "DEX", "WIS"], days: 7 * 4 });
    for (const k of ["STR", "DEX", "WIS"]) expect(save.xp[k]).toBeLessThanOrEqual(4 * MAX_FOCUS_XP_PER_WEEK);
  });
  it("can't take Strength from 12 to 15 in a week, or even a month", () => {
    expect(simulate({ base: baseScores, focus: ["STR", "INT"], days: 7 }).scores.STR).toBe(12);
    expect(simulate({ base: baseScores, focus: ["STR", "INT"], days: 28 }).scores.STR).toBeLessThanOrEqual(13);
  });
  it("gets from 12 to 15 in about 4 months of perfect, focused training", () => {
    expect(simulate({ base: baseScores, focus: ["STR", "INT"], days: 16 * 7 }).scores.STR).toBe(14);
    expect(simulate({ base: baseScores, focus: ["STR", "INT"], days: 17 * 7 }).scores.STR).toBe(15);
  });
  it("takes about a year of perfect training to go from 17 to 18", () => {
    const base = { ...baseScores, STR: 17 };
    expect(simulate({ base, focus: ["STR", "INT"], days: 26 * 7 }).scores.STR).toBe(17); // 6 months: not yet
    expect(simulate({ base, focus: ["STR", "INT"], days: 44 * 7 }).scores.STR).toBe(17); // 10 months: not yet
    expect(simulate({ base, focus: ["STR", "INT"], days: 52 * 7 }).scores.STR).toBe(18); // a year: there
  });
  it("lets beginners grow faster than veterans", () => {
    const low = simulate({ base: { ...baseScores, STR: 6 }, focus: ["STR", "INT"], days: 56 });
    const high = simulate({ base: { ...baseScores, STR: 16 }, focus: ["STR", "INT"], days: 56 });
    expect(low.scores.STR - 6).toBeGreaterThanOrEqual(4);
    expect(high.scores.STR - 16).toBe(0);
  });
});
