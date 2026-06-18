import type { Exercise, Lesson, Skill, SkillProgress } from "../types";
import { ExerciseRenderer } from "./ExerciseRenderer";

interface LessonViewProps {
  lesson: Lesson;
  skill: Skill;
  exercises: Exercise[];
  progress: SkillProgress;
  onExerciseResult: (exercise: Exercise, score: number) => void;
  onMarkMastered: () => void;
}

export function LessonView({ lesson, skill, exercises, progress, onExerciseResult, onMarkMastered }: LessonViewProps) {
  const canMarkMastered = progress.bestScore >= 85 || progress.manualOverride;

  return (
    <div className="lesson-view">
      <div className="section-heading">
        <div>
          <span className="level-chip">Level {lesson.level}</span>
          <h2>{lesson.title}</h2>
        </div>
        <span className="status-pill">{progress.status}</span>
      </div>
      <p className="lead-text">{lesson.explanation}</p>

      <section className="content-band">
        <h3>What you need to understand</h3>
        <p>{skill.examRelevance}</p>
      </section>

      <section className="content-grid">
        <div>
          <h3>The rule</h3>
          <ul className="clean-list">
            {lesson.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Common mistake</h3>
          <ul className="clean-list">
            {lesson.commonMistakes.map((mistake) => (
              <li key={mistake}>{mistake}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h3>Correct examples</h3>
        <div className="example-list">
          {lesson.examples.map((example) => (
            <div className="example-row" key={`${example.label}-${example.french}`}>
              <span>{example.label}</span>
              <strong>{example.french}</strong>
              <small>{example.note}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="content-band">
        <h3>Exam use</h3>
        <p>{lesson.examUse}</p>
      </section>

      <section>
        <div className="section-heading compact">
          <h3>Mini practice</h3>
          <button type="button" className="button button-ghost" disabled={!canMarkMastered} onClick={onMarkMastered}>
            Mark as mastered
          </button>
        </div>
        {!canMarkMastered ? <p className="hint">Pass at least one exercise first, or use teacher override in Progress.</p> : null}
        <div className="exercise-stack">
          {exercises.map((exercise) => (
            <ExerciseRenderer key={exercise.id} exercise={exercise} onResult={onExerciseResult} />
          ))}
        </div>
      </section>
    </div>
  );
}
