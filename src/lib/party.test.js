import { describe, it, expect } from "vitest";
import {
  BOSS_HP_PER_HERO,
  BOSSES,
  bossFor,
  generatePartyCode,
  hasClaimedLoot,
  isValidCode,
  normalizeCode,
  partyDamage,
  weekDamageFor,
} from "./party.js";
import { ABILITY_KEYS } from "../data/gameData.js";

describe("party codes", () => {
  it("generates readable 6-character codes", () => {
    for (let i = 0; i < 200; i++) {
      const c = generatePartyCode();
      expect(isValidCode(c)).toBe(true);
      expect(c).not.toMatch(/[IO01]/);
    }
  });
  it("normalizes what people type", () => {
    expect(normalizeCode(" abc-23x ")).toBe("ABC23X");
    expect(isValidCode("ABC23")).toBe(false);
    expect(isValidCode("ABCIO1")).toBe(false);
  });
});

describe("weekly boss", () => {
  it("is the same for everyone in the party and changes weekly", () => {
    expect(bossFor("ABC234", "2026-11-23", 3)).toEqual(bossFor("ABC234", "2026-11-23", 3));
    const names = new Set(["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"].map((w) => bossFor("ABC234", w, 3).name));
    expect(names.size).toBeGreaterThan(1);
  });
  it("scales HP with party size and has a valid weakness", () => {
    const b = bossFor("XYZ789", "2026-11-23", 4);
    expect(b.hp).toBe(4 * BOSS_HP_PER_HERO);
    expect(ABILITY_KEYS).toContain(b.weakness);
    expect(BOSSES.map((x) => x.name)).toContain(b.name);
  });
});

describe("damage", () => {
  const history = [
    { questId: "str-pushups", date: "2026-11-23", xp: 10, stat: "STR", freq: "daily" },
    { questId: "int-read", date: "2026-11-24", xp: 10, stat: "INT", freq: "daily" },
    { questId: "str-session", date: "2026-11-25", xp: 35, stat: "STR", freq: "weekly" },
    { questId: "int-read", date: "2026-11-20", xp: 10, stat: "INT", freq: "daily" }, // last week
    { questId: "trial-STR", date: "2026-11-24", xp: 25, stat: "STR", freq: "trial" }, // trials don't hit
    { questId: "loot-x", date: "2026-11-24", xp: 50, stat: null, freq: "loot" }, // loot doesn't hit
  ];
  it("counts this week's quests, doubling the boss's weakness", () => {
    expect(weekDamageFor(history, "2026-11-26", "STR")).toBe(10 * 2 + 10 + 35 * 2);
    expect(weekDamageFor(history, "2026-11-26", "CHA")).toBe(55);
  });
  it("sums only cards from the current week", () => {
    const cards = [{ week: "2026-11-23", weekDamage: 100 }, { week: "2026-11-16", weekDamage: 500 }, null];
    expect(partyDamage(cards, "2026-11-23")).toBe(100);
  });
  it("tracks loot per party and week", () => {
    const save = { trophies: [{ party: "ABC234", week: "2026-11-23", boss: "x" }] };
    expect(hasClaimedLoot(save, "ABC234", "2026-11-23")).toBe(true);
    expect(hasClaimedLoot(save, "ABC234", "2026-11-30")).toBe(false);
  });
});
