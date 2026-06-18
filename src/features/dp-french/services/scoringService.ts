import type { Exercise } from "../types";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/[.,!?;:"]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const scoreExerciseAnswer = (exercise: Exercise, answer: string) => {
  const cleanAnswer = normalize(answer);
  const accepted = [
    ...(Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer : [exercise.correctAnswer]),
    ...(exercise.acceptableAnswers ?? []),
  ].map(normalize);

  if (exercise.type === "short-answer" || exercise.type === "paragraph-improvement" || exercise.type === "paper1-writing") {
    const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
    const score = wordCount >= 12 ? 75 : wordCount >= 5 ? 55 : 20;
    return {
      isCorrect: false,
      score,
      feedback: wordCount >= 12 ? "Saved for teacher review." : "Add a fuller answer before teacher review.",
    };
  }

  const isCorrect = accepted.some((value) => value === cleanAnswer);
  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
    feedback: isCorrect ? "Correct." : "Not yet. Review the explanation and try again.",
  };
};

export const wordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
