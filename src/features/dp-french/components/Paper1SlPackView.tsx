import { useState } from "react";
import { TextTypeCard } from "./TextTypeCard";
import { paper1SlPack, paper1SlPackStats, type Paper1SlPackTask } from "../data/paper1SlPack";
import { textTypes } from "../data/textTypes";
import { resolveAssetUrl } from "../services/assetService";

const taskLabels = ["Sujet 1", "Sujet 2", "Sujet 3"];

function TaskCard({ task, index }: { task: Paper1SlPackTask; index: number }) {
  return (
    <article className="paper1-pack-task-card">
      <div className="paper1-pack-task-top">
        <span>{taskLabels[index] ?? `Sujet ${index + 1}`}</span>
        <small>{task.anchor}</small>
      </div>
      <p>{task.prompt}</p>
      <div className="paper1-pack-options" aria-label={`Types de texte proposes pour ${taskLabels[index]}`}>
        {task.options.map((option) => (
          <span key={option}>{option}</span>
        ))}
      </div>
      <details className="paper1-pack-correction">
        <summary>Correction type de texte</summary>
        <div className="paper1-pack-correction-grid">
          <span>Le plus adapte</span>
          <strong>{task.best}</strong>
          <span>Acceptable</span>
          <strong>{task.ok}</strong>
          <span>Faible</span>
          <strong>{task.weak}</strong>
          <span>Public</span>
          <p>{task.audience}</p>
          <span>Objectifs</span>
          <p>{task.purposes.join(" ; ")}</p>
          <span>Pourquoi</span>
          <p>{task.rationale}</p>
        </div>
      </details>
    </article>
  );
}

export function Paper1SlPackView() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTextTypeId, setActiveTextTypeId] = useState<string | null>(null);
  const activeForm = paper1SlPack.forms[activeIndex] ?? paper1SlPack.forms[0];
  const activeTextType = textTypes.find((textType) => textType.id === activeTextTypeId);
  const docxUrl = resolveAssetUrl(paper1SlPack.sourceDocxUrl);

  const goToSlide = (nextIndex: number) => {
    const bounded = Math.max(0, Math.min(paper1SlPack.forms.length - 1, nextIndex));
    setActiveIndex(bounded);
    setActiveTextTypeId(null);
  };

  return (
    <div className="paper1-pack-page">
      <section className="content-band paper1-pack-overview">
        <div className="section-heading">
          <div>
            <span className="level-chip">Paper 1 SL pack</span>
            <h1>10 epreuves, one slideshow page</h1>
            <p className="lead-text">
              Use the slide controls to move through the ten full Paper 1 practice epreuves as one complete FrenchEase bundle.
            </p>
          </div>
          <a className="button button-primary" href={docxUrl} download>
            Download DOCX
          </a>
        </div>
        <div className="paper1-pack-stat-row" aria-label="Paper 1 pack summary">
          <span>
            <strong>{paper1SlPackStats.formCount}</strong>
            epreuves
          </span>
          <span>
            <strong>{paper1SlPackStats.taskCount}</strong>
            sujets
          </span>
          <span>
            <strong>{paper1SlPack.durationMinutes} min</strong>
            par epreuve
          </span>
          <span>
            <strong>{paper1SlPack.wordCount}</strong>
            attendu
          </span>
        </div>
      </section>

      <section className="paper1-pack-shell">
        <aside className="left-rail paper1-pack-rail" aria-label="Paper 1 selector">
          <section className="paper1-pack-rail-box">
            <h2>Epreuves</h2>
            <div className="lesson-list">
              {paper1SlPack.forms.map((form, index) => (
                <button
                  type="button"
                  key={form.id}
                  className={!activeTextType && activeForm.id === form.id ? "lesson-button is-selected" : "lesson-button"}
                  onClick={() => goToSlide(index)}
                >
                  <span>{form.id}</span>
                  <small>{form.tasks.length} sujets</small>
                </button>
              ))}
            </div>
          </section>
          <section className="paper1-pack-rail-box">
            <h2>Text types</h2>
            <div className="lesson-list">
              {textTypes.map((textType) => (
                <button
                  type="button"
                  key={textType.id}
                  className={activeTextTypeId === textType.id ? "lesson-button is-selected" : "lesson-button"}
                  onClick={() => setActiveTextTypeId(textType.id)}
                >
                  <span>{textType.title}</span>
                  <small>{textType.register}</small>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="paper1-pack-stage" aria-live="polite">
          {activeTextType ? (
            <section className="paper1-pack-texttype-stage">
              <TextTypeCard textType={activeTextType} />
            </section>
          ) : (
            <>
              <div className="paper1-pack-controls">
                <button type="button" className="button button-ghost" onClick={() => goToSlide(activeIndex - 1)} disabled={activeIndex === 0}>
                  Previous
                </button>
                <span>
                  {activeIndex + 1} / {paper1SlPack.forms.length}
                </span>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => goToSlide(activeIndex + 1)}
                  disabled={activeIndex === paper1SlPack.forms.length - 1}
                >
                  Next
                </button>
              </div>

              <article className="paper1-pack-slide">
                <div className="paper1-pack-slide-head">
                  <div>
                    <span className="level-chip">Paper 1 Writing</span>
                    <h2>{activeForm.id}</h2>
                    <p>{paper1SlPack.instructions}</p>
                  </div>
                  <div className="paper1-pack-timer">
                    <strong>{paper1SlPack.durationMinutes}</strong>
                    <span>minutes</span>
                  </div>
                </div>

                <div className="paper1-pack-task-grid">
                  {activeForm.tasks.map((task, index) => (
                    <TaskCard key={`${activeForm.id}-${index}`} task={task} index={index} />
                  ))}
                </div>

                <details className="question-bank-details paper1-pack-shared-marking">
                  <summary>
                    Paper 1 marking reminder <span>3 criteria</span>
                  </summary>
                  <div className="compact-list-grid">
                    <div className="mini-list">
                      <strong>Language</strong>
                      <span>Range, accuracy, control of structures, and clear sentence-level communication.</span>
                    </div>
                    <div className="mini-list">
                      <strong>Message</strong>
                      <span>All parts of the task are addressed with relevant development and coherent organization.</span>
                    </div>
                    <div className="mini-list">
                      <strong>Conceptual understanding</strong>
                      <span>Register, audience, purpose, and text-type conventions match the chosen format.</span>
                    </div>
                  </div>
                </details>
              </article>

              <div className="paper1-pack-dots" aria-label="Paper 1 slide position">
                {paper1SlPack.forms.map((form, index) => (
                  <button
                    type="button"
                    key={`${form.id}-dot`}
                    className={activeIndex === index ? "is-selected" : ""}
                    aria-label={`Open ${form.id}`}
                    onClick={() => goToSlide(index)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </section>
    </div>
  );
}
