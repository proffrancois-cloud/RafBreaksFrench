import fs from "node:fs";
import path from "node:path";

const frenchEaseRoot = process.env.FRENCHEASE_ROOT || path.resolve("..", "Playground", "FrenchEase");
const appOutput = path.resolve("src/features/dp-french/data/premiumMockPapers.generated.ts");
const publicAudioRoot = path.resolve("public/frenchease/premium-mock-papers/audio");

const readingFinalRoot = path.join(frenchEaseRoot, "Paper_2_Reading", "05_final_validated_outputs");
const readingDevelopmentRoot = path.join(frenchEaseRoot, "Paper_2_Reading", "02_topic_development");
const listeningFinalRoot = path.join(frenchEaseRoot, "Paper_2_Listening", "05_final_validated_outputs");
const listeningMockRoot = path.join(frenchEaseRoot, "Paper_2_Listening", "04_assessment_assets", "mock_booklets");
const listeningAudioRoot = path.join(frenchEaseRoot, "Paper_2_Listening", "03_audio_outputs");

const themeLabels = {
  identites: "Identités",
  experiences: "Expériences",
  ingeniosite_humaine: "Ingéniosité humaine",
  organisation_sociale: "Organisation sociale",
  partage_de_la_planete: "Partage de la planète",
};

const topicLabels = {
  activites_de_loisirs: "activités de loisirs",
  communications_et_medias: "communications et médias",
  communaute: "communauté",
  convictions_et_valeurs: "convictions et valeurs",
  coutumes_et_traditions: "coutumes et traditions",
  divertissements: "divertissements",
  droits_de_lhomme_egalite: "droits de l'homme",
  education: "éducation",
  engagement_social: "engagement social",
  environnement: "environnement",
  environnements_urbains_et_ruraux: "environnements urbains et ruraux",
  ethique: "éthique",
  expressions_artistiques: "expressions artistiques",
  innovation_scientifique: "innovation scientifique",
  langue_et_identite: "langue et identité",
  migration: "migration",
  mondialisation: "mondialisation",
  monde_du_travail: "monde du travail",
  ordre_public: "ordre public",
  paix_et_conflits: "paix et conflits",
  relations_sociales: "relations sociales",
  rites_de_passage: "rites de passage",
  sante_et_bien_etre: "santé et bien-être",
  sous_cultures: "sous-cultures",
  styles_de_vie: "styles de vie",
  technologie: "technologie",
  vacances_et_voyages: "vacances et voyages",
};

const normalizeKey = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const decodeEntities = (value) =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)));

const cleanText = (html) =>
  decodeEntities(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/tr>|<\/li>|<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

const linesFromText = (value) =>
  value
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const readIfExists = (filePath) => (filePath && fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "");

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
};

const latestByVersion = (files) =>
  files.sort((a, b) => {
    const versionA = Number((path.basename(a).match(/v(\d+)/i) ?? [0, 0])[1]);
    const versionB = Number((path.basename(b).match(/v(\d+)/i) ?? [0, 0])[1]);
    if (versionA !== versionB) return versionB - versionA;
    return path.basename(b).localeCompare(path.basename(a));
  })[0];

