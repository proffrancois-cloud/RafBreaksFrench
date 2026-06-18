export type Category =
  | "Foundations"
  | "Articles and gender"
  | "Verbs and tenses"
  | "Pronouns"
  | "Sentence structure and negation"
  | "Prepositions and time expressions"
  | "Vocabulary and word families"
  | "Faux amis and English interference"
  | "IB themes and culture"
  | "Text types and conventions"
  | "Paper 1 writing"
  | "Paper 2 reading"
  | "Paper 2 listening"
  | "Mixed exam drills";

export type ExamComponent =
  | "Grammar accuracy"
  | "Paper 1 writing"
  | "Paper 2 reading"
  | "Paper 2 listening"
  | "Oral"
  | "Mixed";

export type ProgressStatus =
  | "Not started"
  | "Started"
  | "Practicing"
  | "Needs review"
  | "Mastered"
  | "Exam-ready";

export type ExerciseType =
  | "multiple-choice"
  | "fill-blank"
  | "rewrite"
  | "choose-form"
  | "reorder"
  | "error-correction"
  | "translation"
  | "matching"
  | "register-choice"
  | "text-type-choice"
  | "short-answer"
  | "paragraph-improvement"
  | "pronoun-replacement"
  | "conjugation-table"
  | "mixed-transformation"
  | "reading-comprehension"
  | "listening-comprehension"
  | "paper1-planning"
  | "paper1-writing";

export interface QuestionMarkScheme {
  questionId: string;
  expected: string;
  accept: string[];
  reject: string[];
  marks: number;
  guidance: string;
}

export interface Paper1MarkCriterion {
  criterion: string;
  marks: number;
  topBand: string;
  teacherFocus: string;
}

export interface Skill {
  id: string;
  title: string;
  category: Category;
  level: 1 | 2 | 3 | 4 | 5;
  description: string;
  examRelevance: string;
  prerequisites: string[];
  lessonIds: string[];
  exerciseIds: string[];
  tags: string[];
}

export interface LessonExample {
  label: string;
  french: string;
  note: string;
}

export interface Lesson {
  id: string;
  skillId: string;
  title: string;
  category: Category;
  level: 1 | 2 | 3 | 4 | 5;
  explanation: string;
  rules: string[];
  examples: LessonExample[];
  commonMistakes: string[];
  examUse: string;
  exerciseIds: string[];
}

export interface Exercise {
  id: string;
  skillId: string;
  type: ExerciseType;
  level: 1 | 2 | 3 | 4 | 5;
  prompt: string;
  options?: string[];
  correctAnswer: string | string[];
  acceptableAnswers?: string[];
  explanation: string;
  tags: string[];
  examComponent: ExamComponent;
  marks?: number;
  markScheme?: QuestionMarkScheme;
}

export interface ExerciseAttempt {
  exerciseId: string;
  score: number;
  date: string;
}

export interface SkillProgress {
  skillId: string;
  attempts: ExerciseAttempt[];
  bestScore: number;
  lastScore: number;
  mastery: number;
  status: ProgressStatus;
  lastPracticed?: string;
  nextReviewDate?: string;
  notes?: string;
  manualOverride?: boolean;
}

export interface ActivityItem {
  id: string;
  date: string;
  label: string;
  detail: string;
  score?: number;
}

export interface WritingAttempt {
  id: string;
  date: string;
  prompt: string;
  selectedTextType: string;
  response: string;
  wordCount: number;
  selfCheck: string[];
  teacherFeedback: string;
  languageScoreEstimate?: number;
  messageScoreEstimate?: number;
  conceptualScoreEstimate?: number;
  nextSteps: string;
}

export interface ProgressState {
  skillProgress: Record<string, SkillProgress>;
  activity: ActivityItem[];
  writingAttempts: WritingAttempt[];
  diagnosticCompleted: boolean;
}

export interface VocabularyItem {
  french: string;
  gender?: "m" | "f";
  plural?: string;
  english: string;
  example: string;
  collocations: string[];
  related: string[];
  falseFriendWarning?: string;
}

export interface VocabularyFamily {
  id: string;
  family: string;
  theme: string;
  cefr: "A2" | "B1" | "B2";
  items: VocabularyItem[];
  sentenceStems: string[];
}

export interface FauxAmi {
  id: string;
  french: string;
  wrongAssumption: string;
  correctMeaning: string;
  englishEquivalent: string;
  wrongSentence: string;
  correctedSentence: string;
  miniExercise: string;
  riskLevel: "low" | "medium" | "high";
}

export interface CultureTopic {
  id: string;
  theme: string;
  topic: string;
  keyVocabulary: string[];
  usefulExpressions: string[];
  francophoneKnowledge: string;
  paper1Angles: string[];
  readingTextIdea: string;
  listeningTextIdea: string;
  discussionQuestions: string[];
  commonMistakes: string[];
  connectors: string[];
}

export interface TextTypeCard {
  id: string;
  title: string;
  whenToChoose: string;
  whenNotToChoose: string;
  audience: string;
  register: string;
  structure: string[];
  openings: string[];
  closings: string[];
  conventions: string[];
  commonMistakes: string[];
  usefulPhrases: string[];
  miniModel: string;
  checklist: string[];
  practiceTask: string;
}

export interface Paper1Task {
  id: string;
  theme: string;
  prompt: string;
  textTypeChoices: string[];
  planningHints: string[];
  markScheme?: Paper1MarkCriterion[];
}

export interface Paper1Mock {
  id: string;
  title: string;
  durationMinutes: number;
  tasks: Paper1Task[];
}

export interface TopicStimulus {
  imageUrl: string;
  imageFile: string;
  imageSourcePptx?: string;
  imageSourceMedia?: string;
  studentText: string;
  studentAudioUrl: string;
  studentAudioFile: string;
  studentVoice: string;
}

export interface ReadingText {
  id: string;
  title: string;
  theme: string;
  difficulty: "A" | "B" | "C";
  sourceType?: string;
  wordCount?: number;
  text: string;
  questions: Exercise[];
}

export interface ReadingMock {
  id: string;
  title: string;
  totalMarks: number;
  texts: ReadingText[];
}

export interface ListeningText {
  id: string;
  title: string;
  theme: string;
  script: string;
  audioUrl?: string;
  audioFile?: string;
  voice?: string;
  instructions: string;
  noteSpacePrompt: string;
  questions: Exercise[];
}

export interface ListeningMock {
  id: string;
  title: string;
  totalMarks: number;
  texts: ListeningText[];
}
