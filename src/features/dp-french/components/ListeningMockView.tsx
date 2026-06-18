import type { Exercise, ListeningMock } from "../types";
import { resolveAssetUrl } from "../services/assetService";
import { speakFrench, stopSpeaking } from "../services/ttsService";
import { ExerciseRenderer } from "./ExerciseRenderer";

interface ListeningMockViewProps {
  mock: ListeningMock;
  onExerciseResult: (exercise: Exercise, score: number) => void;
}

export function ListeningMockView({ mock, onExerciseResult }: ListeningMockViewProps) {
  return (
    <div className="mock-view">
      <div className="section-heading">
        <div>
          <span className="level-chip">Audio files + TTS fallback</span>
          <h2>{mock.title}</h2>
        </div>
        <span className="status-pill">{mock.totalMarks} marks</span>
      </div>
      {mock.texts.map((text) => (
        <section className="mock-text" key={text.id}>
          <div className="resource-card__top">
            <h3>{text.title}</h3>
            <span>{text.theme}</span>
          </div>
          <p className="hint">{text.instructions}</p>
          {text.audioUrl ? (
            <div className="audio-player">
              <audio controls preload="metadata" src={resolveAssetUrl(text.audioUrl)}>
                Your browser does not support audio playback.
              </audio>
              <small>
                Audio file: {text.audioFile}
                {text.voice ? ` · Voice: ${text.voice}` : ""}
              </small>
            </div>
          ) : null}
          <div className="row-actions">
            <button type="button" className="button button-primary" onClick={() => speakFrench(text.script)}>
              Play TTS fallback
            </button>
            <button type="button" className="button button-ghost" onClick={stopSpeaking}>
              Stop
            </button>
          </div>
          <details className="script-details">
            <summary>Transcript and note space</summary>
            <p>{text.script}</p>
            <textarea className="answer-box" placeholder={text.noteSpacePrompt} />
          </details>
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
