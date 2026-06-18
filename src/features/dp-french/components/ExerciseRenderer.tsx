import { useState } from "react";
import type { Exercise } from "../types";
import { scoreExerciseAnswer } from "../services/scoringService";

interface ExerciseRendererProps {
  exercise: Exercise;
  onResult: (exercise: Exercise, score: number) => void;
}

export function ExerciseRenderer({ exercise, onResult }: ExerciseRendererProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState<null | { score: number; feedback: string; isCorrect: boolean }>(null);

  const submit = () => {
    const result = scoreExerciseAnswer(exercise, answer);
    setSubmitted(result);
    onResult(exercise, result.score);
  };

  const reset = () => {
    setAnswer("");
    setSubmitted(null);
  };

  const isChoice = exercise.type === "multiple-choice" || exercise.type === "choose-form" || exercise.type === "register-choice" || exercise.type === "text-type-choice";

  return (
    <section className="exercise-panel">
      <div className="exercise-panel__top">
        <span>{exercise.type.replace(/-/g, " ")}</span>
        <span>
          {exercise.examComponent}
          {exercise.marks ? ` · ${exercise.marks} mark${exercise.marks === 1 ? "" : "s"}` : ""}
        </span>
      </div>
      <p className="exercise-prompt">{exercise.prompt}</p>
      {isChoice && exercise.options ? (
        <div className="choice-grid">
          {exercise.options.map((option) => (
            <button
              type="button"
              key={option}
              className={`choice-button ${answer === option ? "is-selected" : ""}`}
              onClick={() => setAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : exercise.type === "short-answer" || exercise.type === "paragraph-improvement" || exercise.type === "paper1-writing" ? (
        <textarea
          className="answer-box answer-box-large"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Write a short answer in French or explain your choice."
        />
      ) : (
        <input className="answer-box" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer" />
      )}
      <div className="row-actions">
        <button type="button" className="button button-primary" onClick={submit} disabled={!answer.trim()}>
          Check
        </button>
        <button type="button" className="button button-ghost" onClick={reset}>
          Retry
        </button>
      </div>
      {submitted ? (
        <div className={`feedback-box ${submitted.score >= 85 ? "is-correct" : "is-review"}`}>
          <strong>{submitted.score >= 85 ? "Correct" : submitted.feedback}</strong>
          <p>{exercise.explanation}</p>
          {submitted.score < 85 && exercise.type !== "short-answer" ? (
            <p>
              Expected: <span>{Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer.join(", ") : exercise.correctAnswer}</span>
            </p>
          ) : null}
        </div>
      ) : null}
      {exercise.markScheme ? (
        <details className="markscheme-details">
          <summary>Markscheme</summary>
          <div className="markscheme-grid">
            <span>Expected</span>
            <p>{exercise.markScheme.expected}</p>
            <span>Accept</span>
            <p>{exercise.markScheme.accept.join(" / ")}</p>
            <span>Reject</span>
            <p>{exercise.markScheme.reject.join(" / ")}</p>
            <span>Guidance</span>
            <p>{exercise.markScheme.guidance}</p>
          </div>
        </details>
      ) : null}
    </section>
  );
}
