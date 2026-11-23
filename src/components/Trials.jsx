import { useEffect, useRef, useState } from "react";
import { ABILITIES } from "../data/gameData.js";
import { TRIALS, TRIAL_COOLDOWN_DAYS, TRIAL_XP, TRIAL_MAX_SCORE } from "../data/trials.js";
import { currentScores, dateKey } from "../lib/scoring.js";
import { measureToScore, trialAvailability } from "../lib/trials.js";

const abilityByKey = Object.fromEntries(ABILITIES.map((a) => [a.key, a]));

export default function Trials({ save, onRecord }) {
  const [active, setActive] = useState(null); // stat key of the trial being taken
  const today = dateKey();
  const scores = currentScores(save.base, save.xp);

  if (active) {
    const trial = TRIALS.find((t) => t.stat === active);
    return (
      <TrialRunner
        trial={trial}
        current={scores[active]}
        onCancel={() => setActive(null)}
        onDone={(raw, measured, apply) => {
          onRecord(trial.stat, raw, measured, apply);
          setActive(null);
        }}
      />
    );
  }

  return (
    <div className="board trials">
      <header className="board-head">
        <h1 className="board-title">The Trials</h1>
        <p className="board-sub">
          The quiz was your own estimate. Trials are real measurements. Pass one to prove a stat, or to set it right.
        </p>
      </header>

      <article className="parchment trial-rules">
        <ul>
          <li>Each Trial can be taken once every {TRIAL_COOLDOWN_DAYS} days, and every attempt earns <strong>{TRIAL_XP} XP</strong>.</li>
          <li>If your result differs from your sheet, you choose whether to update the sheet.</li>
          <li>Trials can prove scores up to <strong>{TRIAL_MAX_SCORE}</strong>. A legendary 19 or 20 can only be earned through training.</li>
          <li>Be honest and be safe. Stop any physical Trial if something hurts.</li>
        </ul>
      </article>

      <ul className="trial-grid">
        {TRIALS.map((trial, i) => {
          const ability = abilityByKey[trial.stat];
          const { available, daysLeft, last } = trialAvailability(save, trial.stat, today);
          return (
            <li key={trial.stat} className="notice trial-card" style={{ "--tilt": `${((i % 3) - 1) * 0.6}deg` }}>
              <span className="pin" aria-hidden="true" />
              <div className="notice-kind">Trial of {ability.name}</div>
              <h3>{trial.title}</h3>
              <p className="trial-measure">{trial.measure}</p>
              <div className="trial-status">
                <span>Sheet: <strong>{scores[trial.stat]}</strong></span>
                {last ? (
                  <span>Last trial: <strong>{last.measured}</strong> <small>({formatRaw(trial, last.raw)}, {last.date})</small></span>
                ) : (
                  <span className="untested">Never tested</span>
                )}
              </div>
              <div className="notice-foot">
                {available ? (
                  <button className="btn-seal small" onClick={() => setActive(trial.stat)}>Begin the Trial</button>
                ) : (
                  <span className="stamp muted">Again in {daysLeft} {daysLeft === 1 ? "day" : "days"}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function formatRaw(trial, raw) {
  if (raw === null || raw === undefined) return "—";
  const value = Number.isInteger(raw) ? raw : raw.toFixed(1);
  return `${value} ${trial.unit}`;
}

// ── Runner: instructions → test → result ──────────────────────────────

function TrialRunner({ trial, current, onCancel, onDone }) {
  const ability = abilityByKey[trial.stat];
  const [raw, setRaw] = useState(null);
  const measured = raw === null ? null : measureToScore(trial, raw);

  return (
    <article className="parchment trial-runner">
      <p className="kicker">Trial of {ability.name}</p>
      <h1 className="title-display small">{trial.title}</h1>
      <p className="trial-measure">{trial.measure}</p>

      {raw === null ? (
        <>
          <ol className="trial-steps">
            {trial.instructions.map((step) => <li key={step}>{step}</li>)}
          </ol>
          {trial.kind === "number" && <NumberEntry trial={trial} onSubmit={setRaw} />}
          {trial.kind === "digitspan" && <DigitSpan onSubmit={setRaw} />}
          {trial.kind === "innerclock" && <InnerClock onSubmit={setRaw} />}
          {trial.kind === "speech" && <Speech trial={trial} onSubmit={setRaw} />}
          <div className="runner-foot">
            <button className="btn-ink ghost" onClick={onCancel}>Leave the Trial</button>
          </div>
        </>
      ) : (
        <TrialResult
          trial={trial}
          ability={ability}
          raw={raw}
          measured={measured}
          current={current}
          onRetry={() => setRaw(null)}
          onDone={onDone}
        />
      )}
    </article>
  );
}

function TrialResult({ trial, ability, raw, measured, current, onRetry, onDone }) {
  const diff = measured - current;
  return (
    <div className="trial-result">
      <div className="verdict">
        <div className="verdict-box">
          <span className="tiny">Your result</span>
          <span className="big">{formatRaw(trial, raw)}</span>
        </div>
        <div className="verdict-arrow" aria-hidden="true">→</div>
        <div className="verdict-box seal">
          <span className="tiny">Measured {ability.name}</span>
          <span className="big">{measured}</span>
        </div>
      </div>

      <p className="verdict-text">
        {diff === 0 && <>The Trial confirms it: your {ability.name} is truly <strong>{current}</strong>.</>}
        {diff > 0 && <>You're stronger than you thought. Your sheet says {current}, but the Trial shows <strong>{measured}</strong>.</>}
        {diff < 0 && <>The Trial is humbling. Your sheet says {current}, but you measured <strong>{measured}</strong>. Honest numbers make honest progress.</>}
      </p>

      <div className="foot-actions">
        {diff === 0 ? (
          <button className="btn-seal" onClick={() => onDone(raw, measured, false)}>Seal the result (+{TRIAL_XP} XP)</button>
        ) : (
          <>
            <button className="btn-seal" onClick={() => onDone(raw, measured, true)}>
              Set {ability.name} to {measured} (+{TRIAL_XP} XP)
            </button>
            <button className="btn-ink" onClick={() => onDone(raw, measured, false)}>Keep {current} (+{TRIAL_XP} XP)</button>
          </>
        )}
        <button className="btn-ink ghost" onClick={onRetry}>Redo the measurement</button>
      </div>
    </div>
  );
}

// ── Kinds ───────────────────────────────────────────────────────────────

function NumberEntry({ trial, onSubmit }) {
  const [value, setValue] = useState("");
  const n = Number(value);
  const valid = value !== "" && Number.isFinite(n) && n >= 0 && n <= trial.max;
  return (
    <form className="trial-entry" onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(n); }}>
      <label htmlFor="trial-value">Your result ({trial.unit})</label>
      <div className="entry-row">
        <input id="trial-value" type="number" inputMode="decimal" min="0" max={trial.max} step="any" value={value} onChange={(e) => setValue(e.target.value)} />
        <button className="btn-seal" type="submit" disabled={!valid}>Record</button>
      </div>
      {trial.hint && <p className="fineprint">{trial.hint}</p>}
    </form>
  );
}

const randomDigits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");

function DigitSpan({ onSubmit }) {
  const [phase, setPhase] = useState("ready"); // ready | show | input | feedback
  const [length, setLength] = useState(3);
  const [failsAtLength, setFailsAtLength] = useState(0);
  const [best, setBest] = useState(0);
  const [sequence, setSequence] = useState("");
  const [shown, setShown] = useState(-1);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef(null);

  const start = (len) => {
    setSequence(randomDigits(len));
    setShown(-1);
    setAnswer("");
    setPhase("show");
  };

  useEffect(() => {
    if (phase !== "show") return undefined;
    if (shown >= sequence.length) {
      setPhase("input");
      return undefined;
    }
    const t = setTimeout(() => setShown((s) => s + 1), shown === -1 ? 600 : 900);
    return () => clearTimeout(t);
  }, [phase, shown, sequence]);

  useEffect(() => {
    if (phase === "input") inputRef.current?.focus();
  }, [phase]);

  const submit = (e) => {
    e.preventDefault();
    if (answer.trim() === sequence) {
      setBest(length);
      setFeedback(`Correct: ${length} digits.`);
      setFailsAtLength(0);
      setLength(length + 1);
      if (length + 1 > 14) return onSubmit(length);
    } else {
      const fails = failsAtLength + 1;
      setFeedback(`Not quite. It was ${sequence}.`);
      if (fails >= 2) return onSubmit(best);
      setFailsAtLength(fails);
    }
    setPhase("feedback");
    return undefined;
  };

  return (
    <div className="mini-game">
      {phase === "ready" && <button className="btn-seal" onClick={() => start(length)}>Start: {length} digits</button>}
      {phase === "show" && (
        <div className="digit-stage" aria-live="polite">
          <span key={shown} className="digit">{shown >= 0 && shown < sequence.length ? sequence[shown] : "·"}</span>
        </div>
      )}
      {phase === "input" && (
        <form onSubmit={submit} className="entry-row">
          <input ref={inputRef} inputMode="numeric" autoComplete="off" value={answer} onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ""))} aria-label="Type the digits in order" placeholder="Type the digits" />
          <button className="btn-seal" type="submit" disabled={!answer}>Answer</button>
        </form>
      )}
      {phase === "feedback" && (
        <div className="game-feedback">
          <p>{feedback}</p>
          <button className="btn-seal" onClick={() => start(length)}>Next: {length} digits{failsAtLength ? " (last try)" : ""}</button>
        </div>
      )}
      <p className="fineprint">Best so far: {best || "—"} digits</p>
    </div>
  );
}

function InnerClock({ onSubmit }) {
  const TARGET = 30;
  const [startAt, setStartAt] = useState(null);
  const [errors, setErrors] = useState([]);
  const [last, setLast] = useState(null);

  const stop = () => {
    const elapsed = (performance.now() - startAt) / 1000;
    const errPct = (Math.abs(elapsed - TARGET) / TARGET) * 100;
    const next = [...errors, errPct];
    setLast(elapsed);
    setStartAt(null);
    setErrors(next);
    if (next.length === 3) {
      const avg = next.reduce((a, b) => a + b, 0) / 3;
      setTimeout(() => onSubmit(Math.round(avg * 10) / 10), 1200);
    }
  };

  return (
    <div className="mini-game">
      <p className="clock-round">Attempt {Math.min(errors.length + 1, 3)} of 3</p>
      {startAt === null ? (
        errors.length < 3 && <button className="btn-seal big-button" onClick={() => { setLast(null); setStartAt(performance.now()); }}>Start</button>
      ) : (
        <button className="btn-seal big-button pulse" onClick={stop}>Stop at 30 seconds</button>
      )}
      {last !== null && <p className="game-feedback">You stopped at {last.toFixed(1)} s ({Math.abs(last - TARGET).toFixed(1)} s off).</p>}
    </div>
  );
}

function Speech({ trial, onSubmit }) {
  const [prompt] = useState(() => trial.prompts[Math.floor(Math.random() * trial.prompts.length)]);
  const [left, setLeft] = useState(null); // seconds left; null = not started
  const [count, setCount] = useState("");

  useEffect(() => {
    if (left === null || left <= 0) return undefined;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const n = Number(count);
  const valid = count !== "" && Number.isInteger(n) && n >= 0 && n <= trial.max;

  return (
    <div className="mini-game">
      <p className="speech-prompt">Your topic: <strong>“{prompt}”</strong></p>
      {left === null && <button className="btn-seal" onClick={() => setLeft(60)}>Start speaking (60 s)</button>}
      {left !== null && left > 0 && <div className="countdown" aria-live="polite">{left}</div>}
      {left === 0 && (
        <form className="trial-entry" onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(n); }}>
          <label htmlFor="stumbles">Time! How many stumbles did you count?</label>
          <div className="entry-row">
            <input id="stumbles" type="number" inputMode="numeric" min="0" max={trial.max} value={count} onChange={(e) => setCount(e.target.value)} />
            <button className="btn-seal" type="submit" disabled={!valid}>Record</button>
          </div>
        </form>
      )}
    </div>
  );
}
