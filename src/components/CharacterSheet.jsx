import { useState } from "react";
import { ABILITIES, CLASS_FLAVOR, TIER_TEXT, XP_PER_LEVEL } from "../data/gameData.js";
import {
  characterLevel,
  currentScores,
  formatModifier,
  modifier,
  pickClass,
  rankAbilities,
  tierIndex,
  totalXp,
  weakestAbilities,
} from "../lib/scoring.js";
import StatBlock from "./StatBlock.jsx";

const abilityByKey = Object.fromEntries(ABILITIES.map((a) => [a.key, a]));

export default function CharacterSheet({ save, onTrain, onRetake, onRename }) {
  const scores = currentScores(save.base, save.xp);
  const heroClass = pickClass(scores);
  const level = characterLevel(save.xp);
  const xpTotal = totalXp(save.xp);
  const [best] = rankAbilities(scores);
  const weakest = weakestAbilities(scores);
  const hp = Math.max(1, 10 + modifier(scores.CON) + (level - 1) * Math.max(1, 6 + modifier(scores.CON)));
  const armorClass = 10 + modifier(scores.DEX);
  const initiative = modifier(scores.DEX);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(save.name);

  const saveName = (e) => {
    e.preventDefault();
    onRename(draft.trim().slice(0, 40));
    setEditing(false);
  };

  return (
    <section className="sheet">
      <div className="sheet-header card">
        <div>
          {editing ? (
            <form onSubmit={saveName} className="rename">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={40} autoFocus aria-label="Character name" />
              <button className="btn small" type="submit">Save</button>
            </form>
          ) : (
            <h1 className="hero-name">
              {save.name || "Nameless Hero"}
              <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit name" title="Edit name">✎</button>
            </h1>
          )}
          <p className="hero-class">
            Level {level} {heroClass}
          </p>
          <p className="flavor">{CLASS_FLAVOR[heroClass]}</p>
        </div>
        <div className="derived">
          <div><span>HP</span><strong>{hp}</strong></div>
          <div><span>AC</span><strong>{armorClass}</strong></div>
          <div><span>Init</span><strong>{formatModifier(initiative)}</strong></div>
        </div>
      </div>

      <div className="level-row">
        <span>Total XP: {xpTotal}</span>
        <div className="xp-bar wide">
          <div className="xp-fill" style={{ width: `${((xpTotal % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%` }} />
        </div>
        <span>Level {level + 1} at {(level) * XP_PER_LEVEL}</span>
      </div>

      <div className="stat-grid">
        {ABILITIES.map((a) => (
          <StatBlock key={a.key} ability={a} base={save.base[a.key]} xp={save.xp[a.key]} highlight={a.key === best} />
        ))}
      </div>

      <div className="card breakdown">
        <h2>What your scores say</h2>
        <ul>
          {ABILITIES.map((a) => (
            <li key={a.key}>
              <strong>{a.name} {scores[a.key]}:</strong> {TIER_TEXT[a.key][tierIndex(scores[a.key])]}
            </li>
          ))}
        </ul>
      </div>

      {weakest.length > 0 && (
        <div className="card focus">
          <h2>Your next level-up</h2>
          <p>
            Your lowest stats are{" "}
            {weakest.map((k, i) => (
              <span key={k}>
                {i > 0 && " and "}
                <strong>{abilityByKey[k].name}</strong>
              </span>
            ))}
            . Every 100 XP of training in an ability raises it by 1.
          </p>
          <button className="btn primary" onClick={onTrain}>Start training</button>
        </div>
      )}

      <div className="sheet-actions">
        <button className="btn ghost" onClick={onRetake}>Retake the quiz</button>
      </div>
    </section>
  );
}
