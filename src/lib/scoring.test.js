import { describe, it, expect } from "vitest";
import {
  rawToScore,
  modifier,
  computeBaseScores,
  currentScore,
  progressToNextPoint,
  pickClass,
  weakestAbilities,
  tierIndex,
  characterLevel,
  daysBetween,
  cooldownDays,
  lastCompletions,
  streak,
} from "./scoring.js";
import { QUESTIONS } from "../data/gameData.js";

describe("rawToScore", () => {
  it("maps the ends of the range to 3 and 20", () => {
    expect(rawToScore(0, 16)).toBe(3);
    expect(rawToScore(16, 16)).toBe(20);
  });
  it("puts the middle answer around average", () => {
    expect(rawToScore(8, 16)).toBe(12);
  });
});

describe("modifier", () => {
  it("follows the D&D table", () => {
    expect(modifier(3)).toBe(-4);
    expect(modifier(9)).toBe(-1);
    expect(modifier(10)).toBe(0);
    expect(modifier(11)).toBe(0);
    expect(modifier(20)).toBe(5);
  });
});

describe("computeBaseScores", () => {
  it("has four questions for each ability", () => {
    const counts = {};
    QUESTIONS.forEach((q) => (counts[q.stat] = (counts[q.stat] || 0) + 1));
    expect(Object.values(counts)).toEqual([4, 4, 4, 4, 4, 4]);
  });
  it("scores each ability from only its own questions", () => {
    const answers = QUESTIONS.map((q) => (q.stat === "STR" ? 4 : 0));
    const scores = computeBaseScores(answers);
    expect(scores.STR).toBe(20);
    expect(scores.DEX).toBe(3);
    expect(scores.CHA).toBe(3);
  });
});

describe("training progress", () => {
  it("adds one point per 100 XP and caps at 20", () => {
    expect(currentScore(10, 0)).toBe(10);
    expect(currentScore(10, 250)).toBe(12);
    expect(currentScore(19, 500)).toBe(20);
  });
  it("reports progress toward the next point", () => {
    expect(progressToNextPoint(10, 40)).toBeCloseTo(0.4);
    expect(progressToNextPoint(20, 0)).toBe(1);
  });
  it("levels up every 300 total XP", () => {
    expect(characterLevel({ STR: 0 })).toBe(1);
    expect(characterLevel({ STR: 200, INT: 150 })).toBe(2);
  });
});

describe("pickClass", () => {
  it("uses the top two abilities", () => {
    expect(pickClass({ STR: 16, DEX: 10, CON: 10, INT: 8, WIS: 10, CHA: 14 })).toBe("Paladin");
    expect(pickClass({ STR: 8, DEX: 10, CON: 10, INT: 17, WIS: 15, CHA: 9 })).toBe("Wizard");
  });
  it("calls an even spread an Adventurer", () => {
    expect(pickClass({ STR: 11, DEX: 11, CON: 12, INT: 11, WIS: 12, CHA: 11 })).toBe("Adventurer");
  });
});

describe("weakestAbilities", () => {
  it("returns the two lowest, skipping capped scores", () => {
    const scores = { STR: 20, DEX: 20, CON: 20, INT: 20, WIS: 15, CHA: 9 };
    expect(weakestAbilities(scores)).toEqual(["CHA", "WIS"]);
  });
});

describe("tierIndex", () => {
  it("bands scores", () => {
    expect([3, 5, 6, 9, 10, 12, 13, 16, 17, 20].map(tierIndex)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("dates and cooldowns", () => {
  it("counts days across month boundaries", () => {
    expect(daysBetween("2026-01-31", "2026-02-01")).toBe(1);
  });
  it("lets daily quests repeat the next day and weekly ones after 7", () => {
    const daily = { freq: "daily" };
    const weekly = { freq: "weekly" };
    expect(cooldownDays(daily, "2026-11-23", "2026-11-23")).toBe(1);
    expect(cooldownDays(daily, "2026-11-22", "2026-11-23")).toBe(0);
    expect(cooldownDays(weekly, "2026-11-20", "2026-11-23")).toBe(4);
    expect(cooldownDays(weekly, "2026-11-16", "2026-11-23")).toBe(0);
    expect(cooldownDays(daily, undefined, "2026-11-23")).toBe(0);
  });
  it("finds the latest completion of each quest", () => {
    const history = [
      { questId: "a", date: "2026-11-20" },
      { questId: "a", date: "2026-11-22" },
      { questId: "b", date: "2026-11-21" },
    ];
    expect(lastCompletions(history)).toEqual({ a: "2026-11-22", b: "2026-11-21" });
  });
  it("counts a streak that ends today or yesterday", () => {
    const history = ["2026-11-20", "2026-11-21", "2026-11-22"].map((date) => ({ questId: "x", date }));
    expect(streak(history, "2026-11-22")).toBe(3);
    expect(streak(history, "2026-11-23")).toBe(3);
    expect(streak(history, "2026-11-25")).toBe(0);
  });
});
