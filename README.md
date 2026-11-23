# Roll For Real 🎲

Find out what your D&D ability scores would be in real life, then train to level them up.

1. **Quiz**: 24 questions about your real habits (4 per ability), each answered on a 5-point scale.
2. **Character sheet**: a full parchment sheet with ability boxes, proficiency bonus, saving throws, 18 skills, AC, initiative, speed, HP and hit dice, plus class, background and title, and strengths and flaws in plain language.
3. **Quest Board**: real-world quests (gym, reading, meditation, socializing…) that slowly raise your scores. See *Progression* below.

## Progression (balance)

Growth is meant to feel like real life: steady, and slower the better you get.

- **Focus:** pick up to 2 abilities to train (the default is your two weakest).
- **Each day:** 3 quests, one per focus ability plus a *wildcard* from another ability (lower scores come up more often). Only 3 dailies can be claimed per day, so changing your focus doesn't unlock more.
- **Each week (Mon–Sun):** 2 bounties, one per focus ability. Daily quests are worth 10 XP and bounties 35 XP.
- **Quests scale with you:** every quest has Novice (score 3–9), Adept (10–14) and Expert (15–20) versions. For example, 5 push-ups, then 12, then 20.
- **Points cost more as you climb** (`XP_TO_NEXT` in `src/data/quests.js`):

  | Score | 3–5 | 6–7 | 8–9 | 10–11 | 12–13 | 14–15 | 16–17 | 18–19 |
  |---|---|---|---|---|---|---|---|---|
  | XP per point | 120 | 150 | 200 | 300 | 400 | 600 | 900 | 1300 |

  A focused ability earns at most about 105 XP a week, so at perfect effort 12→13 takes about 4 weeks, 12→15 about 3 months, and 18→20 about 6 months.
- **Character level** follows a rising curve: level *n* needs 125·n·(n−1) total XP (L2 250, L3 750, L5 2500).

The tests in `src/lib/progression.test.js` simulate a perfect player to keep this pace from drifting.

Progress is saved in the browser (localStorage). There's no account or backend yet.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/new-dnd-stats-quiz/
npm test         # scoring unit tests
npm run build    # production build into dist/
```

## Deploy to GitHub Pages

```bash
npm run deploy   # builds and pushes dist/ to the gh-pages branch
```

Live at https://akumu15.github.io/new-dnd-stats-quiz/

## Look and feel

The app is styled as an aged parchment character sheet on a tavern table, with an original layout,
fonts (Cinzel, EB Garamond) and artwork. It doesn't use official logos, art or the official sheet design.

## Legal

Unofficial fan project, not affiliated with or endorsed by Wizards of the Coast.
Skill names, class names and rules terms come from the System Reference Document 5.1 by Wizards of the Coast LLC,
available at https://dnd.wizards.com/resources/systems-reference-document and licensed under
[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode). The same attribution appears in the app footer.

## Where things live

- `src/data/gameData.js`: quiz questions, classes, skills and score descriptions.
- `src/data/quests.js`: the quest pool, XP values, daily and weekly slots, and the cost table. Edit this file to tune the pace.
- `src/lib/progression.js`: XP-to-score conversion, board generation (seeded per day), quotas.
- `src/lib/scoring.js`: quiz scoring, modifiers, class pick and the full character sheet.
- `src/components/`: screens (Landing, Quiz, CharacterSheet, Training).
