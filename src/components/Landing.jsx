import { useState } from "react";
import { ABILITIES, QUESTIONS } from "../data/gameData.js";

export default function Landing({ onStart }) {
  const [name, setName] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onStart(name.trim().slice(0, 40));
  };

  return (
    <article className="parchment landing">
      <p className="kicker">❦ Every legend begins with a single question ❦</p>
      <h1 className="title-display">If you were a hero of legend,<br />what would your stats be?</h1>
      <p className="lead">
        Sit before the Oracle and answer {QUESTIONS.length} questions about the life you truly live. She will
        reveal your six ability scores, your class and your calling, and then send you on quests that raise
        your real-world stats one deed at a time.
      </p>

      <div className="divider" aria-hidden="true">⚜</div>

      <ul className="ability-roster">
        {ABILITIES.map((a) => (
          <li key={a.key}>
            <span className="roster-abbr">{a.key}</span>
            <span className="roster-name">{a.name}</span>
            <span className="roster-blurb">{a.blurb}</span>
          </li>
        ))}
      </ul>

      <form className="signature" onSubmit={submit}>
        <label htmlFor="hero-name">Sign your name in the ledger</label>
        <input
          id="hero-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Elara the Bold"
          maxLength={40}
          autoComplete="off"
        />
        <button type="submit" className="btn-seal">Begin your tale</button>
        <p className="fineprint">About 3 minutes · no account needed</p>
      </form>
    </article>
  );
}
