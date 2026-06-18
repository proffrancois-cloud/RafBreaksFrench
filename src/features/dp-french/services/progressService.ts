import type { ActivityItem, ProgressState, SkillProgress, WritingAttempt } from "../types";

const STORAGE_KEY = "dp-french-b-sl-progress-v1";
const reviewIntervals = [3, 7, 14, 30];

export const createEmptyProgress = (): ProgressState => ({
  skillProgress: {},
  activity: [],
  writingAttempts: [],
  diagnosticCompleted: false,
});

const isProgressState = (value: unknown): value is ProgressState => {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Partial<ProgressState>;
  return typeof maybe.skillProgress === "object" && Array.isArray(maybe.activity) && Array.isArray(maybe.writingAttempts);
};

export const loadProgress = (): ProgressState => {
  if (typeof window === "undefined") return createEmptyProgress();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw);
    return isProgressState(parsed) ? parsed : createEmptyProgress();
  } catch {
    return createEmptyProgress();
  }
};

export const saveProgress = (progress: ProgressState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const defaultSkillProgress = (skillId: string): SkillProgress => ({
  skillId,
  attempts: [],
  bestScore: 0,
  lastScore: 0,
  mastery: 0,
  status: "Not started",
});

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
};

const buildActivity = (label: string, detail: string, score?: number): ActivityItem => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  date: new Date().toISOString(),
  label,
  detail,
  score,
});

export const recordExerciseResult = (
  progress: ProgressState,
  skillId: string,
  exerciseId: string,
  score: number,
  skillTitle: string,
): ProgressState => {
  const current = progress.skillProgress[skillId] ?? defaultSkillProgress(skillId);
  const attempts = [...current.attempts, { exerciseId, score, date: new Date().toISOString() }];
  const bestScore = Math.max(current.bestScore, score);
  const recentAttempts = attempts.slice(-6);
  const passedAttempts = attempts.filter((attempt) => attempt.score >= 85).length;
  const averageRecent = Math.round(recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / recentAttempts.length);
  const mastery = current.manualOverride ? 100 : Math.min(100, Math.round(bestScore * 0.55 + averageRecent * 0.35 + Math.min(passedAttempts, 4) * 2.5));
  const priorStatus = current.status;
  const status =
    current.manualOverride
      ? current.status
      : score < 55 && (priorStatus === "Mastered" || priorStatus === "Exam-ready")
        ? "Needs review"
        : passedAttempts >= 2
          ? mastery >= 95
            ? "Exam-ready"
            : "Mastered"
          : attempts.length === 1
            ? "Started"
            : mastery < 55
              ? "Practicing"
              : mastery < 85
                ? "Needs review"
                : "Practicing";
  const interval = reviewIntervals[Math.min(passedAttempts, reviewIntervals.length - 1)] ?? 30;

  return {
    ...progress,
    diagnosticCompleted: progress.diagnosticCompleted || exerciseId.includes("diagnostic") || skillId === "mixed-diagnostic",
    skillProgress: {
      ...progress.skillProgress,
      [skillId]: {
        ...current,
        attempts,
        bestScore,
        lastScore: score,
        mastery,
        status,
        lastPracticed: new Date().toISOString(),
        nextReviewDate: score >= 85 ? addDays(new Date(), interval) : current.nextReviewDate,
      },
    },
    activity: [buildActivity(score >= 85 ? "Passed exercise" : "Practiced skill", skillTitle, score), ...progress.activity].slice(0, 12),
  };
};

export const markSkillMastered = (progress: ProgressState, skillId: string, skillTitle: string): ProgressState => {
  const current = progress.skillProgress[skillId] ?? defaultSkillProgress(skillId);
  return {
    ...progress,
    skillProgress: {
      ...progress.skillProgress,
      [skillId]: {
        ...current,
        bestScore: 100,
        lastScore: 100,
        mastery: 100,
        status: "Mastered",
        lastPracticed: new Date().toISOString(),
        nextReviewDate: addDays(new Date(), 7),
        manualOverride: true,
      },
    },
    activity: [buildActivity("Teacher override", `${skillTitle} marked as mastered`, 100), ...progress.activity].slice(0, 12),
  };
};

export const markSkillNeedsReview = (progress: ProgressState, skillId: string, skillTitle: string): ProgressState => {
  const current = progress.skillProgress[skillId] ?? defaultSkillProgress(skillId);
  return {
    ...progress,
    skillProgress: {
      ...progress.skillProgress,
      [skillId]: {
        ...current,
        mastery: Math.min(current.mastery, 65),
        status: "Needs review",
        manualOverride: false,
      },
    },
    activity: [buildActivity("Review scheduled", skillTitle), ...progress.activity].slice(0, 12),
  };
};

export const addWritingAttempt = (progress: ProgressState, attempt: Omit<WritingAttempt, "id" | "date">): ProgressState => ({
  ...progress,
  writingAttempts: [
    {
      ...attempt,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: new Date().toISOString(),
    },
    ...progress.writingAttempts,
  ],
  activity: [buildActivity("Saved writing attempt", attempt.prompt, attempt.wordCount), ...progress.activity].slice(0, 12),
});

export const exportProgress = (progress: ProgressState) => {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "dp-french-progress.json";
  anchor.click();
  URL.revokeObjectURL(url);
};

export const parseImportedProgress = (raw: string): ProgressState | null => {
  try {
    const parsed = JSON.parse(raw);
    return isProgressState(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
