import { useState } from "react";
import { ABILITIES, QUESTS } from "../data/gameData.js";
import {
  cooldownDays,
  currentScores,
  dateKey,
  lastCompletions,
  questById,
  streak,
  weakestAbilities,
} from "../lib/scoring.js";
import StatBlock from "./StatBlock.jsx";

const abilityByKey = Object.fromEntries(ABILITIES.map((a) => [a.key, a]));

export default function Training({ save, onComplete, onUndo }) {
  const scores = currentScores(save.base, save.xp);
  const focus = weakestAbilities(scores);
  const [filter, setFilter] = useState("focus");

  const today = dateKey();
  const last = lastCompletions(save.history);
  const todays = save.history.filter((h) => h.date === today);
  const todayXp = todays.reduce((s, h) => s + h.xp, 0);
  const days = streak(save.history, today);

  const shownStats = filter === "focus" ? focus : filter === "all" ? ABILITIES.map((a) => a.key) : [filter];
  const recent = [...save.history].reverse().slice(0, 8);

  return (
    <div className="board">
      <header className="board-head">
        <h1 className="board-title">The Quest Board</h1>
        <p className="board-sub">Real deeds, real growth. Complete a quest, claim its XP, and grow stronger.</p>
        <div className="board-stats">
          <div><strong>{todays.length}</strong><span>quests today</span></div>
          <div><strong>+{todayXp}</strong><span>XP today</span></div>
          <div><strong>{days}</strong><span>day streak</span></div>
        </div>
      </header>

      <div className="filters" role="tablist" aria-label="Filter quests">
        <FilterButton value="focus" current={filter} onSelect={setFilter}>★ Your path</FilterButton>
        <FilterButton value="all" current={filter} onSelect={setFilter}>All quests</FilterButton>
        {ABILITIES.map((a) => (
          <FilterButton key={a.key} value={a.key} current={filter} onSelect={setFilter}>{a.key}</FilterButton>
        ))}
      </div>
      {filter === "focus" && <p className="board-hint">These quests train your two weakest abilities, where every deed counts most.</p>}

      {shownStats.map((statKey) => {
        const ability = abilityByKey[statKey];
        const quests = QUESTS.filter((q) => q.stat === statKey);
        return (
          <section key={statKey} className="quest-row">
            <div className="quest-row-head">
              <StatBlock ability={ability} base={save.base[statKey]} xp={save.xp[statKey]} compact />
              <div>
                <h2>Trials of {ability.name}</h2>
                <p>{ability.blurb}</p>
              </div>
            </div>
            <ul className="notices">
              {quests.map((quest, i) => {
                const wait = cooldownDays(quest, last[quest.id], today);
                const doneToday = last[quest.id] === today;
                return (
                  <li key={quest.id} className={wait > 0 ? "notice done" : "notice"} style={{ "--tilt": `${((i % 3) - 1) * 0.8}deg` }}>
                    <span className="pin" aria-hidden="true" />
                    <div className="notice-kind">{quest.freq === "weekly" ? "Weekly Bounty" : "Daily Deed"}</div>
                    <h3>{quest.title}</h3>
                    <p>{quest.desc}</p>
                    <div className="notice-foot">
                      {wait === 0 ? (
                        <button className="btn-seal small" onClick={() => onComplete(quest.id)}>
                          Claim {quest.xp} XP
                        </button>
                      ) : doneToday ? (
                        <>
                          <span className="stamp">Completed</span>
                          <button className="link-ink" onClick={() => onUndo(quest.id)}>undo</button>
                        </>
                      ) : (
                        <span className="stamp muted">Returns in {wait} {wait === 1 ? "day" : "days"}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {recent.length > 0 && (
        <article className="parchment chronicle">
          <h2 className="section-title">Chronicle of Deeds</h2>
          <ul>
            {recent.map((h, i) => {
              const quest = questById(h.questId);
              return (
                <li key={`${h.questId}-${h.date}-${i}`}>
                  <span className="log-date">{h.date}</span>
                  <span>{quest ? quest.title : h.questId}</span>
                  <span className="log-xp">+{h.xp} {quest?.stat}</span>
                </li>
              );
            })}
          </ul>
        </article>
      )}
    </div>
  );
}

function FilterButton({ value, current, onSelect, children }) {
  return (
    <button
      role="tab"
      aria-selected={current === value}
      className={current === value ? "filter active" : "filter"}
      onClick={() => onSelect(value)}
    >
      {children}
    </button>
  );
}
