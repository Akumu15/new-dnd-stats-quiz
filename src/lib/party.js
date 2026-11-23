// Party logic that doesn't touch the network: invite codes, the weekly boss, damage, loot.
import { ABILITY_KEYS } from "../data/gameData.js";
import { weekKey } from "./progression.js";
import { questById } from "../data/quests.js";

export const MAX_PARTY = 6;
export const BOSS_HP_PER_HERO = 160; // ~60% effort from every member beats it by Sunday
export const LOOT_XP = 50;

// No I, O, 0 or 1, so codes are easy to read out loud.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePartyCode(random = Math.random) {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]).join("");
}

export function normalizeCode(code) {
  return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function isValidCode(code) {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(code);
}

// ── Weekly boss ───────────────────────────────────────────────────────

export const BOSSES = [
  { name: "The Sloth Wyrm", flavor: "It coils around couches and whispers: 'tomorrow.'" },
  { name: "The Doomscroll Lich", flavor: "It feeds on stolen hours and blue light." },
  { name: "The Procrastination Hydra", flavor: "Cut one excuse and two more grow back." },
  { name: "The Couch Kraken", flavor: "Its tentacles pull heroes back into the cushions." },
  { name: "The Gloom Golem", flavor: "A lumbering heap of grey moods and skipped walks." },
  { name: "The Sugar Fiend", flavor: "Sweet-voiced, sticky-fingered and never satisfied." },
  { name: "The Night-Owl Vampire", flavor: "It drains your sleep one 'last episode' at a time." },
  { name: "The Excuse Imps", flavor: "A chattering swarm of 'too busy' and 'not today.'" },
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The boss is the same for every member: derived from the party code and the week. */
export function bossFor(code, week, memberCount) {
  const h = hash(`${code}|${week}`);
  const boss = BOSSES[h % BOSSES.length];
  const weakness = ABILITY_KEYS[Math.floor(h / BOSSES.length) % ABILITY_KEYS.length];
  return { ...boss, weakness, hp: BOSS_HP_PER_HERO * Math.max(1, memberCount), week };
}

/**
 * Damage a hero dealt this week: XP from claimed quests (not Trials or loot).
 * Quests for the boss's weak ability deal double damage.
 */
export function weekDamageFor(history, today, weakness) {
  const week = weekKey(today);
  let dmg = 0;
  for (const h of history || []) {
    if (h.freq !== "daily" && h.freq !== "weekly") continue;
    if (weekKey(h.date) !== week) continue;
    const stat = h.stat || questById(h.questId)?.stat;
    dmg += (h.xp || 0) * (stat === weakness ? 2 : 1);
  }
  return Math.min(2000, Math.round(dmg));
}

/** Total damage from member cards that belong to this week. */
export function partyDamage(cards, week) {
  return cards.reduce((sum, c) => sum + (c && c.week === week ? c.weekDamage || 0 : 0), 0);
}

export function hasClaimedLoot(save, code, week) {
  return (save.trophies || []).some((t) => t.party === code && t.week === week);
}
