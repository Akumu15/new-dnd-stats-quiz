// Roll For Real: game data (abilities, questionnaire, classes, training quests).
// Each question has 5 answers scored 0–4. Four questions per ability give a raw 0–16,
// which is mapped onto the classic 3–20 ability score range (see lib/scoring.js).

export const ABILITIES = [
  { key: "STR", name: "Strength", icon: "💪", blurb: "Raw physical power: lifting, pushing, carrying." },
  { key: "DEX", name: "Dexterity", icon: "🏹", blurb: "Agility, balance, reflexes and skilled hands." },
  { key: "CON", name: "Constitution", icon: "🛡️", blurb: "Stamina, health, sleep and resilience." },
  { key: "INT", name: "Intelligence", icon: "📜", blurb: "Learning, reasoning, memory and curiosity." },
  { key: "WIS", name: "Wisdom", icon: "🦉", blurb: "Awareness, judgment, intuition and calm." },
  { key: "CHA", name: "Charisma", icon: "🎭", blurb: "Confidence, presence and connecting with people." },
];

export const ABILITY_KEYS = ABILITIES.map((a) => a.key);

export const QUESTIONS = [
  // Strength
  { stat: "STR", q: "How many push-ups can you do in a row? (Knee push-ups count as half.)",
    a: ["None yet", "1–5", "6–15", "16–30", "More than 30"] },
  { stat: "STR", q: "How often do you do strength training (weights, bodyweight, climbing, manual labor)?",
    a: ["Never", "A few times a year", "A few times a month", "Once or twice a week", "Three or more times a week"] },
  { stat: "STR", q: "Carrying a heavy suitcase up three flights of stairs would be…",
    a: ["Not happening", "Very hard, with many breaks", "Doable with a break", "Fine", "Easy. I'd take yours too"] },
  { stat: "STR", q: "When something heavy needs moving (furniture, groceries), you…",
    a: ["Ask someone else", "Help a little", "Do my share", "Usually take the heavy end", "Get called first"] },

  // Dexterity
  { stat: "DEX", q: "Standing on one leg with your eyes closed, how long can you balance?",
    a: ["A second or two", "About 5 seconds", "About 15 seconds", "About 30 seconds", "As long as I want"] },
  { stat: "DEX", q: "Sitting with your legs straight, can you touch your toes?",
    a: ["Not even close", "I reach my shins", "My fingertips just touch", "Palms on my toes", "Palms flat past my feet"] },
  { stat: "DEX", q: "Someone tosses you keys without warning. You…",
    a: ["Get hit", "Drop them", "Fumble, then catch them", "Usually catch them", "Snatch them out of the air"] },
  { stat: "DEX", q: "How good are your hand skills (instruments, drawing, crafts, sports, gaming)?",
    a: ["Clumsy with my hands", "Basic", "Decent at one thing", "Good at a few", "Highly skilled"] },

  // Constitution
  { stat: "CON", q: "On a typical night, how well do you sleep?",
    a: ["Badly, under 5 hours", "Restless, 5–6 hours", "Okay, about 6–7 hours", "Good, 7–8 hours", "Great, 7–9 solid hours"] },
  { stat: "CON", q: "Could you walk or jog for 30 minutes without stopping?",
    a: ["No", "I could walk it, but I'd be wiped out", "Walk it comfortably", "Jog it with effort", "Run it easily"] },
  { stat: "CON", q: "How often do you get sick (colds, flu)?",
    a: ["All the time", "Several times a year", "A couple of times a year", "Once a year", "Almost never"] },
  { stat: "CON", q: "How healthy are your eating and drinking habits (water, vegetables, less junk food)?",
    a: ["Pretty rough", "Mostly junk", "Mixed", "Mostly healthy", "Consistently healthy"] },

  // Intelligence
  { stat: "INT", q: "How many books (or long courses or podcast series) do you finish a year?",
    a: ["None", "1–2", "3–6", "7–15", "More than 15"] },
  { stat: "INT", q: "When you hit something you don't understand, you…",
    a: ["Ignore it", "Wonder about it, then move on", "Sometimes look it up", "Usually look it up", "Go down the rabbit hole"] },
  { stat: "INT", q: "Puzzles, strategy games, math or coding problems are…",
    a: ["Painful", "Not for me", "Okay sometimes", "Fun", "My favorite thing"] },
  { stat: "INT", q: "When did you last learn a genuinely new skill?",
    a: ["I can't remember", "Years ago", "In the last year", "In the last few months", "I'm learning one right now"] },

  // Wisdom
  { stat: "WIS", q: "How often do you notice how a friend feels before they say anything?",
    a: ["Almost never", "Rarely", "Sometimes", "Often", "Almost always"] },
  { stat: "WIS", q: "When you're angry or stressed, you…",
    a: ["React instantly and regret it later", "Often snap", "Sometimes pause", "Usually pause before acting", "Stay calm and choose my response"] },
  { stat: "WIS", q: "How often do you reflect (journal, meditate, think over your day)?",
    a: ["Never", "Rarely", "Monthly", "Weekly", "Daily"] },
  { stat: "WIS", q: "How often do people come to you for advice?",
    a: ["Never", "Rarely", "Sometimes", "Often", "I'm the friend everyone calls"] },

  // Charisma
  { stat: "CHA", q: "Starting a conversation with a stranger feels…",
    a: ["Terrifying", "Very uncomfortable", "A bit awkward", "Fine", "Natural and fun"] },
  { stat: "CHA", q: "Speaking in front of a group of 20 people would be…",
    a: ["My nightmare", "Very stressful", "Nerve-wracking but okay", "Comfortable", "Exciting. Give me the mic"] },
  { stat: "CHA", q: "How often do people invite you places or reach out first?",
    a: ["Almost never", "Rarely", "Sometimes", "Often", "Constantly"] },
  { stat: "CHA", q: "When you want to convince someone of something, you…",
    a: ["Don't even try", "Usually give up", "Win sometimes", "Usually persuade them", "Can rally a whole room"] },
];

