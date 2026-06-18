interface ProgressBarProps {
  value: number;
  label?: string;
  tone?: "blue" | "green" | "amber" | "rose" | "violet";
}

export function ProgressBar({ value, label, tone = "blue" }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="progress-block" aria-label={label}>
      {label ? (
        <div className="progress-label">
          <span>{label}</span>
          <strong>{safeValue}%</strong>
        </div>
      ) : null}
      <div className="progress-track">
        <div className={`progress-fill tone-${tone}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
