import { describe, it, expect } from "vitest";
import { TRIALS, trialFor, TRIAL_MAX_SCORE } from "../data/trials.js";
import { measureToScore, recalibrate, trialAvailability, isProven } from "./trials.js";
import { scoreProgress } from "./progression.js";
import { decodeShare } from "./share.js";
import { ABILITY_KEYS } from "../data/gameData.js";

describe("trial tables", () => {
  it("has one trial per ability, tables ordered best first", () => {
    expect(TRIALS.map((t) => t.stat).sort()).toEqual([...ABILITY_KEYS].sort());
    for (const t of TRIALS) {
      const scores = t.table.map(([, s]) => s);
      expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    }
  });
  it("maps measurements to scores", () => {
    expect(measureToScore(trialFor("STR"), 0)).toBe(5);
    expect(measureToScore(trialFor("STR"), 22)).toBe(10);
    expect(measureToScore(trialFor("STR"), 500)).toBe(TRIAL_MAX_SCORE);
    expect(measureToScore(trialFor("INT"), 7)).toBe(11); // average adult digit span
    expect(measureToScore(trialFor("CON"), 2000)).toBe(11);
  });
  it("handles lower-is-better trials", () => {
    expect(measureToScore(trialFor("WIS"), 0.5)).toBe(18);
    expect(measureToScore(trialFor("WIS"), 14)).toBe(10);
    expect(measureToScore(trialFor("WIS"), 90)).toBe(5);
    expect(measureToScore(trialFor("CHA"), 0)).toBe(17);
    expect(measureToScore(trialFor("CHA"), 50)).toBe(5);
  });
  it("never proves a legendary 19–20", () => {
    for (const t of TRIALS) {
      expect(measureToScore(t, t.lowerIsBetter ? 0 : 1e9)).toBeLessThanOrEqual(TRIAL_MAX_SCORE);
    }
  });
});

describe("recalibrate", () => {
  it("moves the stat and keeps banked XP below the next threshold", () => {
    // base 10 with 350 XP = score 11 with 50 banked toward 12
    const r = recalibrate(10, 350, 13);
    expect(r.base).toBe(13);
    expect(scoreProgress(r.base, r.xp)).toMatchObject({ score: 13, into: 50 });
  });
  it("can lower a stat without leaving it above the target", () => {
    const r = recalibrate(15, 1000, 11);
    expect(scoreProgress(r.base, r.xp).score).toBe(11);
  });
});

describe("availability", () => {
  const save = { trials: [{ stat: "STR", date: "2026-11-01", raw: 20, measured: 10, applied: true }] };
  it("enforces a 30-day cooldown per ability", () => {
    expect(trialAvailability(save, "STR", "2026-11-23")).toMatchObject({ available: false, daysLeft: 8 });
    expect(trialAvailability(save, "STR", "2026-12-01").available).toBe(true);
    expect(trialAvailability(save, "DEX", "2026-11-23").available).toBe(true);
  });
  it("marks fresh, matching results as proven", () => {
    expect(isProven(save, "STR", 10, "2026-11-23")).toBe(true);
    expect(isProven(save, "STR", 10, "2027-03-01")).toBe(false);
    expect(isProven(save, "DEX", 10, "2026-11-23")).toBe(false);
  });
});

describe("share links", () => {
  const encode = (obj) => "#hero=" + Buffer.from(JSON.stringify(obj)).toString("base64url");
  it("decodes a valid hero and recomputes the class", () => {
    const hero = decodeShare(encode({ v: 1, n: "Elara", l: 3, s: [16, 14, 12, 10, 9, 8] }));
    expect(hero).toMatchObject({ name: "Elara", level: 3, heroClass: "Fighter" });
    expect(hero.scores.STR).toBe(16);
  });
  it("clamps and rejects tampered links", () => {
    const hero = decodeShare(encode({ n: "x".repeat(99), l: 500, s: [99, -5, 10, 10, 10, 10] }));
    expect(hero.name).toHaveLength(40);
    expect(hero.level).toBe(99);
    expect(hero.scores.STR).toBe(20);
    expect(hero.scores.DEX).toBe(3);
    expect(decodeShare("#hero=not-json")).toBeNull();
    expect(decodeShare(encode({ s: [1, 2] }))).toBeNull();
    expect(decodeShare("")).toBeNull();
  });
});
