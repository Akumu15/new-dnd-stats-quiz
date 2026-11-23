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
  const todayCount = save.history.filter((h) => h.date === today).length;
  const todayXp = save.history.filter((h) => h.date === today).reduce((s, h) => s + h.xp, 0);
  const days = streak(save.history, today);

  const shownStats = filter === "focus" ? focus : filter === "all" ? ABILITIES.map((a) => a.key) : [filter];
  const recent = [...save.history].reverse().slice(0, 8);

  return (
    <section className="training">
      <div className="card training-summary">
        <div><span>Today</span><strong>{todayCount} quests</strong></div>
        <div><span>XP today</span><strong>+{todayXp}</strong></div>
        <div><span>Streak</span><strong>{days} {days === 1 ? "day" : "days"} 🔥</strong></div>
      </div>

      <div className="filters" role="tablist" aria-label="Filter quests">
        <FilterButton value="focus" current={filter} onSelect={setFilter}>⭐ Focus</FilterButton>
        <FilterButton value="all" current={filter} onSelect={setFilter}>All</FilterButton>
        {ABILITIES.map((a) => (
          <FilterButton key={a.key} value={a.key} current={filter} onSelect={setFilter}>
            {a.icon} {a.key}
          </FilterButton>
        ))}
      </div>

      {filter === "focus" && (
        <p className="hint">These are quests for your two lowest stats, where training pays off most.</p>
      )}

      {shownStats.map((statKey) => {
        const ability = abilityByKey[statKey];
        const quests = QUESTS.filter((q) => q.stat === statKey);
        return (
          <div key={statKey} className="quest-group">
            <div className="quest-group-head">
              <StatBlock ability={ability} base={save.base[statKey]} xp={save.xp[statKey]} />
              <p>{ability.blurb}</p>
            </div>
            <ul className="quest-list">
              {quests.map((quest) => {
                const wait = cooldownDays(quest, last[quest.id], today);
                const doneToday = last[quest.id] === today;
                return (
                  <li key={quest.id} className={wait > 0 ? "quest done" : "quest"}>
                    <div className="quest-body">
                      <div className="quest-title">
                        {quest.title}
                        <span className="tag">{quest.freq}</span>
                      </div>
                      <div className="quest-desc">{quest.desc}</div>
                    </div>
                    <div className="quest-action">
                      {wait === 0 ? (
                        <button className="btn small primary" onClick={() => onComplete(quest.id)}>
                          +{quest.xp} XP
                        </button>
                      ) : doneToday ? (
                        <button className="btn small ghost" onClick={() => onUndo(quest.id)} title="Undo today's completion">
                          ✓ Done · undo
                        </button>
                      ) : (
                        <span className="cooldown">✓ Back in {wait} {wait === 1 ? "day" : "days"}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {recent.length > 0 && (
        <div className="card log">
          <h2>Adventure log</h2>
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
        </div>
      )}
    </section>
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
