import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { ExerciseRenderer } from "./components/ExerciseRenderer";
import { LessonView } from "./components/LessonView";
import { Paper1SlPackView } from "./components/Paper1SlPackView";
import { ProgressBar } from "./components/ProgressBar";
import { SkillCard } from "./components/SkillCard";
import { TextTypeCard } from "./components/TextTypeCard";
import { WritingTaskView } from "./components/WritingTaskView";
import { cultureTopics } from "./data/cultureTopics";
import { diagnosticExerciseIds, exercises, exercisesById } from "./data/exercises";
import { lessons, lessonsById } from "./data/lessons";
import { iaStimuliByTopic } from "./data/iaStimuli.generated";
import { mockExamThemes } from "./data/mockExamCatalog.generated";
import { premiumListeningPapers, premiumReadingPapers, type PremiumGradeBand, type PremiumMockPaper } from "./data/premiumMockPapers.generated";
import { categoryOrder, skills, skillsById } from "./data/skills";
import { textTypes } from "./data/textTypes";
import {
  addWritingAttempt,
  createEmptyProgress,
  defaultSkillProgress,
  exportProgress,
  loadProgress,
  markSkillMastered,
  markSkillNeedsReview,
  parseImportedProgress,
  recordExerciseResult,
  saveProgress,
} from "./services/progressService";
import { resolveAssetUrl } from "./services/assetService";
import { getCategorySummaries, getNextLessonRecommendation, getOverallReadiness } from "./services/recommendationService";
import { speakFrench, stopSpeaking } from "./services/ttsService";
import type { Category, Exercise, ListeningMock, ProgressState, ReadingMock, Skill, WritingAttempt } from "./types";

type View = "Dashboard" | "Lessons" | "Practice" | "DP Themes" | "Paper 1 Pack" | "Text Types" | "Progress";
type DPThemeMode = "Culture" | "Mock Exam";
type MockPaperType = "Paper 1" | "Paper 2 Reading" | "Paper 2 Listening" | "IA";
type ThemeTone = "blue" | "green" | "purple" | "yellow" | "red";
type PaperSessionKind = "Paper 2 Reading" | "Paper 2 Listening";

interface PaperSessionText {
  label: string;
  title: string;
  body: string;
  audioUrl?: string;
  audioFile?: string;
  voice?: string;
}

interface PaperSessionQuestion {
  id: string;
  number: string;
  textLabel: string;
  prompt: string;
  marks: number;
  expectedAnswer: string;
  acceptedAnswer: string;
  rejectedAnswer: string;
}

interface PaperSession {
  id: string;
  kind: PaperSessionKind;
  theme: string;
  topic: string;
  variant: string;
  totalMarks: number;
  gradeBands: PremiumGradeBand[];
  texts: PaperSessionText[];
  questions: PaperSessionQuestion[];
}

const navItems: View[] = ["Dashboard", "Lessons", "Practice", "DP Themes", "Paper 1 Pack", "Text Types", "Progress"];
const dpThemeModes: DPThemeMode[] = ["Culture", "Mock Exam"];
const mockPaperTypes: MockPaperType[] = ["Paper 1", "Paper 2 Reading", "Paper 2 Listening", "IA"];
const defaultMockTheme = mockExamThemes[0];
const defaultMockTopic = defaultMockTheme.topics[0];
const mockTopicCount = mockExamThemes.reduce((sum, theme) => sum + theme.topics.length, 0);
const mockPaperSetCount = mockTopicCount * mockPaperTypes.length;

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const cultureKey = (theme: string, topic: string) => `${normalizeKey(theme)}:${normalizeKey(topic)}`;
const themeToneByKey: Record<string, ThemeTone> = {
  identites: "blue",
  experiences: "green",
  "ingeniosite-humaine": "purple",
  "organisation-sociale": "yellow",
  "partage-de-la-planete": "red",
};

const defaultGradeBands: PremiumGradeBand[] = [
  { min: 85, grade: 7 },
  { min: 73, grade: 6 },
  { min: 61, grade: 5 },
  { min: 49, grade: 4 },
  { min: 37, grade: 3 },
  { min: 25, grade: 2 },
  { min: 0, grade: 1 },
];

