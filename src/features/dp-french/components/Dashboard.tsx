import { categoryOrder, skills } from "../data/skills";
import {
  getCategorySummaries,
  getNextLessonRecommendation,
  getNextMockRecommendation,
  getOverallReadiness,
  getPaperReadiness,
  getReadinessLevel,
  getReviewDueSkills,
  getStatusCounts,
  getWeakSkills,
} from "../services/recommendationService";
import type { ProgressState, Skill } from "../types";
import { ProgressBar } from "./ProgressBar";

interface DashboardProps {
  progress: ProgressState;
  onOpenLesson: (skill: Skill) => void;
  onOpenPractice: () => void;
}

const ladder = [
  "Foundation accuracy",
  "Sentence control",
  "Paragraph control",
  "Text-type control",
  "Exam-ready production and comprehension",
];

export function Dashboard({ progress, onOpenLesson, onOpenPractice }: DashboardProps) {
  const readiness = getOverallReadiness(progress);
  const level = getReadinessLevel(readiness);
  const paper = getPaperReadiness(progress);
  const summaries = getCategorySummaries(progress);
  const weakSkills = getWeakSkills(progress, 4);
  const next = getNextLessonRecommendation(progress);
  const due = getReviewDueSkills(progress);
  const counts = getStatusCounts(progress);

  return (
    <div className="dashboard-grid">
      <section className="readiness-panel">
        <div className="section-heading">
          <div>
            <span className="level-chip">DP French B SL</span>
            <h1>{readiness}% exam readiness</h1>
          </div>
          <button type="button" className="button button-primary" onClick={onOpenPractice}>
            Start practice
          </button>
        </div>
        <ProgressBar value={readiness} tone={readiness >= 70 ? "green" : readiness < 35 ? "rose" : "blue"} />
        <div className="readiness-stats">
          <div>
            <span>Paper 1</span>
            <strong>{paper.paper1}%</strong>
          </div>
          <div>
            <span>Paper 2 reading</span>
            <strong>{paper.paper2Reading}%</strong>
          </div>
          <div>
            <span>Paper 2 listening</span>
            <strong>{paper.paper2Listening}%</strong>
          </div>
        </div>
      </section>

      <section className="next-panel">
        <h2>Next steps</h2>
        {next ? (
          <button type="button" className="next-action" onClick={() => onOpenLesson(next.skill)}>
            <span>Next lesson</span>
            <strong>{next.lesson.title}</strong>
            <small>{next.reason}</small>
          </button>
        ) : (
          <p>All current lessons are mastered. Move into timed mocks.</p>
        )}
        <div className="next-action muted">
          <span>Next mock task</span>
          <strong>{getNextMockRecommendation(progress)}</strong>
        </div>
        {due.length ? (
          <div className="next-action muted">
            <span>Review due</span>
            <strong>{due.map((skill) => skill.title).join(", ")}</strong>
          </div>
        ) : null}
      </section>

      <section className="ladder-panel">
        <h2>DP Exam Readiness Ladder</h2>
        <div className="ladder-list">
          {ladder.map((label, index) => (
            <div key={label} className={`ladder-step ${index + 1 <= level ? "is-active" : ""}`}>
              <span>Level {index + 1}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="category-panel">
        <h2>Progress by category</h2>
        <div className="category-list">
          {summaries
            .filter((summary) => categoryOrder.includes(summary.category))
            .map((summary) => (
              <ProgressBar key={summary.category} value={summary.mastery} label={`${summary.category} (${summary.mastered}/${summary.total})`} tone={summary.weak ? "amber" : "green"} />
            ))}
        </div>
      </section>

      <section className="weak-panel">
        <h2>Weak and urgent skills</h2>
        <div className="weak-list">
          {weakSkills.map((skill) => (
            <button type="button" className="weak-row" key={skill.id} onClick={() => onOpenLesson(skill)}>
              <span>{skill.title}</span>
              <small>Level {skill.level}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="activity-panel">
        <h2>Recent activity</h2>
        <div className="status-counts">
          <span>Mastered: {counts.Mastered ?? 0}</span>
          <span>In progress: {(counts.Started ?? 0) + (counts.Practicing ?? 0)}</span>
          <span>Weak: {skills.length - ((counts.Mastered ?? 0) + (counts["Exam-ready"] ?? 0))}</span>
        </div>
        {progress.activity.length ? (
          <div className="activity-list">
            {progress.activity.map((item) => (
              <div className="activity-row" key={item.id}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
                {typeof item.score === "number" ? <small>{item.score}%</small> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="hint">No practice yet. Start with the diagnostic or the next lesson.</p>
        )}
      </section>
    </div>
  );
}