const extractCells = (row) =>
  [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
    .map((match) =>
      decodeEntities(match[1])
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );

const compactExpected = (value) =>
  value
    .replace(/`/g, "")
    .replace(/\s+—\s+/g, " - ")
    .replace(/\s+/g, " ")
    .trim();

const parseMarkschemeHtml = (filePath) => {
  const html = readIfExists(filePath);
  const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)];
  const parsed = [];

  for (const rowMatch of rows) {
    const cells = extractCells(rowMatch[0]);
    if (cells.length < 3 || /^question$/i.test(cells[0])) continue;
    const questionNumber = cells[0].replace(/\.$/, "");
    if (!/^\d{1,2}$/.test(questionNumber)) continue;
    const pointsIndex = cells.findLastIndex((cell) => /^\d+$/.test(cell.trim()));
    if (pointsIndex < 2) continue;
    const prefix = html.slice(Math.max(0, rowMatch.index - 4000), rowMatch.index);
    const labelMatch = [...prefix.matchAll(/Texte\s+([ABC])/gi)].pop();
    parsed.push({
      number: questionNumber,
      textLabel: labelMatch ? `Texte ${labelMatch[1].toUpperCase()}` : "Texte A",
      expected: compactExpected(cells[1] ?? ""),
      accepted: cells[2] && !/^[-—]+$/.test(cells[2]) ? compactExpected(cells[2]) : "",
      rejected: cells[3] && !/^[-—]+$/.test(cells[3]) ? compactExpected(cells[3]) : "",
      marks: Number(cells[pointsIndex] ?? 1),
    });
  }

  if (parsed.length) return parsed;
  return parseMarkschemeText(cleanText(html));
};

const parseMarkschemeMarkdown = (filePath) => parseMarkschemeText(readIfExists(filePath));

const parseMarkschemeText = (text) => {
  const lines = linesFromText(text);
  const parsed = [];
  let currentTextLabel = "Texte A";

  for (const line of lines) {
    const labelMatch = line.match(/^#{0,3}\s*Texte\s+([ABC])/i);
    if (labelMatch) {
      currentTextLabel = `Texte ${labelMatch[1].toUpperCase()}`;
      continue;
    }
    if (!line.includes("|")) continue;
    const cells = line.split("|").map((cell) => compactExpected(cell.trim()));
    if (cells[0] === "") cells.shift();
    if (cells.at(-1) === "") cells.pop();
    if (cells.length < 5 || !/^\d{1,2}$/.test(cells[0]) || /^-+$/.test(cells[1] ?? "")) continue;
    const points = Number(cells[4]);
    if (!Number.isFinite(points)) continue;
    parsed.push({
      number: cells[0],
      textLabel: currentTextLabel,
      expected: cells[1],
      accepted: cells[2] ?? "",
      rejected: cells[3] ?? "",
      marks: points,
    });
  }

  if (parsed.length) return parsed;

  for (const line of lines) {
    const labelMatch = line.match(/^Texte\s+([ABC])/i);
    if (labelMatch) {
      currentTextLabel = `Texte ${labelMatch[1].toUpperCase()}`;
      continue;
    }
    const rowMatch = line.match(/^(\d{1,2})\.?\s+(.+?)\s+(\d+)$/);
    if (!rowMatch) continue;
    parsed.push({
      number: rowMatch[1],
      textLabel: currentTextLabel,
      expected: compactExpected(rowMatch[2]),
      accepted: "",
      rejected: "",
      marks: Number(rowMatch[3]),
    });
  }

  return parsed;
};

const skipBookletLine = (line) =>
  /^(NOM et PRÉNOM|French B|Français B|Instructions aux candidats|Répondez à toutes les questions|Sauf indication|Les réponses doivent|FE-|Question Booklet|Livret de questions|Question booklet|Markscheme|Barème|Standard level|Niveau moyen|TeachersPayTeachers|teacherspayteachers|Notes:|– \d+ –|\d+$)/i.test(
    line,
  );

const parseQuestionBooklet = (filePath) => {
  const raw = readIfExists(filePath);
  const source = filePath.endsWith(".html") ? cleanText(raw) : raw.replace(/\r/g, "");
  const lines = linesFromText(source)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter((line) => !skipBookletLine(line))
    .filter((line) => !/^Thème\s*:|^Topic\s*:|^Transcript source/i.test(line))
    .filter((line) => !/^#{1,2}\s+/.test(line) || /^#{1,2}\s+Texte\s+[ABC]/i.test(line));

  const questions = [];
  let currentTextLabel = "Texte A";
  let currentQuestion = null;
  let pendingInstruction = "";

  const pushCurrent = () => {
    if (!currentQuestion) return;
    currentQuestion.prompt = currentQuestion.prompt
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (currentQuestion.prompt) questions.push(currentQuestion);
    currentQuestion = null;
  };

  for (const line of lines) {
    const textMatch = line.match(/^#{0,3}\s*Texte\s+([ABC])(?:\s+\(suite\))?/i);
    if (textMatch) {
      pushCurrent();
      currentTextLabel = `Texte ${textMatch[1].toUpperCase()}`;
      pendingInstruction = "";
      continue;
    }

    if (line.includes("|")) {
      const tableCells = line.split("|").map((cell) => cell.trim());
      if (tableCells[0] === "") tableCells.shift();
      if (tableCells.at(-1) === "") tableCells.pop();
      if (/^\d{1,2}$/.test(tableCells[0]) && tableCells[1] && !/^[-]+$/.test(tableCells[1])) {
        pushCurrent();
        currentQuestion = {
          number: tableCells[0],
          textLabel: currentTextLabel,
          prompt: [pendingInstruction, tableCells[1]].filter(Boolean),
        };
        pendingInstruction = "";
        continue;
      }
    }

    const questionMatch = line.match(/^(\d{1,2})[\.)]\s*(.*)$/);
    if (questionMatch) {
      pushCurrent();
      currentQuestion = {
        number: questionMatch[1],
        textLabel: currentTextLabel,
        prompt: [pendingInstruction, questionMatch[2]].filter(Boolean),
      };
      pendingInstruction = "";
      continue;
    }

    if (!currentQuestion) {
      if (/^(Choisissez|Répondez|Remplissez|Pour chaque|Les affirmations|Affirmation|À qui|Trouvez|En vous basant)/i.test(line)) {
        pendingInstruction = [pendingInstruction, line].filter(Boolean).join("\n");
      }
      continue;
    }

    currentQuestion.prompt.push(line);
  }

  pushCurrent();
  return questions;
};

const parseTexts = (filePath) => {
  const raw = readIfExists(filePath);
  const source = filePath.endsWith(".html") ? cleanText(raw) : raw.replace(/\r/g, "");
  const lines = linesFromText(source).filter((line) => !/^FE-/.test(line) && !/^teacherspayteachers/i.test(line) && !/^\d+$/.test(line));
  const sections = [];
  let current = null;

  for (const line of lines) {
    const textMatch = line.match(/^#{0,3}\s*Texte\s+([ABC])/i);
    if (textMatch) {
      if (current) sections.push(current);
      current = { label: `Texte ${textMatch[1].toUpperCase()}`, lines: [] };
      continue;
    }
    if (!current) continue;
    if (/^(Thème|Topic|Transcript source|French B|Français B|Transcripts des textes|Technologie -|Styles de vie -)/i.test(line)) continue;
    current.lines.push(line.replace(/^\*\*(.*)\*\*$/, "$1"));
  }

  if (current) sections.push(current);
  return sections.map((section) => ({
    label: section.label,
    title: section.lines[0] ?? section.label,
    body: section.lines.slice(1).join("\n\n").trim() || section.lines.join("\n\n").trim(),
  }));
};

const mergeQuestionsAndMarkscheme = (paperId, questions, markscheme) =>
  markscheme.map((row) => {
    const prompt = questions.find((question) => question.number === row.number);
    const fallbackPrompt = row.expected?.match?.(/^[A-J](,\s*[A-J])*/i)
      ? `Choisissez la réponse pour la question ${row.number}.`
      : `Répondez à la question ${row.number}.`;
    return {
      id: `${paperId}-q${row.number}`,
      number: row.number,
      textLabel: row.textLabel || prompt?.textLabel || "Texte A",
      prompt: prompt?.prompt || fallbackPrompt,
      marks: row.marks,
      expectedAnswer: row.expected,
      acceptedAnswer: row.accepted,
      rejectedAnswer: row.rejected,
    };
  });

const copyAudio = (sourceFile, themeKey, topicKey, label) => {
  if (!sourceFile || !fs.existsSync(sourceFile)) return undefined;
  const destinationDir = path.join(publicAudioRoot, themeKey, topicKey);
  fs.mkdirSync(destinationDir, { recursive: true });
  const destinationFile = `${label.toLowerCase().replace(/\s+/g, "-")}.mp3`;
  const destination = path.join(destinationDir, destinationFile);
  fs.copyFileSync(sourceFile, destination);
  return `/frenchease/premium-mock-papers/audio/${themeKey}/${topicKey}/${destinationFile}`;
};

const attachAudio = (texts, audioFiles, themeKey, topicKey) =>
  texts.map((text) => {
    const audioFile = audioFiles[text.label];
    return {
      ...text,
      audioUrl: copyAudio(audioFile, themeKey, topicKey, text.label),
      audioFile: audioFile ? path.basename(audioFile) : undefined,
    };
  });

const gradeBands = [
  { min: 85, grade: 7 },
  { min: 73, grade: 6 },
  { min: 61, grade: 5 },
  { min: 49, grade: 4 },
  { min: 37, grade: 3 },
  { min: 25, grade: 2 },
  { min: 0, grade: 1 },
];

const createPaper = ({ kind, themeKey, topicKey, variant, texts, questions, markscheme }) => {
  const theme = themeLabels[themeKey] ?? themeKey.replaceAll("_", " ");
  const topic = topicLabels[topicKey] ?? topicKey.replaceAll("_", " ");
  const paperId = `${kind.toLowerCase().replace(/\s+/g, "-")}-${themeKey}-${topicKey}-${normalizeKey(variant)}`;
  const mergedQuestions = mergeQuestionsAndMarkscheme(paperId, questions, markscheme);
  return {
    id: paperId,
    kind,
    theme,
    topic,
    themeKey: normalizeKey(theme),
    topicKey: normalizeKey(topic),
    variant,
    totalMarks: mergedQuestions.reduce((sum, question) => sum + question.marks, 0),
    gradeBands,
    texts,
    questions: mergedQuestions,
  };
};

const readingPapers = [];
const listeningPapers = [];

const addReadingPaper = ({ themeKey, topicKey, variant, textFile, questionFile, markschemeFile }) => {
  const texts = parseTexts(textFile);
  const questions = parseQuestionBooklet(questionFile);
  const markscheme = markschemeFile.endsWith(".html") ? parseMarkschemeHtml(markschemeFile) : parseMarkschemeMarkdown(markschemeFile);
  if (!texts.length || !markscheme.length) return;
  readingPapers.push(
    createPaper({
      kind: "Paper 2 Reading",
      themeKey,
      topicKey,
      variant,
      texts,
      questions,
      markscheme,
    }),
  );
};

addReadingPaper({
  themeKey: "ingeniosite_humaine",
  topicKey: "technologie",
  variant: "FrenchEase premium v1",
  textFile: path.join(readingFinalRoot, "ingeniosite_humaine", "technologie", "02_text_booklet", "technologie_reading_text_booklet_premium_v1.html"),
  questionFile: path.join(readingFinalRoot, "ingeniosite_humaine", "technologie", "03_question_booklet", "technologie_reading_question_booklet_premium_v1.html"),
  markschemeFile: path.join(readingFinalRoot, "ingeniosite_humaine", "technologie", "04_markscheme", "technologie_reading_markscheme_premium_v1.html"),
});

addReadingPaper({
  themeKey: "identites",
  topicKey: "styles_de_vie",
  variant: "FrenchEase development v1",
  textFile: path.join(readingDevelopmentRoot, "identites", "styles_de_vie", "styles_de_vie_reading_texts_v1.md"),
  questionFile: path.join(readingDevelopmentRoot, "identites", "styles_de_vie", "styles_de_vie_reading_question_booklet_v1.md"),
  markschemeFile: path.join(readingDevelopmentRoot, "identites", "styles_de_vie", "styles_de_vie_reading_markscheme_v1.md"),
});

const addListeningPaper = ({ themeKey, topicKey, variant, transcriptFile, questionFile, markschemeFile, audioFiles }) => {
  const texts = attachAudio(parseTexts(transcriptFile), audioFiles, normalizeKey(themeLabels[themeKey] ?? themeKey), normalizeKey(topicLabels[topicKey] ?? topicKey),);
  const questions = parseQuestionBooklet(questionFile);
  const markscheme = markschemeFile.endsWith(".html") ? parseMarkschemeHtml(markschemeFile) : parseMarkschemeMarkdown(markschemeFile);
  if (!texts.length || !markscheme.length) return;
  listeningPapers.push(
    createPaper({
      kind: "Paper 2 Listening",
      themeKey,
      topicKey,
      variant,
      texts,
      questions,
      markscheme,
    }),
  );
};

const finalListeningAudio = (topicKey) => ({
  "Texte A": latestByVersion(walk(path.join(listeningFinalRoot, "ingeniosite_humaine", topicKey, "01_audio", "texte_a")).filter((file) => file.endsWith(".mp3"))),
  "Texte B": latestByVersion(walk(path.join(listeningFinalRoot, "ingeniosite_humaine", topicKey, "01_audio", "texte_b")).filter((file) => file.endsWith(".mp3"))),
  "Texte C": latestByVersion(walk(path.join(listeningFinalRoot, "ingeniosite_humaine", topicKey, "01_audio", "texte_c")).filter((file) => file.endsWith(".mp3"))),
});

const stylesAudioDir = path.join(listeningAudioRoot, "identites", "styles_de_vie");
addListeningPaper({
  themeKey: "identites",
  topicKey: "styles_de_vie",
  variant: "Question booklet 1",
  transcriptFile: path.join(listeningFinalRoot, "identites", "styles_de_vie", "05_Transcript", "styles_de_vie_transcripts_des_textes.html"),
  questionFile: path.join(listeningFinalRoot, "identites", "styles_de_vie", "03_question_booklets", "booklet_1", "styles_de_vie_question_booklet_1_rev4_mock_layout.html"),
  markschemeFile: path.join(listeningFinalRoot, "identites", "styles_de_vie", "04_markschemes", "markscheme_1", "styles_de_vie_markscheme_booklet_1_rev4_mock_layout.html"),
  audioFiles: {
    "Texte A": path.join(stylesAudioDir, "styles de vie - Texte A.mp3"),
    "Texte B": path.join(stylesAudioDir, "styles de vie - Texte B.mp3"),
    "Texte C": path.join(stylesAudioDir, "styles de vie - Texte C.mp3"),
  },
});

addListeningPaper({
  themeKey: "identites",
  topicKey: "styles_de_vie",
  variant: "Question booklet 2",
  transcriptFile: path.join(listeningFinalRoot, "identites", "styles_de_vie", "05_Transcript", "styles_de_vie_transcripts_des_textes.html"),
  questionFile: path.join(listeningFinalRoot, "identites", "styles_de_vie", "03_question_booklets", "booklet_2", "styles_de_vie_question_booklet_2_rev4_mock_layout.html"),
  markschemeFile: path.join(listeningFinalRoot, "identites", "styles_de_vie", "04_markschemes", "markscheme_2", "styles_de_vie_markscheme_booklet_2_rev4_mock_layout.html"),
  audioFiles: {
    "Texte A": path.join(stylesAudioDir, "styles de vie - Texte A.mp3"),
    "Texte B": path.join(stylesAudioDir, "styles de vie - Texte B.mp3"),
    "Texte C": path.join(stylesAudioDir, "styles de vie - Texte C.mp3"),
  },
});

const santeAudioDir = path.join(listeningAudioRoot, "identites", "sante_et_bien_etre");
addListeningPaper({
  themeKey: "identites",
  topicKey: "sante_et_bien_etre",
  variant: "Question booklet 1",
  transcriptFile: path.join(listeningFinalRoot, "identites", "sante_et_bien_etre", "05_Transcript", "sante_et_bien_etre_transcripts_des_textes.html"),
  questionFile: path.join(listeningFinalRoot, "identites", "sante_et_bien_etre", "03_question_booklets", "booklet_1", "sante_bien_etre_question_booklet_1_mock_layout.html"),
  markschemeFile: path.join(listeningFinalRoot, "identites", "sante_et_bien_etre", "04_markschemes", "markscheme_1", "sante_bien_etre_markscheme_booklet_1_rev2_mock_layout.html"),
  audioFiles: {
    "Texte A": path.join(santeAudioDir, "sante et bien etre updated - Texte A.mp3"),
    "Texte B": path.join(santeAudioDir, "sante et bien etre updated - Texte B - Francois Olga.mp3"),
  },
});

for (const topicKey of ["technologie", "divertissements"]) {
  const topicDir = path.join(listeningMockRoot, "ingeniosite_humaine", topicKey);
  const finalDir = path.join(listeningFinalRoot, "ingeniosite_humaine", topicKey);
  const transcriptFile =
    latestByVersion(walk(path.join(finalDir, "05_Transcript")).filter((file) => /transcripts.*\.html$/i.test(file))) ??
    latestByVersion(walk(topicDir).filter((file) => /transcripts.*\.md$/i.test(file)));
  for (const variantNumber of [1, 2]) {
    const questionFile = latestByVersion(walk(topicDir).filter((file) => new RegExp(`question_booklet_${variantNumber}.*\\.md$`, "i").test(file)));
    const markschemeFile = latestByVersion(walk(topicDir).filter((file) => new RegExp(`markscheme_${variantNumber}.*\\.md$`, "i").test(file)));
    if (!questionFile || !markschemeFile || !transcriptFile) continue;
    addListeningPaper({
      themeKey: "ingeniosite_humaine",
      topicKey,
      variant: `Question booklet ${variantNumber}`,
      transcriptFile,
      questionFile,
      markschemeFile,
      audioFiles: finalListeningAudio(topicKey),
    });
  }
}

const expressionsDir = path.join(listeningMockRoot, "ingeniosite_humaine", "expressions_artistiques");
for (const variantNumber of [1, 2]) {
  addListeningPaper({
    themeKey: "ingeniosite_humaine",
    topicKey: "expressions_artistiques",
    variant: `Question booklet ${variantNumber}`,
    transcriptFile: path.join(expressionsDir, "expressions_artistiques_transcripts_premium_v1.md"),
    questionFile: path.join(expressionsDir, `expressions_artistiques_question_booklet_${variantNumber}_premium_v1.md`),
    markschemeFile: path.join(expressionsDir, `expressions_artistiques_markscheme_${variantNumber}_premium_v1.md`),
    audioFiles: finalListeningAudio("expressions_artistiques"),
  });
}

const output = `// Generated by scripts/generate-premium-mock-papers.mjs. Do not edit by hand.

export interface PremiumMockText {
  label: string;
  title: string;
  body: string;
  audioUrl?: string;
  audioFile?: string;
}

export interface PremiumMockQuestion {
  id: string;
  number: string;
  textLabel: string;
  prompt: string;
  marks: number;
  expectedAnswer: string;
  acceptedAnswer: string;
  rejectedAnswer: string;
}

export interface PremiumGradeBand {
  min: number;
  grade: number;
}

export interface PremiumMockPaper {
  id: string;
  kind: "Paper 2 Reading" | "Paper 2 Listening";
  theme: string;
  topic: string;
  themeKey: string;
  topicKey: string;
  variant: string;
  totalMarks: number;
  gradeBands: PremiumGradeBand[];
  texts: PremiumMockText[];
  questions: PremiumMockQuestion[];
}

export const premiumReadingPapers: PremiumMockPaper[] = ${JSON.stringify(readingPapers, null, 2)};

export const premiumListeningPapers: PremiumMockPaper[] = ${JSON.stringify(listeningPapers, null, 2)};
`;

fs.mkdirSync(path.dirname(appOutput), { recursive: true });
fs.writeFileSync(appOutput, output);

console.log(`Generated ${readingPapers.length} reading premium papers and ${listeningPapers.length} listening premium papers.`);
