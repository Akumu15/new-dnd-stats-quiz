import { useState } from "react";
import { ABILITIES, CLASS_FLAVOR, TIER_TEXT } from "../data/gameData.js";
import { buildSheet, dateKey, formatModifier, streak, tierIndex } from "../lib/scoring.js";
import { isProven } from "../lib/trials.js";
import StatBlock from "./StatBlock.jsx";
import ShareBar from "./ShareBar.jsx";

const abilityByKey = Object.fromEntries(ABILITIES.map((a) => [a.key, a]));

export default function CharacterSheet({ save, onTrain, onTrials, onRetake, onRename }) {
  const sheet = buildSheet(save);
  const today = dateKey();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(save.name);

  const saveName = (e) => {
    e.preventDefault();
    onRename(draft.trim().slice(0, 40));
    setEditing(false);
  };

  const levelProgress = ((sheet.xpTotal - sheet.levelStartsAt) / (sheet.nextLevelAt - sheet.levelStartsAt)) * 100;

  return (
    <article className="parchment sheet">
      {/* ── Header: name banner + identity fields ── */}
      <header className="sheet-head">
        <div className="name-banner">
          {editing ? (
            <form onSubmit={saveName} className="rename">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={40} autoFocus aria-label="Character name" />
              <button className="btn-ink small" type="submit">Inscribe</button>
            </form>
          ) : (
            <h1 className="hero-name">
              {save.name || "Nameless Hero"}
              <button className="quill" onClick={() => setEditing(true)} aria-label="Edit name" title="Edit name">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M20 3c-6 1-11 6-13 12l-2 6 2-1c1-3 3-5 5-6 4-1 7-5 8-11z M7 15l3 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </h1>
          )}
          <div className="field-label">Character Name</div>
        </div>

        <dl className="identity">
          <Field label="Class & Level" value={`${sheet.heroClass} ${sheet.level}`} />
          <Field label="Background" value={sheet.background} />
          <Field label="Ancestry" value="Human" />
          <Field label="Title" value={sheet.title} />
          <Field label="Realm" value="The Waking World" />
          <Field label="Experience" value={`${sheet.xpTotal} / ${sheet.nextLevelAt}`} />
        </dl>
      </header>

      <div className="level-track" aria-label={`Level progress ${Math.round(levelProgress)}%`}>
        <div className="level-track-fill" style={{ width: `${levelProgress}%` }} />
      </div>

      <div className="sheet-body">
        {/* ── Column 1: abilities ── */}
        <section className="col abilities" aria-label="Ability scores">
          {ABILITIES.map((a) => (
            <StatBlock
              key={a.key}
              ability={a}
              base={save.base[a.key]}
              xp={save.xp[a.key]}
              highlight={a.key === sheet.ranked[0]}
              proven={isProven(save, a.key, sheet.scores[a.key], today)}
            />
          ))}
        </section>

        {/* ── Column 2: proficiency, saves, skills ── */}
        <section className="col">
          <div className="pill-stat">
            <span className="pill-value">{formatModifier(sheet.proficiencyBonus)}</span>
            <span className="pill-label">Proficiency Bonus</span>
          </div>

          <div className="framed">
            <ul className="check-list">
              {sheet.saves.map((s) => (
                <li key={s.stat}>
                  <span className={s.proficient ? "pip filled" : "pip"} aria-label={s.proficient ? "proficient" : undefined} />
                  <span className="check-bonus">{formatModifier(s.bonus)}</span>
                  {abilityByKey[s.stat].name}
                </li>
              ))}
            </ul>
            <div className="frame-title">Saving Throws</div>
          </div>

          <div className="framed">
            <ul className="check-list">
              {sheet.skills.map((s) => (
                <li key={s.name}>
                  <span className={s.proficient ? "pip filled" : "pip"} aria-label={s.proficient ? "proficient" : undefined} />
                  <span className="check-bonus">{formatModifier(s.bonus)}</span>
                  {s.name} <span className="check-stat">({s.stat})</span>
                </li>
              ))}
            </ul>
            <div className="frame-title">Skills</div>
          </div>

          <div className="pill-stat">
            <span className="pill-value">{sheet.passivePerception}</span>
            <span className="pill-label">Passive Perception</span>
          </div>
        </section>

        {/* ── Column 3: combat + traits ── */}
        <section className="col">
          <div className="framed combat">
            <div className="combat-row">
              <div className="shield">
                <span className="big">{sheet.armorClass}</span>
                <span className="tiny">Armor Class</span>
              </div>
              <div className="square">
                <span className="big">{formatModifier(sheet.initiative)}</span>
                <span className="tiny">Initiative</span>
              </div>
              <div className="square">
                <span className="big">{sheet.speed}<small>ft</small></span>
                <span className="tiny">Speed</span>
              </div>
            </div>
            <div className="hp-box">
              <div className="hp-max">Hit Point Maximum <strong>{sheet.maxHp}</strong></div>
              <div className="big">{sheet.maxHp}</div>
              <span className="tiny">Current Hit Points</span>
            </div>
            <div className="combat-row">
              <div className="square wide">
                <span className="mid">{sheet.level}d{sheet.hitDie}</span>
                <span className="tiny">Hit Dice</span>
              </div>
              <div className="square wide">
                <span className="mid">🔥 {streakLabel(save)}</span>
                <span className="tiny">Training Streak</span>
              </div>
            </div>
          </div>

          <TraitBox title="Class Feature">
            <strong>{sheet.heroClass}.</strong> {CLASS_FLAVOR[sheet.heroClass]}
          </TraitBox>
          <TraitBox title="Strengths">
            {sheet.strengths.map((k) => (
              <p key={k}><strong>{abilityByKey[k].name}.</strong> {TIER_TEXT[k][tierIndex(sheet.scores[k])]}</p>
            ))}
          </TraitBox>
          <TraitBox title="Flaws">
            {sheet.weaknesses.length === 0 ? (
              <p>None. You have mastered every ability.</p>
            ) : (
              sheet.weaknesses.map((k) => (
                <p key={k}><strong>{abilityByKey[k].name}.</strong> {TIER_TEXT[k][tierIndex(sheet.scores[k])]}</p>
              ))
            )}
          </TraitBox>
        </section>
      </div>

      <footer className="sheet-foot">
        {sheet.weaknesses.length > 0 && (
          <p>
            Your path forward lies in{" "}
            {sheet.weaknesses.map((k, i) => (
              <span key={k}>{i > 0 && " and "}<strong>{abilityByKey[k].name}</strong></span>
            ))}
            . True growth takes weeks of steady work, and the stronger you become, the harder each point is won.
          </p>
        )}
        <div className="foot-actions">
          <button className="btn-seal" onClick={onTrain}>To the Quest Board</button>
          <button className="btn-ink" onClick={onTrials}>Prove your stats in the Trials</button>
        </div>
        <ShareBar
          name={save.name}
          level={sheet.level}
          scores={sheet.scores}
          heroClass={sheet.heroClass}
          background={sheet.background}
        />
        <button className="btn-ink ghost" onClick={onRetake}>Roll a new character</button>
      </footer>
    </article>
  );
}

function Field({ label, value }) {
  return (
    <div className="field">
      <dd>{value}</dd>
      <dt>{label}</dt>
    </div>
  );
}

function TraitBox({ title, children }) {
  return (
    <div className="framed trait">
      <div className="trait-body">{children}</div>
      <div className="frame-title">{title}</div>
    </div>
  );
}

function streakLabel(save) {
  const days = streak(save.history, dateKey());
  return days === 0 ? "—" : `${days} ${days === 1 ? "day" : "days"}`;
}
