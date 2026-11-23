import { useCallback, useEffect, useRef, useState } from "react";
import { ABILITY_KEYS, ABILITIES } from "./data/gameData.js";
import { boardFor, buildSheet, computeBaseScores, dateKey, questById } from "./lib/scoring.js";
import { useCardPublisher, useCloud } from "./lib/useCloud.js";
import { postFeed } from "./lib/cloud.js";
import { isValidCode, normalizeCode } from "./lib/party.js";
import Party from "./components/Party.jsx";
import { canClaim } from "./lib/progression.js";
import { recalibrate, trialAvailability } from "./lib/trials.js";
import { decodeShare } from "./lib/share.js";
import { loadSave, writeSave } from "./lib/storage.js";
import { TRIAL_XP } from "./data/trials.js";
import Landing from "./components/Landing.jsx";
import Quiz from "./components/Quiz.jsx";
import CharacterSheet from "./components/CharacterSheet.jsx";
import Training from "./components/Training.jsx";
import Trials from "./components/Trials.jsx";
import SharedSheet from "./components/SharedSheet.jsx";

const emptyXp = () => Object.fromEntries(ABILITY_KEYS.map((k) => [k, 0]));

export default function App() {
  const [save, replaceSave] = useState(() => loadSave());
  const [shared, setShared] = useState(() => decodeShare(window.location.hash));
  // ?join=CODE invite links open the Party tab with the code filled in.
  const [inviteCode] = useState(() => {
    const c = normalizeCode(new URLSearchParams(window.location.search).get("join"));
    return isValidCode(c) ? c : "";
  });
  const [view, setView] = useState(() =>
    decodeShare(window.location.hash) ? "shared" : loadSave() ? (inviteCode ? "party" : "sheet") : "landing"
  );
  const [pendingName, setPendingName] = useState("");

  // Every change made on this device is stamped, so cloud sync knows which copy is newer.
  const setSave = useCallback(
    (updater) =>
      replaceSave((s) => {
        const next = typeof updater === "function" ? updater(s) : updater;
        return !next || next === s ? next : { ...next, updatedAt: Date.now() };
      }),
    []
  );

  const cloud = useCloud(save, replaceSave);
  const [memberCount, setMemberCount] = useState(1);
  useCardPublisher(cloud.user, cloud.ready, save, memberCount);

  // Tell the party when you level up.
  const level = save ? buildSheet(save).level : 0;
  const lastLevel = useRef(level);
  useEffect(() => {
    if (level > lastLevel.current && lastLevel.current > 0 && cloud.user && save?.partyId) {
      // Fixed id per hero and level: other tabs or devices that see the same level-up through
      // sync hit the same document, and the rules forbid overwriting it, so it's posted once.
      postFeed(
        save.partyId,
        { type: "level", fromUid: cloud.user.uid, fromName: save.name || "Nameless Hero", detail: String(level) },
        `level-${cloud.user.uid}-${level}`
      ).catch(() => {});
    }
    lastLevel.current = level;
  }, [level, cloud.user, save?.partyId, save?.name]);

  const leaveShared = () => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setShared(null);
    setView(save ? "sheet" : "landing");
  };

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
      trials: [],
      focus: null,
      partyId: save?.partyId || null, // a new character stays in the same party
      createdAt: new Date().toISOString(),
    });
    // Arrived through an invite link? Go straight to the party after the quiz.
    setView(inviteCode && !save?.partyId ? "party" : "sheet");
  };

  // Claim a quest from today's board. The board and its daily/weekly caps are re-checked here,
  // so XP can only be earned at the intended pace.
  const completeQuest = (questId) => {
    const today = dateKey();
    setSave((s) => {
      const board = boardFor(s, today);
      if (!canClaim(questId, board, s.history, today)) return s;
      const offer = [...board.daily, ...board.weekly].find((o) => o.quest.id === questId);
      const { stat, freq } = offer.quest;
      return {
        ...s,
        xp: { ...s.xp, [stat]: (s.xp[stat] || 0) + offer.xp },
        history: [...s.history, { questId, date: today, xp: offer.xp, stat, freq }],
      };
    });
  };

  // Undo a completion made today (for misclicks).
  const undoQuest = (questId) => {
    const today = dateKey();
    setSave((s) => {
      const index = s.history.findLastIndex((h) => h.questId === questId && h.date === today);
      if (index === -1) return s;
      const entry = s.history[index];
      const stat = entry.stat || questById(questId)?.stat;
      if (!stat) return s;
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

  // Record a Trial: always award the rite's XP, then optionally move the stat to the measured score.
  const recordTrial = (stat, raw, measured, apply) => {
    const today = dateKey();
    setSave((s) => {
      if (!trialAvailability(s, stat, today).available) return s;
      let base = s.base[stat];
      let xp = (s.xp[stat] || 0) + TRIAL_XP;
      if (apply) ({ base, xp } = recalibrate(base, xp, measured));
      return {
        ...s,
        base: { ...s.base, [stat]: base },
        xp: { ...s.xp, [stat]: xp },
        history: [...s.history, { questId: `trial-${stat}`, date: today, xp: TRIAL_XP, stat, freq: "trial" }],
        trials: [...(s.trials || []), { stat, date: today, raw, measured, applied: apply }],
      };
    });
    if (cloud.user && save?.partyId) {
      const ability = ABILITIES.find((a) => a.key === stat)?.name || stat;
      postFeed(save.partyId, {
        type: "trial",
        fromUid: cloud.user.uid,
        fromName: save.name || "Nameless Hero",
        detail: `${ability} measured ${measured}`,
      }).catch(() => {});
    }
  };

  const rename = (name) => setSave((s) => ({ ...s, name }));
  const setFocus = (focus) => setSave((s) => ({ ...s, focus }));

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => (shared ? leaveShared() : setView(save ? "sheet" : "landing"))}>
          <D20 /> Roll For Real
        </button>
        {save && view !== "quiz" && view !== "shared" && (
          <nav className="tabs" aria-label="Sections">
            <button className={view === "sheet" ? "tab active" : "tab"} onClick={() => setView("sheet")}>
              Character Sheet
            </button>
            <button className={view === "train" ? "tab active" : "tab"} onClick={() => setView("train")}>
              Quest Board
            </button>
            <button className={view === "trials" ? "tab active" : "tab"} onClick={() => setView("trials")}>
              Trials
            </button>
            <button className={view === "party" ? "tab active" : "tab"} onClick={() => setView("party")}>
              Party
            </button>
          </nav>
        )}
        {cloud.user && <SyncBadge status={cloud.status} />}
      </header>

      <main className="content">
        {view === "shared" && shared && <SharedSheet hero={shared} hasOwn={!!save} onRollYourOwn={leaveShared} />}
        {view === "landing" && <Landing onStart={startQuiz} />}
        {view === "quiz" && (
          <Quiz
            onFinish={finishQuiz}
            onCancel={() => setView(save ? "sheet" : "landing")}
          />
        )}
        {view === "sheet" && save && (
          <CharacterSheet save={save} onTrain={() => setView("train")} onTrials={() => setView("trials")} onRetake={retake} onRename={rename} />
        )}
        {view === "trials" && save && <Trials save={save} onRecord={recordTrial} />}
        {view === "party" && save && (
          <Party save={save} cloud={cloud} updateSave={setSave} inviteCode={inviteCode} onMembers={setMemberCount} />
        )}
        {view === "train" && save && (
          <Training save={save} onComplete={completeQuest} onUndo={undoQuest} onFocus={setFocus} />
        )}
      </main>

      <footer className="footer">
        <p>
          {cloud.user && !cloud.user.isAnonymous
            ? "Your character is saved to your account."
            : "Your character is kept in this browser. Sign in on the Party tab to keep it safe."}{" "}
          Made for fun, not a medical or psychological assessment.
        </p>
        <p>
          An unofficial fan project, not affiliated with or endorsed by Wizards of the Coast. Includes material from the
          System Reference Document 5.1 by Wizards of the Coast LLC, licensed under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer">CC-BY-4.0</a>.
        </p>
      </footer>
    </div>
  );
}

function SyncBadge({ status }) {
  const label = { syncing: "Saving…", saved: "Saved", error: "Offline", idle: "" }[status];
  if (!label) return null;
  return <span className={`sync-badge ${status}`} title="Cloud save">☁ {label}</span>;
}

// Original twenty-sided die mark (simple geometric outline).
function D20() {
  return (
    <svg className="d20" viewBox="0 0 32 32" aria-hidden="true">
      <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <polygon points="16,8 23.5,21 8.5,21" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 2 16 8 M3 9.5 16 8 29 9.5 M3 9.5 8.5 21 M29 9.5 23.5 21 M3 22.5 8.5 21 M29 22.5 23.5 21 M16 30 8.5 21 M16 30 23.5 21" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
