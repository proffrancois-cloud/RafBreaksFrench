import type { Exercise, ReadingMock } from "../types";
import { ExerciseRenderer } from "./ExerciseRenderer";

interface ReadingMockViewProps {
  mock: ReadingMock;
  onExerciseResult: (exercise: Exercise, score: number) => void;
}

export function ReadingMockView({ mock, onExerciseResult }: ReadingMockViewProps) {
  return (
    <div className="mock-view">
      <div className="section-heading">
        <div>
          <span className="level-chip">Generated reading set</span>
          <h2>{mock.title}</h2>
        </div>
        <span className="status-pill">{mock.totalMarks} marks</span>
      </div>
      {mock.texts.map((text) => (
        <section className="mock-text" key={text.id}>
          <div className="resource-card__top">
            <h3>{text.title}</h3>
            <span>
              Text {text.difficulty}
              {text.wordCount ? ` · ${text.wordCount} words` : ""}
            </span>
          </div>
          {text.sourceType ? <p className="hint">Source type: {text.sourceType}</p> : null}
          <p className="reading-text">{text.text}</p>
          <div className="exercise-stack">
            {text.questions.map((exercise) => (
              <ExerciseRenderer key={exercise.id} exercise={exercise} onResult={onExerciseResult} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