// Class is chosen from the two highest abilities. Key = "PRIMARY+SECONDARY".
export const CLASS_BY_PAIR = {
  "STR+DEX": "Fighter", "STR+CON": "Barbarian", "STR+INT": "Spellblade", "STR+WIS": "Ranger", "STR+CHA": "Paladin",
  "DEX+STR": "Swashbuckler", "DEX+CON": "Monk", "DEX+INT": "Rogue", "DEX+WIS": "Ranger", "DEX+CHA": "Bard",
  "CON+STR": "Barbarian", "CON+DEX": "Monk", "CON+INT": "Tinker", "CON+WIS": "Druid", "CON+CHA": "Sorcerer",
  "INT+STR": "Spellblade", "INT+DEX": "Tinker", "INT+CON": "Wizard", "INT+WIS": "Wizard", "INT+CHA": "Warlock",
  "WIS+STR": "Cleric", "WIS+DEX": "Monk", "WIS+CON": "Druid", "WIS+INT": "Sage", "WIS+CHA": "Cleric",
  "CHA+STR": "Paladin", "CHA+DEX": "Bard", "CHA+CON": "Sorcerer", "CHA+INT": "Warlock", "CHA+WIS": "Bard",
};

export const CLASS_FLAVOR = {
  Fighter: "Disciplined and battle-ready. You meet challenges head-on.",
  Barbarian: "Tough as old leather. You push through what stops others.",
  Spellblade: "Brains and brawn: a rare blend of power and study.",
  Ranger: "Grounded, perceptive and at home in the wild.",
  Paladin: "Strong and inspiring. People follow your lead.",
  Swashbuckler: "Quick, bold and stylish. You move before others think.",
  Monk: "Balanced body and focused mind. Control is your weapon.",
  Rogue: "Clever and nimble. You find the angle nobody saw.",
  Bard: "Charming and quick-witted. Every room is your stage.",
  Tinker: "A maker and inventor. You build your way out of problems.",
  Druid: "Patient, resilient and in tune with the world around you.",
  Sorcerer: "Natural magnetism and staying power. Your presence is felt.",
  Wizard: "A scholar of the arcane. Knowledge is your power.",
  Warlock: "Sharp mind, silver tongue. Your deals tend to work in your favor.",
  Cleric: "Wise and steady. Others lean on your guidance.",
  Sage: "Thoughtful and learned. You see the bigger picture.",
  Adventurer: "Perfectly balanced. Every path is still open to you.",
};

