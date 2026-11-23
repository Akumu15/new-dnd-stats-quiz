import { XP_PER_POINT, MAX_SCORE } from "../data/gameData.js";
import { currentScore, formatModifier, modifier, progressToNextPoint } from "../lib/scoring.js";

// One ability: score, modifier, and a bar showing XP toward the next point.
export default function StatBlock({ ability, base, xp = 0, highlight }) {
  const score = currentScore(base, xp);
  const gained = score - base;
  const progress = progressToNextPoint(base, xp);
  const capped = score >= MAX_SCORE;

  return (
    <div className={highlight ? "stat-block highlight" : "stat-block"}>
      <div className="stat-label">
        <span aria-hidden="true">{ability.icon}</span> {ability.key}
      </div>
      <div className="stat-score">{score}</div>
      <div className="stat-mod">{formatModifier(modifier(score))}</div>
      <div className="stat-name">{ability.name}</div>
      {capped ? (
        <div className="stat-max">MAX</div>
      ) : (
        <div className="xp-bar" title={`${xp % XP_PER_POINT} / ${XP_PER_POINT} XP to the next point`}>
          <div className="xp-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {gained > 0 && <div className="stat-gain">+{gained} from training</div>}
    </div>
  );
}
