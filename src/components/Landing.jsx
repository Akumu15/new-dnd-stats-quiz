import { useState } from "react";
import { ABILITIES, QUESTIONS } from "../data/gameData.js";

export default function Landing({ onStart }) {
  const [name, setName] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onStart(name.trim().slice(0, 40));
  };

  return (
    <section className="landing">
      <p className="eyebrow">A real-life character sheet</p>
      <h1>What would your stats be if you were a D&amp;D character?</h1>
      <p className="lead">
        Answer {QUESTIONS.length} honest questions about your habits. You'll get six ability scores from 3 to 20, a
        class that fits you, and training quests that level up your real-life stats.
      </p>

      <ul className="ability-preview">
        {ABILITIES.map((a) => (
          <li key={a.key}>
            <span className="ability-icon" aria-hidden="true">{a.icon}</span>
            <strong>{a.name}</strong>
            <span>{a.blurb}</span>
          </li>
        ))}
      </ul>

      <form className="start-form" onSubmit={submit}>
        <label htmlFor="hero-name">Your character's name (optional)</label>
        <div className="start-row">
          <input
            id="hero-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Elara the Bold"
            maxLength={40}
            autoComplete="off"
          />
          <button type="submit" className="btn primary">Roll for initiative</button>
        </div>
        <p className="hint">Takes about 3 minutes.</p>
      </form>
    </section>
  );
}
