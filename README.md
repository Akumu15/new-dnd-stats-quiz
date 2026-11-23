# Roll For Real 🎲

Find out what your D&D ability scores would be in real life, then train to level them up.

1. **Quiz**: 24 questions about your real habits (4 per ability), each answered on a 5-point scale.
2. **Character sheet**: a full parchment sheet with ability boxes, proficiency bonus, saving throws, 18 skills, AC, initiative, speed, HP and hit dice, plus class, background and title, and strengths and flaws in plain language.
3. **Quest Board**: real-world quests (gym, reading, meditation, socializing…) that slowly raise your scores. See *Progression* below.

4. **Trials**: one real measurement per ability, which can prove or correct your sheet. See *Trials* below.
5. **Sharing**: a parchment PNG card (the share sheet on phones, a download elsewhere) and a link that opens a read-only view of your hero.

6. **Party** (sign in with Google, or as a guest): parties of up to 6 with invite codes and links, a shared weekly boss that every claimed quest damages (double damage on its weak ability), loot for everyone when it falls, rallies to nudge friends, and a party chronicle. There's no punishment if the boss escapes. Signing in also syncs your hero to the cloud.

## Firebase

Project `roll-for-real-app` (Firestore in `nam5`). The web config in `src/lib/firebase.js` is public by design; access is enforced by `firestore.rules`.

| Collection | Contents | Who can read / write |
|---|---|---|
| `heroes/{uid}` | full private save | owner only |
| `cards/{uid}` | name, level, class, scores, streak, weekly damage | owner writes; party mates read |
| `parties/{code}` | name, founder, member uids (max 6) | get by code when signed in (no listing); join, leave and rename are validated |
| `parties/{code}/feed` | chronicle entries (fixed types, no free text) | members only; append-only |

Deploy rules with `npx firebase-tools deploy --only firestore:rules`. Sign-in providers (Google and Anonymous) and authorized domains are set in the Firebase console under Authentication.

## Quiz scale

The quiz maps to **3–18**, the classic human range. All-middle answers give an ordinary **10**, and only near-perfect answers reach 16–18. The legendary **19–20** can never come from the quiz; it must be earned through training.

## Trials

| Ability | Trial | How |
|---|---|---|
| STR | The Iron Test | Max push-ups in one set (entered) |
| DEX | The Stork's Stillness | One-leg balance with eyes closed, best of 3 (entered) |
| CON | The Twelve-Minute March | Cooper 12-minute distance (entered) |
| INT | The Sage's Memory | In-app digit-span memory test |
| WIS | The Seer's Sense | In-app: sense 30 seconds without a clock, average error over 3 tries |
| CHA | The Herald's Challenge | In-app 60-second impromptu speech on a random topic, then count your stumbles |

Each Trial can be taken once every 30 days and earns 25 XP. Results map to a score (tables in `src/data/trials.js`, capped at 18). If the result differs from the sheet, the player chooses whether to update it, and XP banked toward the next point is kept. A matching result in the last 90 days marks the stat **Proven**. Character level uses lifetime XP, so recalibrating a stat never lowers your level.

## Progression (balance)

Growth is meant to feel like real life: steady, and slower the better you get.

- **Focus:** choose 1 to 3 abilities to grow (the default is your two weakest).
- **Each day:** 3 quests. **2 come from your chosen abilities**, so they're always the majority, and **1 is a wildcard** from another ability (lower scores come up more often). With 3 choices, the two focus slots rotate among them; with 1 choice, it gets two different quests. Only 3 dailies can be claimed per day, so changing your focus doesn't unlock more.
- **Each week (Mon–Sun):** 2 bounties for your chosen abilities (a single choice gets one bounty plus a wildcard). Daily quests are worth 10 XP and bounties 35 XP.
- **Weekly training limit:** an ability absorbs at most **105 XP a week** from quests (`WEEKLY_STAT_XP_CAP`), so focusing on one ability can't speed it past the intended pace. XP beyond the limit still counts toward character level and the party boss.
- **Quests scale with you:** every quest has Novice (score 3–9), Adept (10–14) and Expert (15–20) versions. For example, 5 push-ups, then 12, then 20.
- **Points cost more as you climb** (`XP_TO_NEXT` in `src/data/quests.js`):

  | Score | 3–5 | 6–7 | 8–9 | 10–11 | 12–13 | 14 | 15 | 16 | 17 | 18 | 19 |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | XP for +1 | 120 | 150 | 200 | 300 | 450 | 800 | 1200 | 2500 | 5000 | 8000 | 12000 |
  | Perfect effort | ~1 wk | ~1.5 wk | ~2 wk | ~3 wk | ~1 mo | ~2 mo | ~3 mo | ~6 mo | ~11 mo | ~1.5 yr | ~2+ yr |

  In tabletop terms, 10–11 is an ordinary person, 15–16 is exceptional, and 17+ is heroic. A focused ability earns at most 105 XP a week, and real people manage about 60% of that, so expect real progress to take around 1.6× longer than the table shows.
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
