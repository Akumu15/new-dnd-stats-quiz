// ── Quest pool and progression balance ────────────────────────────────────
//
// Every quest has three versions of its task, matched to the hero's current score
// in that ability, so a beginner and a veteran get a challenge that fits:
//   tier 0 "Novice" (score 3–9) · tier 1 "Adept" (10–14) · tier 2 "Expert" (15–20)
//
// BALANCE (see lib/progression.js):
//   • The board offers 3 daily quests per day and 2 weekly bounties per week, and only
//     that many can be completed. There's nothing to grind.
//   • Daily quest = 10 XP, weekly bounty = 35 XP.
//   • A focused ability gets 1 daily slot every day plus 1 bounty a week, so about 105 XP a week at most.
//   • Raising a score costs more the higher it is (XP_TO_NEXT below). At full effort:
//       8 → 9   ≈ 2 weeks      12 → 13 ≈ 4 weeks     12 → 15 ≈ 3 months
//       16 → 17 ≈ 9 weeks      18 → 20 ≈ 6 months

export const DAILY_XP = 10;
export const WEEKLY_XP = 35;
export const DAILY_SLOTS = 3; // daily quests offered (and completable) per day
export const WEEKLY_SLOTS = 2; // bounties offered (and completable) per week
export const MAX_FOCUS = 2;

/** XP needed to go from score s to s + 1. Index = current score. */
export const XP_TO_NEXT = {
  3: 120, 4: 120, 5: 120,
  6: 150, 7: 150,
  8: 200, 9: 200,
  10: 300, 11: 300,
  12: 400, 13: 400,
  14: 600, 15: 600,
  16: 900, 17: 900,
  18: 1300, 19: 1300,
};

/** Best-case XP a single focused ability can earn in a week (1 daily/day + 1 bounty). */
export const MAX_FOCUS_XP_PER_WEEK = 7 * DAILY_XP + WEEKLY_XP;

export const TIER_NAMES = ["Novice", "Adept", "Expert"];

export function tierForScore(score) {
  if (score <= 9) return 0;
  if (score <= 14) return 1;
  return 2;
}

