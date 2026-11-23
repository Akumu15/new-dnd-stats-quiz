// ── Trials: measured tests that confirm (or correct) an ability score ─────────
//
// The quiz is a self-estimate. A Trial is a real measurement. Each ability has one,
// it can be taken once every TRIAL_COOLDOWN_DAYS, and the result maps to a score through
// `table` ([threshold, score] pairs, best first). Taking a Trial earns TRIAL_XP for the rite.
//
// Trials are capped at TRIAL_MAX_SCORE (18): measurements can prove you're heroic,
// but 19–20 can only be earned through training.
//
// kind:
//   "number"     – do it in real life, enter the result (higher is better unless lowerIsBetter)
//   "digitspan"  – in-app memory test (longest sequence of digits recalled)
//   "innerclock" – in-app: stop a hidden timer at exactly 30 s, three tries, average error
//   "speech"     – in-app 60-second impromptu speech with a random prompt, then self-count stumbles

export const TRIAL_COOLDOWN_DAYS = 30;
export const TRIAL_XP = 25;
export const TRIAL_MAX_SCORE = 18;

export const TRIALS = [
  {
    stat: "STR",
    kind: "number",
    title: "The Iron Test",
    measure: "Push-ups in one unbroken set",
    unit: "push-ups",
    instructions: [
      "Warm up for a couple of minutes.",
      "Do as many full push-ups as you can in a row: chest near the floor, body straight.",
      "Stop when your form breaks. Knee push-ups count as half.",
    ],
    max: 300,
    table: [[80, 18], [70, 17], [60, 16], [50, 15], [40, 14], [35, 13], [30, 12], [25, 11], [20, 10], [15, 9], [10, 8], [5, 7], [1, 6], [0, 5]],
  },
  {
    stat: "DEX",
    kind: "number",
    title: "The Stork's Stillness",
    measure: "Seconds balanced on one leg, eyes closed (best of 3)",
    unit: "seconds",
    instructions: [
      "Stand barefoot on one leg, hands on your hips, near something you can grab.",
      "Close your eyes and start a timer.",
      "Stop when your foot moves, your raised foot touches down or you open your eyes. Take your best of 3 tries.",
    ],
    max: 600,
    table: [[90, 18], [75, 17], [60, 16], [50, 15], [40, 14], [30, 13], [25, 12], [20, 11], [15, 10], [12, 9], [8, 8], [5, 7], [3, 6], [0, 5]],
  },
  {
    stat: "CON",
    kind: "number",
    title: "The Twelve-Minute March",
    measure: "Distance covered in 12 minutes, running or walking (Cooper test)",
    unit: "meters",
    hint: "1 mile = 1,609 m. A standard running track is 400 m per lap.",
    instructions: [
      "Use a track, a treadmill or a running app that measures distance.",
      "Cover as much distance as you can in exactly 12 minutes. Walking is allowed.",
      "Stop if you feel unwell. Health comes first.",
    ],
    max: 6000,
    table: [[3400, 18], [3200, 17], [3000, 16], [2800, 15], [2600, 14], [2400, 13], [2200, 12], [2000, 11], [1800, 10], [1600, 9], [1400, 8], [1200, 7], [1000, 6], [0, 5]],
  },
  {
    stat: "INT",
    kind: "digitspan",
    title: "The Sage's Memory",
    measure: "Longest string of digits you can recall (digit span)",
    unit: "digits",
    instructions: [
      "Digits flash one at a time. Watch, then type them back in order.",
      "Each correct answer adds one more digit. You get two tries at each length.",
      "No writing anything down. The average adult remembers about 7.",
    ],
    table: [[12, 18], [11, 17], [10, 16], [9, 15], [8, 13], [7, 11], [6, 10], [5, 8], [4, 7], [3, 5], [0, 4]],
  },
  {
    stat: "WIS",
    kind: "innerclock",
    title: "The Seer's Sense",
    measure: "How closely you sense 30 seconds passing without a clock (average error)",
    unit: "% off",
    instructions: [
      "Press Start, then press Stop when you feel exactly 30 seconds have passed.",
      "No counting out loud, no tapping and no looking at a clock. Just sense it.",
      "You'll do it three times. Your average error is your measure.",
    ],
    lowerIsBetter: true,
    table: [[1, 18], [2, 17], [3, 16], [4, 15], [6, 14], [8, 13], [10, 12], [12, 11], [15, 10], [20, 9], [25, 8], [30, 7], [40, 6], [Infinity, 5]],
  },
  {
    stat: "CHA",
    kind: "speech",
    title: "The Herald's Challenge",
    measure: "Stumbles in a 60-second impromptu speech (long pauses, filler words, restarts)",
    unit: "stumbles",
    instructions: [
      "You'll get a random topic. Speak about it out loud for 60 seconds, ideally to a friend or a camera.",
      "Count each stumble: a pause of more than 3 seconds, an \"um\" or \"uh\", or starting a sentence over.",
      "Recording yourself and counting afterwards gives the most honest result.",
    ],
    lowerIsBetter: true,
    max: 99,
    table: [[0, 17], [1, 16], [2, 15], [3, 14], [4, 13], [5, 12], [6, 11], [8, 10], [10, 9], [13, 8], [16, 7], [20, 6], [Infinity, 5]],
    prompts: [
      "The best meal you've ever eaten",
      "Why your hometown is worth visiting",
      "A skill everyone should learn",
      "The most underrated invention",
      "What you'd do with a free year",
      "A book, film or game that changed you",
      "Convince us to adopt your favorite animal",
      "The perfect weekend",
      "A rule you would add to the world",
      "Why mornings are good (or terrible)",
      "Describe your ideal adventuring party",
      "A tradition you love",
    ],
  },
];

export function trialFor(stat) {
  return TRIALS.find((t) => t.stat === stat);
}
