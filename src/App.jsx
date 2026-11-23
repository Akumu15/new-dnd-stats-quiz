import { useEffect, useState } from "react";
import { ABILITY_KEYS } from "./data/gameData.js";
import { computeBaseScores, dateKey, questById } from "./lib/scoring.js";
import { loadSave, writeSave } from "./lib/storage.js";
import Landing from "./components/Landing.jsx";
import Quiz from "./components/Quiz.jsx";
import CharacterSheet from "./components/CharacterSheet.jsx";
import Training from "./components/Training.jsx";

const emptyXp = () => Object.fromEntries(ABILITY_KEYS.map((k) => [k, 0]));

export default function App() {
  const [save, setSave] = useState(() => loadSave());
  const [view, setView] = useState(() => (loadSave() ? "sheet" : "landing"));
  const [pendingName, setPendingName] = useState("");

  useEffect(() => {
    writeSave(save);
  }, [save]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const startQuiz = (name) => {
    setPendingName(name);
    setView("quiz");
  };

  const finishQuiz = (answers) => {
    setSave({
      name: pendingName || save?.name || "",
      answers,
      base: computeBaseScores(answers),
      xp: emptyXp(),
      history: [],
      createdAt: new Date().toISOString(),
    });
    setView("sheet");
  };

  const completeQuest = (questId) => {
    const quest = questById(questId);
    if (!quest) return;
    setSave((s) => ({
      ...s,
      xp: { ...s.xp, [quest.stat]: (s.xp[quest.stat] || 0) + quest.xp },
      history: [...s.history, { questId, date: dateKey(), xp: quest.xp }],
    }));
  };

  // Undo today's completion of a quest (for misclicks).
  const undoQuest = (questId) => {
    const today = dateKey();
    setSave((s) => {
      const index = s.history.findLastIndex((h) => h.questId === questId && h.date === today);
      if (index === -1) return s;
      const entry = s.history[index];
      const stat = questById(questId).stat;
      return {
        ...s,
        xp: { ...s.xp, [stat]: Math.max(0, (s.xp[stat] || 0) - entry.xp) },
        history: s.history.filter((_, i) => i !== index),
      };
    });
  };

  const retake = () => {
    if (window.confirm("Retake the quiz? This resets your scores and training progress.")) {
      setPendingName(save?.name || "");
      setView("quiz");
    }
  };

  const rename = (name) => setSave((s) => ({ ...s, name }));

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setView(save ? "sheet" : "landing")}>
          <span aria-hidden="true">🎲</span> Roll For Real
        </button>
        {save && view !== "quiz" && (
          <nav className="tabs" aria-label="Sections">
            <button className={view === "sheet" ? "tab active" : "tab"} onClick={() => setView("sheet")}>
              Character
            </button>
            <button className={view === "train" ? "tab active" : "tab"} onClick={() => setView("train")}>
              Training
            </button>
          </nav>
        )}
      </header>

      <main className="content">
        {view === "landing" && <Landing onStart={startQuiz} />}
        {view === "quiz" && (
          <Quiz
            onFinish={finishQuiz}
            onCancel={() => setView(save ? "sheet" : "landing")}
          />
        )}
        {view === "sheet" && save && (
          <CharacterSheet save={save} onTrain={() => setView("train")} onRetake={retake} onRename={rename} />
        )}
        {view === "train" && save && (
          <Training save={save} onComplete={completeQuest} onUndo={undoQuest} />
        )}
      </main>

      <footer className="footer">
        Your character is saved in this browser only. Just for fun, not a medical or psychological assessment.
      </footer>
    </div>
  );
}
