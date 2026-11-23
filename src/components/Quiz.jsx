import { useEffect, useState } from "react";
import { ABILITIES, QUESTIONS } from "../data/gameData.js";

const abilityByKey = Object.fromEntries(ABILITIES.map((a) => [a.key, a]));
const NUMERALS = ["I", "II", "III", "IV", "V"];

export default function Quiz({ onFinish, onCancel }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => QUESTIONS.map(() => null));

  const question = QUESTIONS[index];
  const ability = abilityByKey[question.stat];
  const isLast = index === QUESTIONS.length - 1;
  const trialNumber = ABILITIES.findIndex((a) => a.key === question.stat) + 1;

  const choose = (optionIndex) => {
    const next = answers.map((a, i) => (i === index ? optionIndex : a));
    setAnswers(next);
    if (isLast) onFinish(next);
    else setIndex(index + 1);
  };

  // Keyboard: 1–5 picks an answer, Backspace or ← goes back.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      const n = Number(e.key);
      if (n >= 1 && n <= question.a.length) choose(n - 1);
      else if ((e.key === "Backspace" || e.key === "ArrowLeft") && index > 0) setIndex(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <article className="parchment quiz">
      <div className="quiz-head">
        <span className="kicker">Trial {NUMERALS[trialNumber - 1] ?? trialNumber} of VI · The Trial of {ability.name}</span>
        <span className="quiz-count">Question {index + 1} of {QUESTIONS.length}</span>
      </div>

      <div className="candle-track" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={index}>
        {ABILITIES.map((a) => {
          const done = QUESTIONS.filter((q, i) => q.stat === a.key && i < index).length;
          const total = QUESTIONS.filter((q) => q.stat === a.key).length;
          return (
            <div key={a.key} className={a.key === question.stat ? "candle current" : "candle"}>
              <div className="candle-fill" style={{ width: `${(done / total) * 100}%` }} />
              <span>{a.key}</span>
            </div>
          );
        })}
      </div>

      <p className="oracle">The Oracle asks:</p>
      <h2 className="question" key={index}>“{question.q}”</h2>

      <ol className="answers">
        {question.a.map((text, i) => (
          <li key={`${index}-${i}`}>
            <button className={answers[index] === i ? "answer selected" : "answer"} onClick={() => choose(i)}>
              <span className="answer-seal" aria-hidden="true">{NUMERALS[i]}</span>
              <span>{text}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="quiz-foot">
        <button className="btn-ink ghost" onClick={() => (index > 0 ? setIndex(index - 1) : onCancel())}>
          {index > 0 ? "← Previous question" : "Leave the Oracle"}
        </button>
        <span className="fineprint">Tip: press 1–5 to answer</span>
      </div>
    </article>
  );
}
