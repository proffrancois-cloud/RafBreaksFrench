import type { Skill, SkillProgress } from "../types";
import { ProgressBar } from "./ProgressBar";

interface SkillCardProps {
  skill: Skill;
  progress: SkillProgress;
  onOpen: () => void;
  onMaster: () => void;
  onReview: () => void;
}

export function SkillCard({ skill, progress, onOpen, onMaster, onReview }: SkillCardProps) {
  return (
    <article className="skill-card">
      <div className="skill-card__header">
        <div>
          <span className="level-chip">Level {skill.level}</span>
          <h3>{skill.title}</h3>
        </div>
        <span className={`status-pill status-${progress.status.toLowerCase().replace(/\s+/g, "-")}`}>{progress.status}</span>
      </div>
      <p>{skill.description}</p>
      <ProgressBar value={progress.mastery} label="Mastery" tone={progress.mastery >= 85 ? "green" : progress.mastery < 45 ? "rose" : "blue"} />
      <div className="skill-card__meta">
        <span>{skill.category}</span>
        <span>{progress.attempts.length} attempts</span>
      </div>
      <div className="row-actions">
        <button type="button" className="button button-primary" onClick={onOpen}>
          Practice
        </button>
        <button type="button" className="button button-ghost" onClick={onReview}>
          Review
        </button>
        <button type="button" className="button button-ghost" onClick={onMaster}>
          Mark mastered
        </button>
      </div>
    </article>
  );
}
