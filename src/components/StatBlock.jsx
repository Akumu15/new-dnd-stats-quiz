import { XP_PER_POINT, MAX_SCORE } from "../data/gameData.js";
import { currentScore, formatModifier, modifier, progressToNextPoint } from "../lib/scoring.js";

// An ability box in classic sheet style: name on top, big modifier, score in an oval,
// and a thin ink line showing XP toward the next point.
export default function StatBlock({ ability, base, xp = 0, highlight, compact }) {
  const score = currentScore(base, xp);
  const gained = score - base;
  const progress = progressToNextPoint(base, xp);
  const capped = score >= MAX_SCORE;
  const classes = ["ability-box", highlight && "highlight", compact && "compact"].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className="ability-name">
        <span className="name-full">{ability.name}</span>
        <abbr className="name-abbr" title={ability.name}>{ability.key}</abbr>
      </div>
      <div className="ability-mod">{formatModifier(modifier(score))}</div>
      <div className="ability-score" title={gained > 0 ? `+${gained} from training` : undefined}>
        {score}
      </div>
      {capped ? (
        <div className="ability-max">Mastered</div>
      ) : (
        <div className="ability-xp" title={`${xp % XP_PER_POINT} / ${XP_PER_POINT} XP to the next point`}>
          <div className="ability-xp-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {gained > 0 && <div className="ability-gain">▲ {gained} trained</div>}
    </div>
  );
}
