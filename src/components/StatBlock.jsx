import { formatModifier, modifier } from "../lib/scoring.js";
import { scoreProgress } from "../lib/progression.js";

// An ability box in classic sheet style: name on top, big modifier, score in an oval,
// and a thin ink line showing XP toward the next point.
export default function StatBlock({ ability, base, xp = 0, highlight, compact, proven }) {
  const { score, into, needed, progress, capped } = scoreProgress(base, xp);
  const gained = score - base;
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
        <div className="ability-xp" title={`${into} / ${needed} XP to reach ${score + 1}`}>
          <div className="ability-xp-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {gained > 0 && <div className="ability-gain">▲ {gained} trained</div>}
      {proven && <div className="ability-proven" title="Confirmed by a Trial in the last 90 days">⚔ Proven</div>}
    </div>
  );
}