// freq: "daily" | "weekly". tasks: [novice, adept, expert].
export const QUESTS = [
  // ── Strength ──
  { id: "str-pushups", stat: "STR", freq: "daily", title: "The Iron Press", tasks: [
    "Do 3 sets of 5 push-ups (on your knees is fine).",
    "Do 4 sets of 12 push-ups.",
    "Do 5 sets of 20 push-ups, or 4 sets of weighted dips." ] },
  { id: "str-squats", stat: "STR", freq: "daily", title: "Legs of the Mountain", tasks: [
    "Do 3 sets of 10 bodyweight squats.",
    "Do 4 sets of 20 squats, or 3 sets of 10 lunges per leg.",
    "Do 5 sets of 15 jump squats, or a heavy squat session." ] },
  { id: "str-plank", stat: "STR", freq: "daily", title: "Hold the Line", tasks: [
    "Hold a plank 3 times for 20 seconds.",
    "Hold a plank 3 times for 60 seconds.",
    "Hold a plank 3 times for 2 minutes, plus 60-second side planks." ] },
  { id: "str-pull", stat: "STR", freq: "daily", title: "Haul the Anchor", tasks: [
    "Do 3 sets of 10 rows using a loaded backpack or water jugs.",
    "Do 3 sets of 8 pull-ups or inverted rows.",
    "Do 5 sets of 8 pull-ups, or a 10-minute heavy carry." ] },
  { id: "str-grip", stat: "STR", freq: "daily", title: "Grip of the Giant", tasks: [
    "Hang from a bar 3 times for 10 seconds.",
    "Hang from a bar 3 times for 30 seconds.",
    "Hang 3 times for 60 seconds, or do farmer's carries until your grip fails." ] },
  { id: "str-session", stat: "STR", freq: "weekly", title: "Bounty: Forge the Body", tasks: [
    "Complete two 20-minute full-body strength workouts this week.",
    "Complete three 40-minute strength workouts this week.",
    "Complete four structured strength sessions and beat a previous weight or rep count." ] },
  { id: "str-record", stat: "STR", freq: "weekly", title: "Bounty: Test of Might", tasks: [
    "Test your max push-ups in one set and record it.",
    "Beat your previous max push-ups or plank time.",
    "Set a new personal record in any lift." ] },

  // ── Dexterity ──
  { id: "dex-stretch", stat: "DEX", freq: "daily", title: "Limber the Limbs", tasks: [
    "Stretch for 5 minutes: hamstrings, hips and shoulders.",
    "Do a 15-minute stretching routine.",
    "Do a 25-minute mobility routine with deep hip and shoulder work." ] },
  { id: "dex-balance", stat: "DEX", freq: "daily", title: "Stork Stance", tasks: [
    "Balance on each leg for 30 seconds.",
    "Balance on each leg for 60 seconds with your eyes closed.",
    "Do 3 sets of 8 single-leg deadlifts or pistol squat progressions per leg." ] },
  { id: "dex-craft", stat: "DEX", freq: "daily", title: "Practice Your Craft", tasks: [
    "Spend 10 minutes on a hand skill: an instrument, drawing, knots or cards.",
    "Spend 20 minutes of focused practice on a hand skill.",
    "Spend 40 minutes of deliberate practice, then record and review yourself." ] },
  { id: "dex-feet", stat: "DEX", freq: "daily", title: "Quick Feet", tasks: [
    "Jump rope or dance for 3 minutes.",
    "Do 10 minutes of jump rope or agility ladder drills.",
    "Do 15 minutes of footwork intervals: rope, ladder or shadow boxing." ] },
  { id: "dex-juggle", stat: "DEX", freq: "daily", title: "Juggler's Trial", tasks: [
    "Practice tossing and catching 2 balls for 5 minutes.",
    "Practice 3-ball juggling for 10 minutes.",
    "Learn or drill a new juggling or catching trick for 15 minutes." ] },
  { id: "dex-agility", stat: "DEX", freq: "weekly", title: "Bounty: The Agility Trial", tasks: [
    "Do one 30-minute sport, dance, climbing or yoga session.",
    "Do two 45-minute sport, dance, climbing or yoga sessions.",
    "Do three sessions this week, including one where you learn a new move or skill." ] },
  { id: "dex-reach", stat: "DEX", freq: "weekly", title: "Bounty: Bend Like the Willow", tasks: [
    "Measure how far you can reach toward your toes and write it down.",
    "Beat last week's reach, or hold a deep squat for 2 minutes.",
    "Make measurable progress on a split, bridge or advanced yoga pose." ] },

  // ── Constitution ──
  { id: "con-sleep", stat: "CON", freq: "daily", title: "The Long Rest", tasks: [
    "Get to bed at a set time and sleep 7 hours.",
    "Sleep 7.5 hours or more, with screens off 30 minutes before bed.",
    "Sleep 8 hours and wake at the same time as yesterday, with screens off an hour before bed." ] },
  { id: "con-water", stat: "CON", freq: "daily", title: "Potion of Vigor", tasks: [
    "Drink 6 glasses of water today.",
    "Drink 8 glasses of water today.",
    "Drink 8 glasses of water and have no sugary drinks." ] },
  { id: "con-walk", stat: "CON", freq: "daily", title: "Overland Travel", tasks: [
    "Walk for 15 minutes.",
    "Walk briskly or jog for 30 minutes.",
    "Run, swim or cycle for 45 minutes." ] },
  { id: "con-food", stat: "CON", freq: "daily", title: "Rations of the Realm", tasks: [
    "Eat one serving of fruit or vegetables with a meal.",
    "Eat vegetables with two meals today.",
    "Eat 5 servings of fruit and vegetables, and cook one meal yourself." ] },
  { id: "con-abstain", stat: "CON", freq: "daily", title: "The Ascetic's Vow", tasks: [
    "No snacks after dinner tonight.",
    "No junk food today.",
    "No junk food or alcohol today, with protein at every meal." ] },
  { id: "con-endure", stat: "CON", freq: "weekly", title: "Bounty: The Long March", tasks: [
    "Take three 20-minute walks this week.",
    "Do two 30-minute runs, rides or swims this week.",
    "Do one 60-minute or longer endurance session plus two shorter ones." ] },
  { id: "con-recover", stat: "CON", freq: "weekly", title: "Bounty: Sanctuary", tasks: [
    "Take a true rest day: stretch, sleep in and go one hour without screens.",
    "Take a recovery day with a long walk, stretching and an early night.",
    "Plan a full recovery day: mobility work, a sauna or bath, and 9 hours of sleep." ] },

  // ── Intelligence ──
  { id: "int-read", stat: "INT", freq: "daily", title: "Study the Tomes", tasks: [
    "Read a book (not social media) for 10 minutes.",
    "Read a book for 25 minutes.",
    "Read nonfiction for 45 minutes and take notes." ] },
  { id: "int-learn", stat: "INT", freq: "daily", title: "Arcane Research", tasks: [
    "Spend 10 minutes on a course or language app.",
    "Spend 25 minutes learning a new skill or language.",
    "Spend 45 minutes in deliberate study, then quiz yourself without notes." ] },
  { id: "int-puzzle", stat: "INT", freq: "daily", title: "The Sphinx's Riddle", tasks: [
    "Solve one puzzle: sudoku, a crossword or a riddle.",
    "Solve a hard puzzle or 10 chess tactics.",
    "Spend 20 minutes on a hard logic, math or coding problem." ] },
  { id: "int-scribe", stat: "INT", freq: "daily", title: "The Scribe's Summary", tasks: [
    "Write down 3 things you learned today.",
    "Explain a new concept in a paragraph, as if to a friend.",
    "Write 300 words teaching something you learned this week." ] },
  { id: "int-curious", stat: "INT", freq: "daily", title: "The Curious Mind", tasks: [
    "Look up one thing you've wondered about.",
    "Watch or read a long explainer on an unfamiliar topic.",
    "Read a primary source, such as a research paper, original document or textbook chapter." ] },
  { id: "int-finish", stat: "INT", freq: "weekly", title: "Bounty: Close the Book", tasks: [
    "Finish one chapter of a book this week.",
    "Read 100 pages, or finish a course module.",
    "Finish a whole book or course and write a summary." ] },
  { id: "int-build", stat: "INT", freq: "weekly", title: "Bounty: The Artificer's Proof", tasks: [
    "Make a one-page note or mind map of something you studied.",
    "Build a small project that uses what you learned.",
    "Teach it: give a talk, write a post or tutor someone." ] },

  // ── Wisdom ──
  { id: "wis-meditate", stat: "WIS", freq: "daily", title: "Still Waters", tasks: [
    "Sit quietly and breathe for 3 minutes.",
    "Meditate for 10 minutes.",
    "Meditate for 20 minutes without guidance." ] },
  { id: "wis-journal", stat: "WIS", freq: "daily", title: "The Scribe's Journal", tasks: [
    "Write 3 lines about your day.",
    "Write a page: what went well, what didn't, and why.",
    "Reflect in writing on one decision: what you knew, what you felt and what you'd change." ] },
  { id: "wis-nature", stat: "WIS", freq: "daily", title: "Commune with Nature", tasks: [
    "Spend 10 minutes outside without your phone.",
    "Spend 20 minutes outside without your phone, noticing 5 things you usually miss.",
    "Take a 45-minute mindful walk with no phone and no podcast." ] },
  { id: "wis-listen", stat: "WIS", freq: "daily", title: "The Listening Ear", tasks: [
    "In one conversation, ask a follow-up question instead of sharing your own story.",
    "Notice what a friend is feeling and name it gently.",
    "Have a deep conversation where you speak less than a third of the time." ] },
  { id: "wis-pause", stat: "WIS", freq: "daily", title: "The Pause", tasks: [
    "Notice one impulse today and wait 10 seconds before acting on it.",
    "Go the first 30 minutes after waking without your phone.",
    "Go the first hour after waking without your phone or any news." ] },
  { id: "wis-council", stat: "WIS", freq: "weekly", title: "Bounty: Council of One", tasks: [
    "Write down 3 wins and 1 lesson from this week.",
    "Review your week and set one clear goal for next week.",
    "Do a weekly review and check how you're doing on your monthly goals." ] },
  { id: "wis-fast", stat: "WIS", freq: "weekly", title: "Bounty: The Silent Vigil", tasks: [
    "Spend 2 hours completely screen-free.",
    "Spend half a day screen-free.",
    "Spend a full day screen-free." ] },

  // ── Charisma ──
  { id: "cha-kind", stat: "CHA", freq: "daily", title: "Words of Warmth", tasks: [
    "Give someone a sincere compliment.",
    "Give a specific, sincere compliment to someone you don't know well.",
    "Give three people a specific compliment or thanks." ] },
  { id: "cha-stranger", stat: "CHA", freq: "daily", title: "The Stranger's Greeting", tasks: [
    "Greet a stranger or cashier with eye contact and a smile.",
    "Have a short conversation with a stranger.",
    "Start a conversation with someone who intimidates you a little." ] },
  { id: "cha-raven", stat: "CHA", freq: "daily", title: "Send a Raven", tasks: [
    "Message a friend you haven't talked to in a while.",
    "Call a friend instead of texting.",
    "Make plans to meet a friend in person." ] },
  { id: "cha-speak", stat: "CHA", freq: "daily", title: "Raise Your Voice", tasks: [
    "Share an opinion in a group conversation.",
    "Ask a question or make a point in a meeting or class.",
    "Lead a discussion or tell a story to a group." ] },
  { id: "cha-presence", stat: "CHA", freq: "daily", title: "Bearing of a Noble", tasks: [
    "Practice good posture and eye contact in every conversation today.",
    "Record yourself talking for 1 minute and watch it back.",
    "Rehearse a 3-minute talk out loud, then refine it." ] },
  { id: "cha-party", stat: "CHA", freq: "weekly", title: "Bounty: Rally the Party", tasks: [
    "Go to a social event or group activity.",
    "Organize a hangout, game night or group outing.",
    "Host an event, or start a new recurring group." ] },
  { id: "cha-stage", stat: "CHA", freq: "weekly", title: "Bounty: Take the Stage", tasks: [
    "Tell a story to a friend from start to finish.",
    "Speak or perform in front of a small group.",
    "Present or perform in public, or at work in front of 10 or more people." ] },
];

export function questById(id) {
  return QUESTS.find((q) => q.id === id);
}
