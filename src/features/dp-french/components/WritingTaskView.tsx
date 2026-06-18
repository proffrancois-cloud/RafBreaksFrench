import { useMemo, useState } from "react";
import type { Paper1Task, WritingAttempt } from "../types";
import { wordCount } from "../services/scoringService";

interface WritingTaskViewProps {
  task: Paper1Task;
  onSave: (attempt: Omit<WritingAttempt, "id" | "date">) => void;
}

const checklistItems = ["Language range checked", "Message answers the task", "Text-type conventions included", "Register consistent"];

export function WritingTaskView({ task, onSave }: WritingTaskViewProps) {
  const [selectedTextType, setSelectedTextType] = useState(task.textTypeChoices[0]);
  const [response, setResponse] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [teacherFeedback, setTeacherFeedback] = useState("");
  const count = useMemo(() => wordCount(response), [response]);

  const toggle = (item: string) => {
    setChecked((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  };

  const save = () => {
    onSave({
      prompt: task.prompt,
      selectedTextType,
      response,
      wordCount: count,
      selfCheck: checked,
      teacherFeedback,
      nextSteps: checked.length < checklistItems.length ? "Complete the remaining self-check items, then revise one paragraph." : "Ready for teacher feedback.",
    });
    setResponse("");
    setTeacherFeedback("");
    setChecked([]);
  };

  return (
    <section className="writing-workspace">
      <div>
        <span className="level-chip">{task.theme}</span>
        <h3>{task.prompt}</h3>
        <div className="select-row">
          <label htmlFor={`text-type-${task.id}`}>Text type</label>
          <select id={`text-type-${task.id}`} value={selectedTextType} onChange={(event) => setSelectedTextType(event.target.value)}>
            {task.textTypeChoices.map((choice) => (
              <option key={choice}>{choice}</option>
            ))}
          </select>
        </div>
        <ul className="clean-list">
          {task.planningHints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
        {task.markScheme?.length ? (
          <details className="markscheme-details paper1-markscheme">
            <summary>Paper 1 markscheme</summary>
            <div className="criterion-list">
              {task.markScheme.map((criterion) => (
                <article key={criterion.criterion}>
                  <strong>
                    {criterion.criterion} · {criterion.marks} marks
                  </strong>
                  <p>{criterion.topBand}</p>
                  <small>{criterion.teacherFocus}</small>
                </article>
              ))}
            </div>
          </details>
        ) : null}
      </div>
      <textarea className="writing-box" value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Write 250-400 words here." />
      <div className="checklist-grid">
        {checklistItems.map((item) => (
          <label key={item} className="check-row">
            <input type="checkbox" checked={checked.includes(item)} onChange={() => toggle(item)} />
            <span>{item}</span>
          </label>
        ))}
      </div>
      <textarea className="answer-box" value={teacherFeedback} onChange={(event) => setTeacherFeedback(event.target.value)} placeholder="Teacher feedback or AI feedback placeholder" />
      <div className="row-actions">
        <span className="word-count">{count} words</span>
        <button type="button" className="button button-primary" onClick={save} disabled={!response.trim()}>
          Save attempt
        </button>
      </div>
    </section>
  );
}
