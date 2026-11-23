import { ABILITIES, MAX_SCORE } from "../data/gameData.js";
import { DAILY_SLOTS, WEEKLY_SLOTS, MAX_FOCUS, TIER_NAMES, MAX_FOCUS_XP_PER_WEEK } from "../data/quests.js";
import { boardFor, currentScores, dateKey, heroFocus, questById, streak } from "../lib/scoring.js";
import { daysLeftInWeek, formatWeeks, periodProgress, questStatus, scoreProgress, weeksAtFullEffort } from "../lib/progression.js";

const abilityByKey = Object.fromEntries(ABILITIES.map((a) => [a.key, a]));

export default function Training({ save, onComplete, onUndo, onFocus }) {
  const today = dateKey();
  const scores = currentScores(save.base, save.xp);
  const focus = heroFocus(save);
  const board = boardFor(save, today);
  const period = periodProgress(save.history, today);
  const days = streak(save.history, today);
  const weekDaysLeft = daysLeftInWeek(today);
  const recent = [...save.history].reverse().slice(0, 10);

  const toggleFocus = (key) => {
    if (focus.includes(key)) {
      if (focus.length > 1) onFocus(focus.filter((k) => k !== key));
    } else {
      onFocus([...focus, key].slice(-MAX_FOCUS));
    }
  };

  return (
    <div className="board">
      <header className="board-head">
        <h1 className="board-title">The Quest Board</h1>
        <p className="board-sub">A few honest deeds each day. Real strength is built over seasons, not in a single night.</p>
        <div className="board-stats">
          <div><strong>{period.dailyDone.length}/{DAILY_SLOTS}</strong><span>today's quests</span></div>
          <div><strong>{period.weeklyDone.length}/{WEEKLY_SLOTS}</strong><span>weekly bounties</span></div>
          <div><strong>{days}</strong><span>day streak</span></div>
        </div>
      </header>

      {/* ── Focus picker ── */}
      <section className="parchment focus-panel">
        <h2 className="section-title">Your Training Focus</h2>
        <p className="panel-note">
          Choose up to {MAX_FOCUS} abilities to train. Each day brings a quest for each one, plus a wildcard quest
          to keep the rest from rusting.
        </p>
        <div className="focus-options" role="group" aria-label="Training focus">
          {ABILITIES.map((a) => {
            const selected = focus.includes(a.key);
            const capped = scores[a.key] >= MAX_SCORE;
            return (
              <button
                key={a.key}
                className={selected ? "focus-chip selected" : "focus-chip"}
                aria-pressed={selected}
                disabled={capped && !selected}
                onClick={() => toggleFocus(a.key)}
                title={capped ? "Mastered" : undefined}
              >
                <span className="focus-abbr">{a.key}</span>
                <span className="focus-score">{scores[a.key]}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Today's quests ── */}
      <section className="quest-section">
        <div className="quest-section-head">
          <h2>Today's Quests</h2>
          <span>{period.dailyLeft > 0 ? `${period.dailyLeft} of ${DAILY_SLOTS} remaining · new quests at dawn` : "The day's work is done. Rest, hero."}</span>
        </div>
        <ul className="notices">
          {board.daily.map((offer, i) => (
            <Notice key={offer.quest.id} offer={offer} index={i} history={save.history} today={today} focus={focus} onComplete={onComplete} onUndo={onUndo} />
          ))}
        </ul>
      </section>

      {/* ── Weekly bounties ── */}
      <section className="quest-section">
        <div className="quest-section-head">
          <h2>This Week's Bounties</h2>
          <span>{period.weeklyLeft > 0 ? `Posted until Sunday · ${weekDaysLeft} ${weekDaysLeft === 1 ? "day" : "days"} left` : "All bounties claimed. New ones arrive Monday."}</span>
        </div>
        <ul className="notices">
          {board.weekly.map((offer, i) => (
            <Notice key={offer.quest.id} offer={offer} index={i + 1} history={save.history} today={today} focus={focus} onComplete={onComplete} onUndo={onUndo} />
          ))}
        </ul>
      </section>

      {/* ── Long road ── */}
      <article className="parchment road">
        <h2 className="section-title">The Long Road</h2>
        <p className="panel-note">
          Each point is harder won than the last. A score of 17 or more is the stuff of legend and takes years
          to reach. Estimates assume full focus, which earns an ability about {MAX_FOCUS_XP_PER_WEEK} XP a week.
        </p>
        <ul className="road-list">
          {ABILITIES.map((a) => {
            const p = scoreProgress(save.base[a.key], save.xp[a.key]);
            const weeks = p.capped ? 0 : weeksAtFullEffort(p.needed - p.into);
            return (
              <li key={a.key} className={focus.includes(a.key) ? "in-focus" : undefined}>
                <span className="road-name">{a.name}</span>
                <span className="road-score">{p.score}</span>
                <div className="road-bar" title={p.capped ? "Mastered" : `${p.into} / ${p.needed} XP`}>
                  <div className="road-fill" style={{ width: `${p.progress * 100}%` }} />
                </div>
                <span className="road-eta">
                  {p.capped ? "Mastered" : `${p.into}/${p.needed} XP · ~${formatWeeks(weeks)} to ${p.score + 1}`}
                </span>
              </li>
            );
          })}
        </ul>
      </article>

      {recent.length > 0 && (
        <article className="parchment chronicle">
          <h2 className="section-title">Chronicle of Deeds</h2>
          <ul>
            {recent.map((h, i) => {
              const quest = questById(h.questId);
              return (
                <li key={`${h.questId}-${h.date}-${i}`}>
                  <span className="log-date">{h.date}</span>
                  <span>{quest ? quest.title.replace("Bounty: ", "") : "A forgotten deed"}</span>
                  <span className="log-xp">+{h.xp} {h.stat || quest?.stat}</span>
                </li>
              );
            })}
          </ul>
        </article>
      )}
    </div>
  );
}

function Notice({ offer, index, history, today, focus, onComplete, onUndo }) {
  const { quest, tier, task, xp } = offer;
  const status = questStatus(quest.id, history, today);
  const doneToday = status === "done" && history.some((h) => h.questId === quest.id && h.date === today);
  const ability = abilityByKey[quest.stat];
  const wildcard = quest.freq === "daily" && !focus.includes(quest.stat);

  return (
    <li className={`notice ${status}`} style={{ "--tilt": `${((index % 3) - 1) * 0.8}deg` }}>
      <span className="pin" aria-hidden="true" />
      <div className="notice-kind">
        {quest.freq === "weekly" ? "Weekly Bounty" : wildcard ? "Wildcard Deed" : "Daily Deed"}
      </div>
      <h3>{quest.title.replace("Bounty: ", "")}</h3>
      <div className="notice-meta">{ability.name} · {TIER_NAMES[tier]}</div>
      <p>{task}</p>
      <div className="notice-foot">
        {status === "available" && (
          <button className="btn-seal small" onClick={() => onComplete(quest.id)}>Claim {xp} XP</button>
        )}
        {status === "done" && (
          <>
            <span className="stamp">Completed</span>
            {doneToday && <button className="link-ink" onClick={() => onUndo(quest.id)}>undo</button>}
          </>
        )}
        {status === "locked" && <span className="stamp muted">Quota reached</span>}
      </div>
    </li>
  );
}