const normalizeAnswer = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/[`"“”.,!?;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitAnswerCandidates = (value: string) =>
  value
    .split(/\s*;\s*|\s+\/\s+/)
    .map((item) => item.replace(/^[`"']|[`"']$/g, "").trim())
    .filter(Boolean);

const expectedLetters = (expectedAnswer: string) => {
  const compact = expectedAnswer
    .replace(/`/g, "")
    .replace(/\s+—.+$/, "")
    .trim()
    .toUpperCase();
  if (/^[A-J](?:\s*,\s*[A-J])+$/.test(compact)) return compact.split(/\s*,\s*/);
  if (/^[A-J](?:\s+[A-J])+$/.test(compact)) return compact.split(/\s+/);
  const single = compact.match(/^([A-J])(?:\b|\s|-)/);
  return single ? [single[1]] : [];
};

const scorePaperQuestion = (question: PaperSessionQuestion, answer: string) => {
  const trimmedAnswer = answer.trim();
  if (!trimmedAnswer) return 0;

  const letters = expectedLetters(question.expectedAnswer);
  if (letters.length > 1) {
    const submittedLetters = new Set(trimmedAnswer.toUpperCase().match(/\b[A-J]\b/g) ?? []);
    if (!submittedLetters.size) {
      trimmedAnswer
        .toUpperCase()
        .replace(/[^A-J]/g, "")
        .split("")
        .forEach((letter) => submittedLetters.add(letter));
    }
    return Math.min(question.marks, letters.filter((letter) => submittedLetters.has(letter)).length);
  }
  if (letters.length === 1 && question.marks === 1) {
    const submittedLetter = trimmedAnswer.toUpperCase().match(/\b[A-J]\b/)?.[0];
    if (submittedLetter === letters[0]) return 1;
  }

  const normalizedAnswer = normalizeAnswer(trimmedAnswer);
  const candidates = [
    question.expectedAnswer.replace(/`/g, "").replace(/\s+—.+$/, "").trim(),
    ...splitAnswerCandidates(question.expectedAnswer),
    ...splitAnswerCandidates(question.acceptedAnswer),
  ]
    .map(normalizeAnswer)
    .filter(Boolean);

  const isAccepted = candidates.some((candidate) => {
    if (candidate.length <= 2) return normalizedAnswer === candidate;
    return normalizedAnswer === candidate || normalizedAnswer.includes(candidate) || candidate.includes(normalizedAnswer);
  });

  return isAccepted ? question.marks : 0;
};

const scorePaper = (paper: PaperSession, answers: Record<string, string>) => {
  const questionScores = Object.fromEntries(paper.questions.map((question) => [question.id, scorePaperQuestion(question, answers[question.id] ?? "")]));
  const score = Object.values(questionScores).reduce((sum, value) => sum + value, 0);
  const percent = paper.totalMarks ? Math.round((score / paper.totalMarks) * 100) : 0;
  const grade = paper.gradeBands.find((band) => percent >= band.min)?.grade ?? 1;
  return { questionScores, score, percent, grade };
};

const exercisePrompt = (exercise: Exercise) => {
  const options = exercise.options?.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join("\n");
  return [exercise.prompt, options].filter(Boolean).join("\n");
};

const exerciseExpectedAnswer = (exercise: Exercise) => (Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer.join(" / ") : exercise.correctAnswer);

const generatedReadingPaper = (reading: ReadingMock): PaperSession => {
  const questions = reading.texts.flatMap((text, textIndex) =>
    text.questions.map((exercise, questionIndex) => ({
      id: `${reading.id}-${exercise.id}`,
      number: String(textsBefore(reading.texts, textIndex) + questionIndex + 1),
      textLabel: `Texte ${text.difficulty}`,
      prompt: exercisePrompt(exercise),
      marks: exercise.markScheme?.marks ?? exercise.marks ?? 1,
      expectedAnswer: exercise.markScheme?.expected ?? exerciseExpectedAnswer(exercise),
      acceptedAnswer: [...(exercise.markScheme?.accept ?? []), ...(exercise.acceptableAnswers ?? [])].join(" ; "),
      rejectedAnswer: exercise.markScheme?.reject.join(" ; ") ?? "",
    })),
  );

  return {
    id: `${reading.id}-generated-session`,
    kind: "Paper 2 Reading",
    theme: reading.texts[0]?.theme ?? "French B",
    topic: reading.title,
    variant: "FrenchEase generated practice",
    totalMarks: questions.reduce((sum, question) => sum + question.marks, 0),
    gradeBands: defaultGradeBands,
    texts: reading.texts.map((text) => ({
      label: `Texte ${text.difficulty}`,
      title: text.title,
      body: text.text,
    })),
    questions,
  };
};

const generatedListeningPaper = (listening: ListeningMock): PaperSession => {
  const questions = listening.texts.flatMap((text, textIndex) =>
    text.questions.map((exercise, questionIndex) => ({
      id: `${listening.id}-${exercise.id}`,
      number: String(textsBefore(listening.texts, textIndex) + questionIndex + 1),
      textLabel: `Texte ${String.fromCharCode(65 + textIndex)}`,
      prompt: exercisePrompt(exercise),
      marks: exercise.markScheme?.marks ?? exercise.marks ?? 1,
      expectedAnswer: exercise.markScheme?.expected ?? exerciseExpectedAnswer(exercise),
      acceptedAnswer: [...(exercise.markScheme?.accept ?? []), ...(exercise.acceptableAnswers ?? [])].join(" ; "),
      rejectedAnswer: exercise.markScheme?.reject.join(" ; ") ?? "",
    })),
  );

  return {
    id: `${listening.id}-generated-session`,
    kind: "Paper 2 Listening",
    theme: listening.texts[0]?.theme ?? "French B",
    topic: listening.title,
    variant: "FrenchEase generated practice",
    totalMarks: questions.reduce((sum, question) => sum + question.marks, 0),
    gradeBands: defaultGradeBands,
    texts: listening.texts.map((text, index) => ({
      label: `Texte ${String.fromCharCode(65 + index)}`,
      title: text.title,
      body: text.script,
      audioUrl: text.audioUrl,
      audioFile: text.audioFile,
      voice: text.voice,
    })),
    questions,
  };
};

const textsBefore = <T extends { questions: Exercise[] }>(texts: T[], index: number) => texts.slice(0, index).reduce((sum, text) => sum + text.questions.length, 0);

