import { categoryOrder, skills, skillsById } from "../data/skills";
import { lessonsById } from "../data/lessons";
import type { Category, ProgressState, Skill } from "../types";
import { defaultSkillProgress } from "./progressService";

const categoriesForPaper1 = new Set<Category>(["Text types and conventions", "Paper 1 writing", "IB themes and culture", "Faux amis and English interference"]);
const categoriesForReading = new Set<Category>(["Paper 2 reading", "Vocabulary and word families", "Faux amis and English interference"]);
const categoriesForListening = new Set<Category>(["Paper 2 listening", "Vocabulary and word families", "Prepositions and time expressions"]);

const getProgress = (progress: ProgressState, skillId: string) => progress.skillProgress[skillId] ?? defaultSkillProgress(skillId);

const average = (values: number[]) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0);

export const getCategorySummaries = (progress: ProgressState) =>
  categoryOrder.map((category) => {
    const categorySkills = skills.filter((skill) => skill.category === category);
    const mastery = average(categorySkills.map((skill) => getProgress(progress, skill.id).mastery));
    return {
      category,
      mastery,
      mastered: categorySkills.filter((skill) => ["Mastered", "Exam-ready"].includes(getProgress(progress, skill.id).status)).length,
      total: categorySkills.length,
      weak: categorySkills.filter((skill) => getProgress(progress, skill.id).mastery < 55).length,
    };
  });

export const getOverallReadiness = (progress: ProgressState) => average(skills.map((skill) => getProgress(progress, skill.id).mastery));

export const getPaperReadiness = (progress: ProgressState) => {
  const byCategory = (set: Set<Category>) => average(skills.filter((skill) => set.has(skill.category)).map((skill) => getProgress(progress, skill.id).mastery));
  return {
    paper1: byCategory(categoriesForPaper1),
    paper2Reading: byCategory(categoriesForReading),
    paper2Listening: byCategory(categoriesForListening),
  };
};

export const getStatusCounts = (progress: ProgressState) =>
  skills.reduce(
    (counts, skill) => {
      const status = getProgress(progress, skill.id).status;
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );

export const getWeakSkills = (progress: ProgressState, limit = 5) =>
  [...skills]
    .sort((a, b) => getProgress(progress, a.id).mastery - getProgress(progress, b.id).mastery || a.level - b.level)
    .filter((skill) => getProgress(progress, skill.id).status !== "Mastered" && getProgress(progress, skill.id).status !== "Exam-ready")
    .slice(0, limit);

const findPrerequisiteGap = (progress: ProgressState, skill: Skill): Skill | null => {
  for (const prerequisiteId of skill.prerequisites) {
    if (getProgress(progress, prerequisiteId).mastery < 65) {
      return skillsById[prerequisiteId] ?? null;
    }
  }
  return null;
};

export const getNextLessonRecommendation = (progress: ProgressState) => {
  const candidate = [...skills]
    .sort((a, b) => a.level - b.level || getProgress(progress, a.id).mastery - getProgress(progress, b.id).mastery)
    .find((skill) => getProgress(progress, skill.id).status !== "Mastered" && getProgress(progress, skill.id).status !== "Exam-ready");

  if (!candidate) return null;
  const prerequisiteGap = findPrerequisiteGap(progress, candidate);
  const skill = prerequisiteGap ?? candidate;
  return {
    skill,
    lesson: lessonsById[skill.lessonIds[0]],
    reason: prerequisiteGap ? `Prerequisite before ${candidate.title}` : "Lowest useful next step",
  };
};

export const getReviewDueSkills = (progress: ProgressState) => {
  const now = new Date().getTime();
  return skills.filter((skill) => {
    const record = getProgress(progress, skill.id);
    return record.nextReviewDate ? new Date(record.nextReviewDate).getTime() <= now : false;
  });
};

export const getReadinessLevel = (readiness: number) => {
  if (readiness >= 85) return 5;
  if (readiness >= 68) return 4;
  if (readiness >= 48) return 3;
  if (readiness >= 25) return 2;
  return 1;
};

export const getNextMockRecommendation = (progress: ProgressState) => {
  const paper = getPaperReadiness(progress);
  if (paper.paper1 <= paper.paper2Reading && paper.paper1 <= paper.paper2Listening) return "Paper 1 mini-mock: choose the best text type, then plan one paragraph.";
  if (paper.paper2Reading <= paper.paper2Listening) return "Paper 2 reading mock: focus on evidence and reference questions.";
  return "Paper 2 listening mock: use the two-hearing note strategy.";
};
