import { useEffect, useState } from "react";
import { ABILITIES, QUESTIONS } from "../data/gameData.js";

const abilityByKey = Object.fromEntries(ABILITIES.map((a) => [a.key, a]));

export default function Quiz({ onFinish, onCancel }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => QUESTIONS.map(() => null));

  const question = QUESTIONS[index];
  const ability = abilityByKey[question.stat];
  const isLast = index === QUESTIONS.length - 1;

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
    <section className="quiz">
      <div className="quiz-meta">
        <span className="chip">
          <span aria-hidden="true">{ability.icon}</span> {ability.name}
        </span>
        <span className="counter">
          {index + 1} / {QUESTIONS.length}
        </span>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={index}>
        <div className="progress-fill" style={{ width: `${(index / QUESTIONS.length) * 100}%` }} />
      </div>

      <h2 className="question">{question.q}</h2>

      <div className="options">
        {question.a.map((text, i) => (
          <button
            key={`${index}-${i}`}
            className={answers[index] === i ? "option selected" : "option"}
            onClick={() => choose(i)}
          >
            <span className="option-key" aria-hidden="true">{i + 1}</span>
            {text}
          </button>
        ))}
      </div>

      <div className="quiz-nav">
        <button className="btn ghost" onClick={() => (index > 0 ? setIndex(index - 1) : onCancel())}>
          {index > 0 ? "← Back" : "Cancel"}
        </button>
      </div>
    </section>
  );
}