const asPaperSession = (paper: PremiumMockPaper): PaperSession => paper;

export function DPFrenchApp() {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [activeView, setActiveView] = useState<View>("Dashboard");
  const [selectedSkillId, setSelectedSkillId] = useState(skills[0].id);
  const [selectedCategory, setSelectedCategory] = useState<Category>("Foundations");
  const [dpThemeMode, setDpThemeMode] = useState<DPThemeMode>("Culture");
  const [selectedMockThemeId, setSelectedMockThemeId] = useState(defaultMockTheme.id);
  const [selectedMockTopicId, setSelectedMockTopicId] = useState(defaultMockTopic.id);
  const [mockPaperType, setMockPaperType] = useState<MockPaperType>("Paper 1");
  const [selectedPaper1TaskId, setSelectedPaper1TaskId] = useState(defaultMockTopic.paper1.tasks[0].id);
  const [selectedPaperSourceIds, setSelectedPaperSourceIds] = useState<Record<string, string>>({});
  const [selectedIAStimulusIds, setSelectedIAStimulusIds] = useState<Record<string, string>>({});
  const [paperAnswers, setPaperAnswers] = useState<Record<string, string>>({});
  const [submittedPaperIds, setSubmittedPaperIds] = useState<Record<string, boolean>>({});
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState("");

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeView, selectedSkillId, selectedMockThemeId, selectedMockTopicId, dpThemeMode, mockPaperType]);

  const selectedSkill = skillsById[selectedSkillId] ?? skills[0];
  const selectedLesson = lessonsById[selectedSkill.lessonIds[0]];
  const selectedLessonExercises = selectedLesson.exerciseIds.map((id) => exercisesById[id]).filter(Boolean);
  const categorySummaries = useMemo(() => getCategorySummaries(progress), [progress]);
  const overallReadiness = useMemo(() => getOverallReadiness(progress), [progress]);
  const diagnosticExercises = diagnosticExerciseIds.map((id) => exercisesById[id]).filter(Boolean);
  const next = getNextLessonRecommendation(progress);
  const selectedMockTheme = mockExamThemes.find((theme) => theme.id === selectedMockThemeId) ?? defaultMockTheme;
  const selectedMockTopic = selectedMockTheme.topics.find((topic) => topic.id === selectedMockTopicId) ?? selectedMockTheme.topics[0];
  const selectedPaper1Task = selectedMockTopic.paper1.tasks.find((task) => task.id === selectedPaper1TaskId) ?? selectedMockTopic.paper1.tasks[0];
  const cultureTopicsByKey = useMemo(() => new Map(cultureTopics.map((topic) => [cultureKey(topic.theme, topic.topic), topic])), []);
  const selectedCultureTopic = cultureTopicsByKey.get(cultureKey(selectedMockTheme.theme, selectedMockTopic.topic));
  const selectedThemeTone = themeToneByKey[normalizeKey(selectedMockTheme.theme)] ?? "blue";
  const premiumReadingOptions = premiumReadingPapers.filter(
    (paper) => paper.themeKey === normalizeKey(selectedMockTheme.theme) && paper.topicKey === normalizeKey(selectedMockTopic.topic),
  );
  const premiumListeningOptions = premiumListeningPapers.filter(
    (paper) => paper.themeKey === normalizeKey(selectedMockTheme.theme) && paper.topicKey === normalizeKey(selectedMockTopic.topic),
  );
  const readingSourceKey = `${selectedMockTopic.id}:Paper 2 Reading`;
  const listeningSourceKey = `${selectedMockTopic.id}:Paper 2 Listening`;
  const selectedPremiumReadingPaper = premiumReadingOptions.find((paper) => paper.id === selectedPaperSourceIds[readingSourceKey]) ?? premiumReadingOptions[0];
  const selectedPremiumListeningPaper = premiumListeningOptions.find((paper) => paper.id === selectedPaperSourceIds[listeningSourceKey]) ?? premiumListeningOptions[0];
  const readingPaperSession = selectedPremiumReadingPaper ? asPaperSession(selectedPremiumReadingPaper) : generatedReadingPaper(selectedMockTopic.reading);
  const listeningPaperSession = selectedPremiumListeningPaper ? asPaperSession(selectedPremiumListeningPaper) : generatedListeningPaper(selectedMockTopic.listening);
  const iaStimuliForTopic = iaStimuliByTopic[selectedMockTopic.id] ?? [];
  const selectedIAStimulus = iaStimuliForTopic.find((stimulus) => stimulus.id === selectedIAStimulusIds[selectedMockTopic.id]) ?? iaStimuliForTopic[0];

  const getSkillProgress = (skillId: string) => progress.skillProgress[skillId] ?? defaultSkillProgress(skillId);

  const openLesson = (skill: Skill) => {
    setSelectedSkillId(skill.id);
    setSelectedCategory(skill.category);
    setActiveView("Lessons");
  };

  const onExerciseResult = (exercise: Exercise, score: number) => {
    const skill = skillsById[exercise.skillId];
    if (!skill) return;
    setProgress((current) => {
      const updated = recordExerciseResult(current, exercise.skillId, exercise.id, score, skill.title);
      return diagnosticExerciseIds.includes(exercise.id) ? { ...updated, diagnosticCompleted: true } : updated;
    });
  };

  const saveWriting = (attempt: Omit<WritingAttempt, "id" | "date">) => {
    setProgress((current) => addWritingAttempt(current, attempt));
  };

  const importProgress = () => {
    const parsed = parseImportedProgress(importText);
    if (!parsed) {
      setImportMessage("Import failed: paste a valid DP French progress JSON file.");
      return;
    }
    setProgress(parsed);
    setImportText("");
    setImportMessage("Progress imported.");
  };

  const renderLessons = () => {
    const categorySkills = skills.filter((skill) => skill.category === selectedCategory);

    return (
      <div className="split-layout">
        <aside className="left-rail">
          <h2>Learning path</h2>
          <div className="category-buttons">
            {categoryOrder.map((category) => (
              <button
                type="button"
                key={category}
                className={selectedCategory === category ? "is-selected" : ""}
                onClick={() => {
                  setSelectedCategory(category);
                  const first = skills.find((skill) => skill.category === category);
                  if (first) setSelectedSkillId(first.id);
                }}
              >
                <span>{category}</span>
                <small>{skills.filter((skill) => skill.category === category).length}</small>
              </button>
            ))}
          </div>
          <div className="lesson-list">
            {categorySkills.map((skill) => (
              <button
                type="button"
                key={skill.id}
                className={selectedSkillId === skill.id ? "lesson-button is-selected" : "lesson-button"}
                onClick={() => setSelectedSkillId(skill.id)}
              >
                <span>{skill.title}</span>
                <small>
                  Level {skill.level} · {getSkillProgress(skill.id).status}
                </small>
              </button>
            ))}
          </div>
        </aside>
        <main className="main-panel">
          <LessonView
            lesson={selectedLesson}
            skill={selectedSkill}
            exercises={selectedLessonExercises}
            progress={getSkillProgress(selectedSkill.id)}
            onExerciseResult={onExerciseResult}
            onMarkMastered={() => setProgress((current) => markSkillMastered(current, selectedSkill.id, selectedSkill.title))}
          />
        </main>
      </div>
    );
  };

  const renderPractice = () => {
    const weakSkills = [...skills]
      .sort((a, b) => getSkillProgress(a.id).mastery - getSkillProgress(b.id).mastery || a.level - b.level)
      .slice(0, 8);

    return (
      <div className="practice-layout">
        <section className="content-band">
          <div className="section-heading">
            <div>
              <span className="level-chip">{progress.diagnosticCompleted ? "Diagnostic started" : "Initial diagnostic"}</span>
              <h2>Mixed diagnostic test</h2>
            </div>
            {next ? (
              <button type="button" className="button button-primary" onClick={() => openLesson(next.skill)}>
                Go to next lesson
              </button>
            ) : null}
          </div>
          <p className="lead-text">
            Checks articles, gender, present tense, infinitives, past tenses, future/conditional, negation, pronouns, y/en,
            relative pronouns, prepositions, time expressions, faux amis, text-type choice and short production.
          </p>
          <div className="exercise-stack">
            {diagnosticExercises.map((exercise) => (
              <ExerciseRenderer key={exercise.id} exercise={exercise} onResult={onExerciseResult} />
            ))}
          </div>
        </section>
        <section>
          <h2>Focused practice</h2>
          <div className="skill-grid">
            {weakSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                progress={getSkillProgress(skill.id)}
                onOpen={() => openLesson(skill)}
                onMaster={() => setProgress((current) => markSkillMastered(current, skill.id, skill.title))}
                onReview={() => setProgress((current) => markSkillNeedsReview(current, skill.id, skill.title))}
              />
            ))}
          </div>
        </section>
      </div>
    );
  };

  const selectMockTheme = (theme: (typeof mockExamThemes)[number]) => {
    const firstTopic = theme.topics[0];
    setSelectedMockThemeId(theme.id);
    setSelectedMockTopicId(firstTopic.id);
    setSelectedPaper1TaskId(firstTopic.paper1.tasks[0].id);
  };

  const selectMockTopic = (topic: (typeof selectedMockTheme.topics)[number]) => {
    setSelectedMockTopicId(topic.id);
    setSelectedPaper1TaskId(topic.paper1.tasks[0].id);
  };

  const renderTopicStimulus = () =>
    selectedMockTopic.stimulus ? (
      <section className="topic-asset-card">
        <div className="topic-asset-image">
          <img src={resolveAssetUrl(selectedMockTopic.stimulus.imageUrl)} alt={`${selectedMockTopic.topic} visual stimulus`} />
        </div>
        <div className="topic-asset-copy">
          <div className="resource-card__top">
            <div>
              <span className="level-chip">PPTX image + SL text</span>
              <h3>{selectedMockTopic.topic}</h3>
            </div>
            <span className="status-pill">{selectedMockTopic.stimulus.studentVoice}</span>
          </div>
          <p>{selectedMockTopic.stimulus.studentText}</p>
          <div className="audio-player topic-audio-player">
            <audio controls preload="metadata" src={resolveAssetUrl(selectedMockTopic.stimulus.studentAudioUrl)}>
              Audio unavailable for this SL student text.
            </audio>
            <small>Qwen3 voice: {selectedMockTopic.stimulus.studentVoice}</small>
          </div>
        </div>
      </section>
    ) : null;

  const setPaperAnswer = (questionId: string, value: string) => {
    setPaperAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const resetPaper = (paper: PaperSession) => {
    setPaperAnswers((current) => {
      const nextAnswers = { ...current };
      paper.questions.forEach((question) => {
        delete nextAnswers[question.id];
      });
      return nextAnswers;
    });
    setSubmittedPaperIds((current) => ({ ...current, [paper.id]: false }));
  };

  const renderPaperSourceSelector = (papers: PremiumMockPaper[], selectedPaper: PaperSession, sourceKey: string) =>
    papers.length ? (
      <div className="paper-source-selector" aria-label={`${selectedPaper.kind} source`}>
        <span>FrenchEase source</span>
        <div className="paper-item-selector compact-source-selector">
          {papers.map((paper) => (
            <button
              type="button"
              key={paper.id}
              className={selectedPaper.id === paper.id ? "is-selected" : ""}
              onClick={() => setSelectedPaperSourceIds((current) => ({ ...current, [sourceKey]: paper.id }))}
            >
              <span>{paper.variant}</span>
              <small>
                {paper.totalMarks} marks · {paper.questions.length} questions
              </small>
            </button>
          ))}
        </div>
      </div>
    ) : (
      <p className="mock-source-note">No complete premium bundle found for this topic yet; using the generated FrenchEase practice paper.</p>
    );

  const renderPaperSession = (paper: PaperSession, sourceOptions: PremiumMockPaper[], sourceKey: string) => {
    const isSubmitted = submittedPaperIds[paper.id] ?? false;
    const result = scorePaper(paper, paperAnswers);
    const isListening = paper.kind === "Paper 2 Listening";

    return (
      <section className="paper-session">
        {renderPaperSourceSelector(sourceOptions, paper, sourceKey)}
        <div className="paper-session-summary">
          <div>
            <span className="level-chip">{paper.variant}</span>
            <h3>{paper.kind}</h3>
          </div>
          <div className="paper-score-card">
            <strong>{paper.totalMarks}</strong>
            <span>marks</span>
          </div>
        </div>

        <div className="paper-text-stack">
          {paper.texts.map((text, index) => (
            <details className="paper-text-details" key={`${paper.id}-${text.label}`} open={!isListening && index === 0}>
              <summary>
                <span>{text.label}</span>
                <strong>{text.title}</strong>
              </summary>
              {isListening ? (
                <div className="paper-audio-block">
                  {text.audioUrl ? (
                    <div className="audio-player">
                      <audio controls preload="metadata" src={resolveAssetUrl(text.audioUrl)}>
                        Your browser does not support audio playback.
                      </audio>
                      <small>{text.audioFile ?? text.voice ?? "FrenchEase audio"}</small>
                    </div>
                  ) : (
                    <div className="row-actions compact-actions">
                      <button type="button" className="button button-primary" onClick={() => speakFrench(text.body)}>
                        Play TTS fallback
                      </button>
                      <button type="button" className="button button-ghost" onClick={stopSpeaking}>
                        Stop
                      </button>
                    </div>
                  )}
                  <p className="hint">Transcript unlocks in the correction after submission.</p>
                </div>
              ) : (
                <p className="reading-text">{text.body}</p>
              )}
            </details>
          ))}
        </div>

        <div className="paper-answer-sheet">
          <div className="resource-card__top">
            <div>
              <h3>Answer sheet</h3>
              <p className="hint">Corrections and markscheme stay hidden until the paper is submitted.</p>
            </div>
            {isSubmitted ? <span className="status-pill">Submitted</span> : <span className="status-pill">In progress</span>}
          </div>

          <div className="paper-question-list">
            {paper.questions.map((question) => {
              const answer = paperAnswers[question.id] ?? "";
              const questionScore = result.questionScores[question.id] ?? 0;
              return (
                <article className="paper-question-card" key={question.id}>
                  <div className="paper-question-card__top">
                    <span>{question.textLabel}</span>
                    <strong>
                      {question.number}. {question.marks} {question.marks === 1 ? "mark" : "marks"}
                    </strong>
                  </div>
                  <p className="paper-question-prompt">{question.prompt}</p>
                  <label className="paper-answer-label">
                    <span>Your answer</span>
                    <textarea
                      className="answer-box"
                      value={answer}
                      disabled={isSubmitted}
                      onChange={(event) => setPaperAnswer(question.id, event.target.value)}
                      rows={question.prompt.length > 180 ? 3 : 2}
                    />
                  </label>
                  {isSubmitted ? (
                    <div className="paper-correction-box">
                      <div className="paper-correction-score">
                        <strong>
                          {questionScore}/{question.marks}
                        </strong>
                        <span>{questionScore === question.marks ? "Full mark" : "Review"}</span>
                      </div>
                      <div className="paper-correction-grid">
                        <span>Your answer</span>
                        <p>{answer || "No answer submitted."}</p>
                        <span>Expected</span>
                        <p>{question.expectedAnswer}</p>
                        {question.acceptedAnswer ? (
                          <>
                            <span>Accept</span>
                            <p>{question.acceptedAnswer}</p>
                          </>
                        ) : null}
                        {question.rejectedAnswer ? (
                          <>
                            <span>Do not accept</span>
                            <p>{question.rejectedAnswer}</p>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        {isListening && isSubmitted ? (
          <section className="paper-transcript-correction">
            <div className="resource-card__top">
              <h3>Listening transcripts</h3>
              <span className="status-pill">Correction</span>
            </div>
            {paper.texts.map((text) => (
              <details className="script-details" key={`${paper.id}-${text.label}-transcript`}>
                <summary>
                  {text.label}: {text.title}
                </summary>
                <p>{text.body}</p>
              </details>
            ))}
          </section>
        ) : null}

        <div className="paper-submit-bar">
          {isSubmitted ? (
            <div className="paper-final-score">
              <span>Score</span>
              <strong>
                {result.score}/{paper.totalMarks}
              </strong>
              <span>{result.percent}%</span>
              <strong>Grade {result.grade}</strong>
            </div>
          ) : (
            <p className="hint">Submit when you are ready to unlock answers, points and the markscheme.</p>
          )}
          <div className="row-actions compact-actions">
            <button type="button" className="button button-primary" onClick={() => setSubmittedPaperIds((current) => ({ ...current, [paper.id]: true }))}>
              Submit my Paper
            </button>
            <button type="button" className="button button-ghost" onClick={() => resetPaper(paper)}>
              Reset
            </button>
          </div>
        </div>
      </section>
    );
  };

  const renderCulturePanel = () => {
    const paper1Angles = selectedCultureTopic?.paper1Angles ?? selectedMockTopic.paper1.tasks.slice(0, 3).map((task) => task.prompt);
    const vocabulary = selectedCultureTopic?.keyVocabulary ?? [selectedMockTopic.topic, selectedMockTopic.francophoneAnchor, selectedMockTheme.theme];
    const discussionQuestions =
      selectedCultureTopic?.discussionQuestions ?? selectedMockTopic.reading.texts[0].questions.slice(0, 3).map((question) => question.prompt);

    return (
      <section className="dp-theme-panel">
        <div className="section-heading">
          <div>
            <span className="level-chip">{selectedMockTheme.theme}</span>
            <h2>{selectedMockTopic.topic}</h2>
          </div>
          <span className="status-pill">Culture</span>
        </div>
        <div className="culture-focus-card">
          {selectedMockTopic.stimulus ? (
            <img src={resolveAssetUrl(selectedMockTopic.stimulus.imageUrl)} alt={`${selectedMockTopic.topic} culture stimulus`} />
          ) : null}
          <div>
            <p>{selectedCultureTopic?.francophoneKnowledge ?? selectedMockTopic.productionNote}</p>
            <div className="stem-row compact-stems">
              {vocabulary.slice(0, 5).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </div>
        <details className="question-bank-details">
          <summary>
            Topic prompts <span>{paper1Angles.length + discussionQuestions.length} items</span>
          </summary>
          <div className="compact-list-grid">
            <div className="mini-list">
              <strong>Paper 1 angles</strong>
              {paper1Angles.map((angle) => (
                <span key={angle}>{angle}</span>
              ))}
            </div>
            <div className="mini-list">
              <strong>Oral questions</strong>
              {discussionQuestions.map((question) => (
                <span key={question}>{question}</span>
              ))}
            </div>
          </div>
        </details>
      </section>
    );
  };

  const renderPaper1Panel = () => (
    <section className="dp-theme-panel">
      <div className="resource-card__top">
        <div>
          <h3>{selectedMockTopic.paper1.title}</h3>
          <p className="hint">Choose one subject for this topic.</p>
        </div>
        <span className="status-pill">{selectedMockTopic.paper1.durationMinutes} minutes</span>
      </div>
      <div className="task-selector compact-task-selector">
        {selectedMockTopic.paper1.tasks.map((task, index) => (
          <button
            type="button"
            key={task.id}
            className={selectedPaper1Task.id === task.id ? "lesson-button is-selected" : "lesson-button"}
            onClick={() => setSelectedPaper1TaskId(task.id)}
          >
            <span>Subject {index + 1}</span>
            <small>{task.textTypeChoices.join(" / ")}</small>
          </button>
        ))}
      </div>
      <article className="selected-subject-card">
        <strong>{selectedPaper1Task.prompt}</strong>
        <div className="stem-row compact-stems">
          {selectedPaper1Task.textTypeChoices.map((choice) => (
            <span key={choice}>{choice}</span>
          ))}
        </div>
        <details className="question-bank-details">
          <summary>
            Planning hints <span>{selectedPaper1Task.planningHints.length}</span>
          </summary>
          <div className="mini-list">
            {selectedPaper1Task.planningHints.map((hint) => (
              <span key={hint}>{hint}</span>
            ))}
          </div>
        </details>
      </article>
      <details className="question-bank-details">
        <summary>Writing workspace</summary>
        <WritingTaskView key={selectedPaper1Task.id} task={selectedPaper1Task} onSave={saveWriting} />
      </details>
    </section>
  );

  const renderReadingPanel = () => (
    <section className="dp-theme-panel">
      {renderTopicStimulus()}
      {renderPaperSession(readingPaperSession, premiumReadingOptions, readingSourceKey)}
    </section>
  );

  const renderListeningPanel = () => (
    <section className="dp-theme-panel">
      {renderTopicStimulus()}
      {renderPaperSession(listeningPaperSession, premiumListeningOptions, listeningSourceKey)}
    </section>
  );

  const renderIAPanel = () => {
    if (!selectedIAStimulus) {
      return (
        <section className="dp-theme-panel">
          <article className="selected-text-card">
            <div className="resource-card__top">
              <div>
                <h3>IA practice</h3>
                <p className="hint">No IA visual stimulus from the March 27 completed PPTX is available for this topic yet.</p>
              </div>
              <span className="status-pill">{selectedMockTopic.topic}</span>
            </div>
          </article>
        </section>
      );
    }

    const transcriptWordCount = selectedIAStimulus.transcript.split(/\s+/).filter(Boolean).length;

    return (
      <section className="dp-theme-panel">
        {iaStimuliForTopic.length > 1 ? (
          <div className="paper-item-selector ia-stimulus-selector" aria-label="IA stimulus source">
            {iaStimuliForTopic.map((stimulus) => (
              <button
                type="button"
                key={stimulus.id}
                className={selectedIAStimulus.id === stimulus.id ? "is-selected" : ""}
                onClick={() => setSelectedIAStimulusIds((current) => ({ ...current, [selectedMockTopic.id]: stimulus.id }))}
              >
                <span>{stimulus.title}</span>
                <small>Slide {stimulus.sourceImageSlide}</small>
              </button>
            ))}
          </div>
        ) : null}

        <article className="selected-text-card ia-practice-card">
          <div className="resource-card__top">
            <div>
              <h3>IA practice</h3>
              <p className="hint">Visual stimulus and audio transcript from the IA completed PPTX.</p>
            </div>
            <span className="status-pill">{selectedIAStimulus.title}</span>
          </div>

          <div className="ia-stimulus-layout">
            <div className="ia-stimulus-image">
              <img src={resolveAssetUrl(selectedIAStimulus.imageUrl)} alt={`${selectedMockTopic.topic} IA visual stimulus ${selectedIAStimulus.imageIndex}`} />
            </div>
            <div className="ia-stimulus-copy">
              <div className="compact-list-grid">
                <div className="mini-list">
                  <strong>Prepare</strong>
                  <span>Describe the visible details first.</span>
                  <span>Connect the image to {selectedMockTheme.theme}.</span>
                  <span>Use one precise Francophone link.</span>
                </div>
                <div className="mini-list">
                  <strong>Source</strong>
                  <span>{selectedIAStimulus.sourceDeck}</span>
                  <span>Image slide {selectedIAStimulus.sourceImageSlide}</span>
                  <span>Transcript slide {selectedIAStimulus.sourceTranscriptSlide}</span>
                </div>
              </div>
              <div className="ia-action-row">
                <button type="button" className="button button-primary" onClick={() => speakFrench(selectedIAStimulus.transcript)}>
                  Play transcript
                </button>
                <button type="button" className="button button-ghost" onClick={stopSpeaking}>
                  Stop
                </button>
              </div>
            </div>
          </div>

          <details className="question-bank-details ia-transcript-details">
            <summary>
              Audio transcript <span>{transcriptWordCount} words</span>
            </summary>
            <p className="ia-transcript-text">{selectedIAStimulus.transcript}</p>
          </details>

          <details className="question-bank-details">
            <summary>
              IA question bank <span>{selectedIAStimulus.questions.length}</span>
            </summary>
            <div className="mini-list">
              {selectedIAStimulus.questions.map((question) => (
                <span key={question}>{question}</span>
              ))}
            </div>
          </details>
        </article>
      </section>
    );
  };

  const renderMockExamPanel = () => (
    <section className="dp-theme-panel">
      <div className="section-heading">
        <div>
          <span className="level-chip">{selectedMockTheme.theme}</span>
          <h2>{selectedMockTopic.topic}</h2>
        </div>
        <span className="status-pill">{mockPaperType}</span>
      </div>
      <div className="tab-row paper-type-row" aria-label="Paper type">
        {mockPaperTypes.map((paperType) => (
          <button type="button" key={paperType} className={mockPaperType === paperType ? "is-selected" : ""} onClick={() => setMockPaperType(paperType)}>
            {paperType}
          </button>
        ))}
      </div>
      <p className="mock-source-note">{selectedMockTopic.productionNote}</p>
      {mockPaperType === "Paper 1" ? renderPaper1Panel() : null}
      {mockPaperType === "Paper 2 Reading" ? renderReadingPanel() : null}
      {mockPaperType === "Paper 2 Listening" ? renderListeningPanel() : null}
      {mockPaperType === "IA" ? renderIAPanel() : null}
    </section>
  );

  const renderDPThemes = () => (
    <div className={`mock-layout dp-themes-page theme-tone-${selectedThemeTone}`}>
      <section className="content-band mock-overview dp-themes-overview">
        <div className="section-heading">
          <div>
            <span className="level-chip">FrenchEase catalog</span>
            <h2>DP Themes</h2>
          </div>
          <span className="status-pill">{mockTopicCount} topics</span>
        </div>
        <div className="tab-row dp-mode-row" aria-label="DP theme mode">
          {dpThemeModes.map((mode) => (
            <button type="button" key={mode} className={dpThemeMode === mode ? "is-selected" : ""} onClick={() => setDpThemeMode(mode)}>
              {mode}
            </button>
          ))}
        </div>
      </section>
      <div className="split-layout mock-catalog-layout dp-themes-layout">
        <aside className="left-rail mock-left-rail">
          <section className="mock-picker">
            <h2>Themes</h2>
            <div className="category-buttons">
              {mockExamThemes.map((theme) => (
                <button type="button" key={theme.id} className={selectedMockTheme.id === theme.id ? "is-selected" : ""} onClick={() => selectMockTheme(theme)}>
                  <span>{theme.theme}</span>
                  <small>{theme.topics.length}</small>
                </button>
              ))}
            </div>
          </section>
          <section className="mock-picker">
            <h2>Topics</h2>
            <div className="lesson-list">
              {selectedMockTheme.topics.map((topic) => (
                <button
                  type="button"
                  key={topic.id}
                  className={selectedMockTopic.id === topic.id ? "lesson-button is-selected" : "lesson-button"}
                  onClick={() => selectMockTopic(topic)}
                >
                  <span>{topic.topic}</span>
                  <small>{topic.francophoneAnchor}</small>
                </button>
              ))}
            </div>
          </section>
        </aside>
        <main className="main-panel mock-paper-panel dp-themes-main">{dpThemeMode === "Culture" ? renderCulturePanel() : renderMockExamPanel()}</main>
      </div>
    </div>
  );

  const renderTextTypes = () => (
    <div className="resource-layout">
      <div className="section-heading">
        <h2>Text-type trainer</h2>
        <span className="status-pill">{textTypes.length} formats</span>
      </div>
      <div className="resource-grid">
        {textTypes.map((textType) => (
          <TextTypeCard key={textType.id} textType={textType} />
        ))}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="progress-layout">
      <section className="content-band">
        <div className="section-heading">
          <div>
            <span className="level-chip">LocalStorage</span>
            <h2>Progress overview</h2>
          </div>
          <strong>{overallReadiness}% readiness</strong>
        </div>
        <div className="category-list">
          {categorySummaries.map((summary) => (
            <ProgressBar key={summary.category} label={summary.category} value={summary.mastery} />
          ))}
        </div>
      </section>
      <section className="progress-table">
        {skills.map((skill) => {
          const record = getSkillProgress(skill.id);
          return (
            <article className="progress-row" key={skill.id}>
              <div>
                <strong>{skill.title}</strong>
                <span>
                  {skill.category} · Level {skill.level}
                </span>
              </div>
              <ProgressBar value={record.mastery} />
              <span className="status-pill">{record.status}</span>
              <div className="row-actions compact-actions">
                <button type="button" className="button button-ghost" onClick={() => openLesson(skill)}>
                  Open
                </button>
                <button type="button" className="button button-ghost" onClick={() => setProgress((current) => markSkillMastered(current, skill.id, skill.title))}>
                  Master
                </button>
                <button type="button" className="button button-ghost" onClick={() => setProgress((current) => markSkillNeedsReview(current, skill.id, skill.title))}>
                  Review
                </button>
              </div>
            </article>
          );
        })}
      </section>
      <details className="settings-panel">
        <summary>Teacher settings, export and reset</summary>
        <div className="settings-grid">
          <button type="button" className="button button-primary" onClick={() => exportProgress(progress)}>
            Export progress JSON
          </button>
          <textarea className="answer-box" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste progress JSON to import" />
          <button type="button" className="button button-ghost" onClick={importProgress}>
            Import progress
          </button>
          <button type="button" className="button button-danger" onClick={() => setProgress(createEmptyProgress())}>
            Reset local progress
          </button>
          {importMessage ? <p className="hint">{importMessage}</p> : null}
        </div>
      </details>
      {progress.writingAttempts.length ? (
        <section>
          <h2>Saved writing attempts</h2>
          <div className="activity-list">
            {progress.writingAttempts.map((attempt) => (
              <div className="activity-row" key={attempt.id}>
                <strong>{attempt.selectedTextType}</strong>
                <span>{attempt.prompt}</span>
                <small>{attempt.wordCount} words</small>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );

  const renderActiveView = () => {
    if (activeView === "Dashboard") return <Dashboard progress={progress} onOpenLesson={openLesson} onOpenPractice={() => setActiveView("Practice")} />;
    if (activeView === "Lessons") return renderLessons();
    if (activeView === "Practice") return renderPractice();
    if (activeView === "DP Themes") return renderDPThemes();
    if (activeView === "Paper 1 Pack") return <Paper1SlPackView />;
    if (activeView === "Text Types") return renderTextTypes();
    return renderProgress();
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <strong>FrenchEase DP</strong>
            <small>French B SL exam trainer</small>
          </div>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => (
            <button type="button" key={item} className={activeView === item ? "is-active" : ""} onClick={() => setActiveView(item)}>
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-summary">
          <ProgressBar value={overallReadiness} label="Readiness" tone="green" />
          {next ? (
            <button type="button" className="sidebar-next" onClick={() => openLesson(next.skill)}>
              <span>Next</span>
              <strong>{next.skill.title}</strong>
            </button>
          ) : null}
        </div>
      </aside>
      <div className="mobile-nav">
        <strong>FrenchEase DP</strong>
        <select value={activeView} onChange={(event) => setActiveView(event.target.value as View)}>
          {navItems.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <main className="app-main" id="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}
