import { ABILITIES, CLASS_FLAVOR } from "../data/gameData.js";
import { rankAbilities } from "../lib/scoring.js";
import StatBlock from "./StatBlock.jsx";

// Read-only view of someone else's hero, opened from a shared link.
export default function SharedSheet({ hero, onRollYourOwn, hasOwn }) {
  const best = rankAbilities(hero.scores)[0];
  return (
    <article className="parchment shared">
      <p className="kicker">❦ A hero has shared their sheet ❦</p>
      <h1 className="hero-name centered">{hero.name || "Nameless Hero"}</h1>
      <p className="hero-class">Level {hero.level} {hero.heroClass}</p>
      <p className="flavor">{CLASS_FLAVOR[hero.heroClass]}</p>

      <div className="shared-grid">
        {ABILITIES.map((a) => (
          <StatBlock key={a.key} ability={a} base={hero.scores[a.key]} xp={0} highlight={a.key === best} />
        ))}
      </div>

      <div className="divider" aria-hidden="true">⚜</div>
      <p className="lead">What would <em>your</em> stats be?</p>
      <div className="foot-actions">
        <button className="btn-seal" onClick={onRollYourOwn}>{hasOwn ? "Back to my sheet" : "Roll your own character"}</button>
      </div>
    </article>
  );
}
