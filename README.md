# Roll For Real 🎲

Find out what your D&D ability scores would be in real life, then train to level them up.

1. **Quiz**: 24 questions about your real habits (4 per ability), each answered on a 5-point scale.
2. **Character sheet**: six ability scores (3–20) with modifiers, a class based on your top two stats, HP, AC and initiative, and a plain-language read of each score.
3. **Training**: daily and weekly real-world quests for each ability. Every 100 XP raises that ability by 1 (up to 20), and every 300 total XP is a character level. The Focus tab shows quests for your two weakest stats.

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

## Where things live

- `src/data/gameData.js`: questions, classes, score descriptions and training quests. Edit these to tune the game.
- `src/lib/scoring.js`: all the math (score mapping, modifiers, class pick, cooldowns, streaks).
- `src/components/`: screens (Landing, Quiz, CharacterSheet, Training).
