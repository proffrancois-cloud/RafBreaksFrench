import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const frenchEaseRoot = process.env.FRENCHEASE_ROOT || path.resolve("..", "Playground", "FrenchEase");
const sourceDir = path.join(frenchEaseRoot, "Paper_2_Listening", "01_references", "stimuli_raw_march27");
const sourceDeckName = "Stimuli raw march27 - IA completed 2026-06-05.pptx";
const sourcePptx = path.join(sourceDir, sourceDeckName);
const assignmentReport = path.join(sourceDir, "stimuli_raw_march27_assignment_report_2026-04-04.json");
const publicImageRoot = path.resolve("public/frenchease/mock-exams/ia/images");
const appOutput = path.resolve("src/features/dp-french/data/iaStimuli.generated.ts");

const normalizeKey = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const decodeXml = (value) =>
  value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)));

const cleanText = (value) =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([«])\s+/g, "$1")
    .replace(/\s+([»])/g, "$1")
    .trim();

const readPptxEntry = (entryPath, encoding = "utf8") => {
  const result = spawnSync("unzip", ["-p", sourcePptx, entryPath], {
    encoding,
    maxBuffer: 100 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Could not read ${entryPath} from ${sourceDeckName}: ${result.stderr?.toString?.() ?? ""}`);
  }
  return result.stdout;
};

const attr = (node, name) => {
  const match = node.match(new RegExp(`${name}="([^"]+)"`));
  return match?.[1];
};

const slideXml = (slideNumber) => readPptxEntry(`ppt/slides/slide${slideNumber}.xml`);

const slideRelationships = (slideNumber) => {
  const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
  const xml = readPptxEntry(relsPath);
  const relationships = new Map();
  for (const match of xml.matchAll(/<Relationship\b[^>]+>/g)) {
    const node = match[0];
    const id = attr(node, "Id");
    const target = attr(node, "Target");
    if (id && target) relationships.set(id, target);
  }
  return relationships;
};

const targetToZipPath = (target) => {
  if (target.startsWith("/")) return target.slice(1);
  return path.posix.normalize(path.posix.join("ppt/slides", target));
};

const extractParagraphs = (xml) =>
  [...xml.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)]
    .map((paragraph) =>
      [...paragraph[0].matchAll(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g)]
        .map((text) => decodeXml(text[1]))
        .join(""),
    )
    .map(cleanText)
    .filter(Boolean);

const extractImageTargets = (slideNumber) => {
  const xml = slideXml(slideNumber);
  const rels = slideRelationships(slideNumber);
  return [...xml.matchAll(/<a:blip\b[^>]*(?:r:embed|embed)="([^"]+)"/g)]
    .map((match) => rels.get(match[1]))
    .filter(Boolean)
    .filter((target) => !target.toLowerCase().endsWith(".gif"))
    .map(targetToZipPath);
};

const copySlideImage = ({ slideNumber, themeKey, topicKey, imageIndex }) => {
  const [zipPath] = extractImageTargets(slideNumber);
  if (!zipPath) throw new Error(`No image found on slide ${slideNumber}`);

  const extension = path.extname(zipPath) || ".png";
  const filename = `${String(imageIndex).padStart(2, "0")}-slide-${String(slideNumber).padStart(3, "0")}${extension}`;
  const relativePath = path.join(themeKey, topicKey, filename);
  const publicPath = path.join(publicImageRoot, relativePath);
  const imageBytes = readPptxEntry(zipPath, "buffer");

  fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  fs.writeFileSync(publicPath, imageBytes);

  return {
    imageUrl: `/frenchease/mock-exams/ia/images/${relativePath.split(path.sep).join("/")}`,
    imageFile: `ia/images/${relativePath.split(path.sep).join("/")}`,
    sourceMedia: path.posix.basename(zipPath),
  };
};

const topicTargets = (assignment) => {
  const themeKey = normalizeKey(assignment.theme);
  const topicKey = normalizeKey(assignment.topic);
  if (themeKey === "partage-de-la-planete" && topicKey.includes("droits-de-l-homme") && topicKey.includes("egalite")) {
    return [
      { themeKey, topicKey: "droits-de-l-homme", topicId: `${themeKey}-droits-de-l-homme`, topic: "droits de l'homme" },
      { themeKey, topicKey: "egalite", topicId: `${themeKey}-egalite`, topic: "égalité" },
    ];
  }
  return [{ themeKey, topicKey, topicId: `${themeKey}-${topicKey}`, topic: assignment.topic }];
};