// What each score band means, per ability (bands: 3–5, 6–9, 10–12, 13–16, 17–20).
export const TIER_TEXT = {
  STR: ["Feeble: everyday lifting is a struggle.", "Below average: there's room to build a base.", "Average adventurer strength.", "Strong: you could carry the party's gear.", "Mighty: a legend of strength."],
  DEX: ["Clumsy: balance and coordination need work.", "A little stiff and slow to react.", "Average agility.", "Nimble: quick hands and quick feet.", "Acrobatic: graceful and lightning-fast."],
  CON: ["Fragile: low energy and easily worn down.", "You get tired or sick more than you'd like.", "Average stamina.", "Hardy: you keep going and bounce back.", "Iron constitution."],
  INT: ["Learning has taken a back seat lately.", "Curious, but you rarely dig in.", "Average intellect.", "Sharp: you learn fast and love ideas.", "Brilliant: a true scholar."],
  WIS: ["Impulsive: you act first and think later.", "Often caught off guard by feelings.", "Average insight.", "Perceptive and level-headed.", "Sage-like calm and insight."],
  CHA: ["Very shy: people feel hard to reach.", "Reserved: you hold back socially.", "Average presence.", "Engaging: people enjoy your company.", "Magnetic: a natural leader."],
};

// ── Character sheet extras ─────────────────────────────────────────────
// Skill names come from the 5e System Reference Document 5.1 (CC-BY-4.0, see README).
export const SKILLS = [
  { name: "Athletics", stat: "STR" },
  { name: "Acrobatics", stat: "DEX" },
  { name: "Sleight of Hand", stat: "DEX" },
  { name: "Stealth", stat: "DEX" },
  { name: "Arcana", stat: "INT" },
  { name: "History", stat: "INT" },
  { name: "Investigation", stat: "INT" },
  { name: "Nature", stat: "INT" },
  { name: "Religion", stat: "INT" },
  { name: "Animal Handling", stat: "WIS" },
  { name: "Insight", stat: "WIS" },
  { name: "Medicine", stat: "WIS" },
  { name: "Perception", stat: "WIS" },
  { name: "Survival", stat: "WIS" },
  { name: "Deception", stat: "CHA" },
  { name: "Intimidation", stat: "CHA" },
  { name: "Performance", stat: "CHA" },
  { name: "Persuasion", stat: "CHA" },
];

// Background from your single strongest ability.
export const BACKGROUND_BY_STAT = {
  STR: "Soldier", DEX: "Wanderer", CON: "Laborer", INT: "Scholar", WIS: "Hermit", CHA: "Entertainer",
};

// Hit die by class (Tinker/Spellblade/Swashbuckler use d8/d10 like their nearest relatives).
export const HIT_DIE = {
  Barbarian: 12, Fighter: 10, Paladin: 10, Ranger: 10, Spellblade: 10,
  Swashbuckler: 8, Monk: 8, Rogue: 8, Bard: 8, Tinker: 8, Druid: 8, Cleric: 8, Warlock: 8,
  Sage: 6, Sorcerer: 6, Wizard: 6, Adventurer: 8,
};

// Title by character level (index = level - 1, last one repeats).
export const TITLES = ["Novice", "Apprentice", "Journeyman", "Adept", "Veteran", "Expert", "Champion", "Hero", "Legend"];

export const MIN_SCORE = 3;
export const MAX_SCORE = 20;