const buildTranscript = (slideNumber) => {
  const paragraphs = extractParagraphs(slideXml(slideNumber));
  return paragraphs
    .filter((paragraph) => !/^présentation du visuel/i.test(paragraph))
    .join("\n\n");
};

const normalizeQuestion = (question) =>
  question
    .replace(/^\d+\.\s*/, "")
    .replace(/^vez-vous/i, "Avez-vous")
    .replace(/^imeriez-vous/i, "Aimeriez-vous");

const buildQuestions = (slideNumber) => {
  const questions = extractParagraphs(slideXml(slideNumber))
    .flatMap((paragraph) => paragraph.match(/[^?]+\?/g) ?? [])
    .map(cleanText)
    .map(normalizeQuestion)
    .filter((paragraph) => paragraph.length > 8);

  return questions.filter((paragraph, index, all) => all.indexOf(paragraph) === index);
};

const assignments = JSON.parse(fs.readFileSync(assignmentReport, "utf8"));
if (!fs.existsSync(sourcePptx)) throw new Error(`Missing IA source deck: ${sourcePptx}`);
if (!Array.isArray(assignments) || !assignments.length) throw new Error(`Invalid assignment report: ${assignmentReport}`);

fs.rmSync(publicImageRoot, { recursive: true, force: true });

const stimuli = [];
assignments.forEach((assignment, assignmentIndex) => {
  const imageSlide = 2 + assignmentIndex * 3;
  const transcriptSlide = imageSlide + 1;
  const questionsSlide = imageSlide + 2;
  const transcript = buildTranscript(transcriptSlide);
  const questions = buildQuestions(questionsSlide);

  for (const target of topicTargets(assignment)) {
    const image = copySlideImage({
      slideNumber: imageSlide,
      themeKey: target.themeKey,
      topicKey: target.topicKey,
      imageIndex: assignment.image_index,
    });

    stimuli.push({
      id: `ia-${target.topicId}-${String(assignment.image_index).padStart(2, "0")}-${String(imageSlide).padStart(3, "0")}`,
      theme: assignment.theme,
      themeKey: target.themeKey,
      topic: target.topic,
      topicKey: target.topicKey,
      topicId: target.topicId,
      title: `Stimulus ${assignment.image_index}`,
      imageIndex: assignment.image_index,
      imageUrl: image.imageUrl,
      imageFile: image.imageFile,
      sourceDeck: sourceDeckName,
      sourceImageSlide: imageSlide,
      sourceTranscriptSlide: transcriptSlide,
      sourceQuestionsSlide: questionsSlide,
      sourceMedia: image.sourceMedia,
      transcript,
      questions,
    });
  }
});

const output = `// Generated by scripts/generate-ia-stimuli.mjs. Do not edit by hand.

export interface IAStimulus {
  id: string;
  theme: string;
  themeKey: string;
  topic: string;
  topicKey: string;
  topicId: string;
  title: string;
  imageIndex: number;
  imageUrl: string;
  imageFile: string;
  sourceDeck: string;
  sourceImageSlide: number;
  sourceTranscriptSlide: number;
  sourceQuestionsSlide: number;
  sourceMedia: string;
  transcript: string;
  questions: string[];
}

export const iaStimuli: IAStimulus[] = ${JSON.stringify(stimuli, null, 2)};

export const iaStimuliByTopic = iaStimuli.reduce<Record<string, IAStimulus[]>>((groups, stimulus) => {
  groups[stimulus.topicId] = [...(groups[stimulus.topicId] ?? []), stimulus];
  return groups;
}, {});
`;

fs.mkdirSync(path.dirname(appOutput), { recursive: true });
fs.writeFileSync(appOutput, output);

console.log(`Generated ${stimuli.length} IA stimuli from ${assignments.length} PPTX image groups.`);
console.log(`Public IA images: ${publicImageRoot}`);
console.log(`App data: ${appOutput}`);
