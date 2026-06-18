import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const appOutput = path.resolve("src/features/dp-french/data/mockExamCatalog.generated.ts");
const publicAudioRoot = path.resolve("public/frenchease/mock-exams/audio");
const publicStimulusImageRoot = path.resolve("public/frenchease/mock-exams/stimuli/images");
const publicStudentAudioRoot = path.resolve("public/frenchease/mock-exams/stimuli/student-audio");
const frenchEaseRoot = process.env.FRENCHEASE_ROOT || path.resolve("..", "Playground", "FrenchEase");
const frenchEaseOutput = path.join(frenchEaseRoot, "DP_French_B_SL_Mastery_Mock_Exam_Catalog");
const topicDocsOutput = path.join(frenchEaseOutput, "topics");
const frenchEaseAudioRoot = path.join(frenchEaseOutput, "audio");
const frenchEaseStimulusImageRoot = path.join(frenchEaseOutput, "stimuli", "images");
const frenchEaseStudentAudioRoot = path.join(frenchEaseOutput, "stimuli", "student-audio");
const paper2ListeningOutputRoot = path.join(frenchEaseRoot, "Paper_2_Listening", "03_audio_outputs");
const qwenPython = path.join(frenchEaseRoot, "Paper_2_Listening", "02_audio_pipeline", "python312-portable", "python", "bin", "python3.12");
const qwenStudentRenderer = path.resolve("scripts/render-qwen-student-audio.py");
const shouldRenderAudio = !process.argv.includes("--skip-audio") && !process.argv.includes("--skip-listening-audio");
const shouldRenderStudentAudio = !process.argv.includes("--skip-student-audio");
const shouldForceStudentAudio = process.argv.includes("--force-student-audio");
const voice = process.env.FRENCHEASE_VOICE || "Thomas";
const studentVoices = ["Adil", "Francois", "Olga"];

const themes = [
  {
    id: "identites",
    theme: "Identités",
    topics: [
      {
        id: "styles-de-vie",
        topic: "styles de vie",
        anchor: "Montréal",
        place: "la Maison des jeunes du Plateau",
        issue: "les routines trop remplies, les écrans tard le soir et les trajets qui fatiguent les élèves",
        initiative: "un défi de sept jours pour réorganiser les routines",
        action: "noter le sommeil, le transport, les repas et le temps d'écran dans un carnet commun",
        result: "moins de retards le matin et des discussions plus honnêtes sur l'équilibre personnel",
        tension: "la liberté individuelle et la pression du groupe",
        nextStep: "créer une charte de classe sur les habitudes numériques",
      },
      {
        id: "sante-et-bien-etre",
        topic: "santé et bien-être",
        anchor: "Bruxelles",
        place: "un lycée près de la gare du Midi",
        issue: "le stress avant les évaluations, le manque de sommeil et la difficulté à demander de l'aide",
        initiative: "des pauses actives et une salle calme pendant la semaine d'examens",
        action: "former des élèves volontaires à orienter leurs camarades vers les adultes référents",
        result: "les élèves parlent plus tôt de leur fatigue au lieu d'attendre une crise",
        tension: "la performance scolaire et la santé mentale",
        nextStep: "ajouter un questionnaire anonyme mensuel",
      },
      {
        id: "convictions-et-valeurs",
        topic: "convictions et valeurs",
        anchor: "Genève",
        place: "le conseil des jeunes de la ville",
        issue: "le décalage entre les valeurs affichées par les élèves et leurs choix quotidiens",
        initiative: "un marché solidaire organisé avec trois associations locales",
        action: "relier chaque stand à une valeur comme la justice, la loyauté ou la responsabilité",
        result: "les participants comprennent qu'une conviction devient plus forte quand elle produit une action concrète",
        tension: "les principes personnels et les contraintes pratiques",
        nextStep: "publier un manifeste court rédigé par les élèves",
      },
      {
        id: "sous-cultures",
        topic: "sous-cultures",
        anchor: "Dakar",
        place: "la médiathèque de Ouakam",
        issue: "les stéréotypes sur les groupes de jeunes, notamment autour de la musique, du sport et des vêtements",
        initiative: "une exposition de portraits audio réalisée par des élèves",
        action: "interviewer des danseurs, des joueurs de basket et des créateurs de mode locale",
        result: "le public découvre des sous-cultures comme des espaces de créativité plutôt que comme des menaces",
        tension: "l'appartenance au groupe et le regard des adultes",
        nextStep: "ouvrir une scène mensuelle pour présenter les projets",
      },
      {
        id: "langue-et-identite",
        topic: "langue et identité",
        anchor: "Rabat",
        place: "un club plurilingue dans un centre culturel",
        issue: "la gêne ressentie par certains jeunes quand ils changent de langue selon le contexte",
        initiative: "un atelier intitulé « ma phrase préférée dans trois langues »",
        action: "raconter l'histoire d'un mot de famille, d'école ou de quartier",
        result: "les élèves voient le plurilinguisme comme une richesse identitaire et non comme une hésitation",
        tension: "la langue familiale, la langue scolaire et la langue des réseaux",
        nextStep: "créer une carte sonore des langues du groupe",
      },
    ],
  },
  {
    id: "experiences",
    theme: "Expériences",
    topics: [
      {
        id: "activites-de-loisirs",
        topic: "activités de loisirs",
        anchor: "Lyon",
        place: "une maison de quartier à la Croix-Rousse",
        issue: "le coût des loisirs et le manque de temps libre non compétitif",
        initiative: "un passeport loisirs qui mélange sport, dessin, cuisine et théâtre",
        action: "essayer trois activités inconnues avant de choisir un club pour le trimestre",
        result: "des élèves timides rencontrent des camarades en dehors de leur groupe habituel",
        tension: "le loisir comme détente et le loisir comme performance",
        nextStep: "réserver des créneaux gratuits après les cours",
      },
      {
        id: "vacances-et-voyages",
        topic: "vacances et voyages",
        anchor: "Québec",
        place: "l'office jeunesse du Vieux-Québec",
        issue: "le tourisme rapide qui laisse peu d'argent aux habitants et beaucoup de déchets",
        initiative: "un itinéraire de voyage responsable préparé par des lycéens",
        action: "choisir des transports doux, des hébergements locaux et une activité de rencontre",
        result: "les élèves comprennent qu'un voyage peut être utile sans devenir une leçon de morale",
        tension: "la découverte personnelle et la responsabilité envers le lieu visité",
        nextStep: "ajouter une grille pour évaluer l'impact d'un séjour",
      },
      {
        id: "recits-de-vie",
        topic: "récits de vie",
        anchor: "Fort-de-France",
        place: "une bibliothèque municipale",
        issue: "la disparition de souvenirs familiaux que personne ne prend le temps d'enregistrer",
        initiative: "un studio mobile pour recueillir des récits de vie",
        action: "préparer cinq questions et enregistrer un proche pendant dix minutes",
        result: "des histoires ordinaires deviennent des ressources pour comprendre l'histoire locale",
        tension: "la mémoire personnelle et la mémoire collective",
        nextStep: "monter une archive sonore consultable par les classes",
      },
      {
        id: "rites-de-passage",
        topic: "rites de passage",
        anchor: "Lausanne",
        place: "un centre de formation pour apprentis",
        issue: "l'anxiété liée aux premières responsabilités: stage, emploi d'été, permis ou examen",
        initiative: "un programme de mentorat entre anciens et nouveaux élèves",
        action: "raconter une première expérience difficile et la stratégie utilisée pour avancer",
        result: "les rites de passage paraissent moins isolants quand ils sont partagés",
        tension: "l'indépendance attendue et le besoin d'accompagnement",
        nextStep: "organiser une soirée de témoignages avant les stages",
      },
      {
        id: "coutumes-et-traditions",
        topic: "coutumes et traditions",
        anchor: "Montréal",
        place: "un festival de quartier à Rosemont",
        issue: "la peur que les traditions deviennent des spectacles figés pour touristes",
        initiative: "un atelier où chaque famille présente un geste, une chanson ou une recette",
        action: "expliquer l'origine d'une coutume puis la faire adapter par des jeunes",
        result: "la tradition reste vivante parce qu'elle accepte de changer légèrement",
        tension: "préserver un héritage et laisser les jeunes l'interpréter",
        nextStep: "publier un carnet bilingue de coutumes familiales",
      },
      {
        id: "migration",
        topic: "migration",
        anchor: "Bruxelles",
        place: "une association d'accueil à Schaerbeek",
        issue: "l'isolement des nouveaux arrivants et la difficulté à comprendre les codes scolaires",
        initiative: "un système de binômes entre élèves installés et élèves récemment arrivés",
        action: "accompagner un camarade pendant deux semaines dans les démarches simples du lycée",
        result: "la migration est abordée à travers l'entraide concrète plutôt que les chiffres abstraits",
        tension: "l'envie de s'intégrer et la peur de perdre ses repères",
        nextStep: "préparer un guide audio en français facile",
      },
    ],
  },
  {
    id: "ingeniosite-humaine",
    theme: "Ingéniosité humaine",
    topics: [
      {
        id: "divertissements",
        topic: "divertissements",
        anchor: "Genève",
        place: "un cinéma associatif",
        issue: "la consommation passive de séries, de jeux et de vidéos courtes",
        initiative: "un club qui transforme les divertissements en débats créatifs",
        action: "analyser une scène, puis proposer une version plus responsable ou plus inclusive",
        result: "les élèves apprennent à se divertir tout en gardant un regard critique",
        tension: "le plaisir immédiat et l'esprit critique",
        nextStep: "lancer une soirée de courts métrages réalisés par les élèves",
      },
      {
        id: "expressions-artistiques",
        topic: "expressions artistiques",
        anchor: "Dakar",
        place: "un mur autorisé près d'un centre culturel",
        issue: "le manque d'espaces où les jeunes peuvent relier art et questions sociales",
        initiative: "une fresque collective sur les rêves de la ville",
        action: "associer chaque couleur à un problème ou à un espoir formulé par les habitants",
        result: "l'art devient une conversation publique plutôt qu'une simple décoration",
        tension: "l'expression personnelle et la responsabilité dans l'espace commun",
        nextStep: "ajouter des capsules audio à côté de la fresque",
      },
      {
        id: "communications-et-medias",
        topic: "communications et médias",
        anchor: "Rabat",
        place: "un laboratoire média dans un lycée",
        issue: "la circulation rapide de rumeurs sur les réseaux sociaux",
        initiative: "une cellule de vérification menée par des élèves",
        action: "remonter à la source d'une information avant de la partager",
        result: "les élèves prennent conscience que ralentir peut être un acte citoyen",
        tension: "la vitesse de publication et la fiabilité",
        nextStep: "créer une affiche avec cinq questions à se poser avant de publier",
      },
      {
        id: "technologie",
        topic: "technologie",
        anchor: "Lyon",
        place: "un fablab municipal",
        issue: "l'inégalité d'accès aux outils numériques pour faire les devoirs",
        initiative: "une application légère qui fonctionne avec peu de données",
        action: "partager des fiches audio et des exercices courts téléchargeables au lycée",
        result: "la technologie est évaluée selon son utilité réelle, pas selon sa nouveauté",
        tension: "l'innovation séduisante et l'accessibilité",
        nextStep: "tester l'application avec des familles sans ordinateur",
      },
      {
        id: "innovation-scientifique",
        topic: "innovation scientifique",
        anchor: "Québec",
        place: "un club scientifique scolaire",
        issue: "la difficulté à relier les sciences aux décisions quotidiennes",
        initiative: "des capteurs de température installés autour de l'école",
        action: "comparer les zones ombragées, asphaltées et végétalisées",
        result: "les élèves voient que des données simples peuvent soutenir une décision collective",
        tension: "l'enthousiasme scientifique et les questions éthiques",
        nextStep: "présenter les résultats au conseil d'établissement",
      },
    ],
  },
  {
    id: "organisation-sociale",
    theme: "Organisation sociale",
    topics: [
      {
        id: "relations-sociales",
        topic: "relations sociales",
        anchor: "Fort-de-France",
        place: "un service de médiation scolaire",
        issue: "les malentendus entre amis amplifiés par les messages courts",
        initiative: "des ateliers de conversation sans téléphone",
        action: "rejouer une dispute et chercher une phrase qui répare sans humilier",
        result: "les élèves distinguent mieux conflit, désaccord et harcèlement",
        tension: "la sincérité personnelle et le respect de l'autre",
        nextStep: "former des médiateurs élèves pour les pauses",
      },
      {
        id: "communaute",
        topic: "communauté",
        anchor: "Lausanne",
        place: "un jardin partagé près d'un immeuble",
        issue: "le manque de liens entre générations dans le quartier",
        initiative: "des matinées de jardinage et de cuisine locale",
        action: "associer un élève et une personne âgée autour d'une tâche précise",
        result: "la communauté devient visible grâce à des gestes simples et réguliers",
        tension: "l'autonomie individuelle et la solidarité locale",
        nextStep: "installer un tableau d'entraide à l'entrée du jardin",
      },
      {
        id: "engagement-social",
        topic: "engagement social",
        anchor: "Montréal",
        place: "une assemblée de jeunes",
        issue: "le sentiment que les décisions municipales ne tiennent pas compte des élèves",
        initiative: "une pétition argumentée sur les espaces publics près des écoles",
        action: "collecter des témoignages, vérifier les besoins et rencontrer un élu",
        result: "l'engagement paraît plus sérieux quand il combine émotion et preuve",
        tension: "la colère légitime et la stratégie efficace",
        nextStep: "suivre publiquement les réponses obtenues",
      },
      {
        id: "education",
        topic: "éducation",
        anchor: "Bruxelles",
        place: "une coopérative de devoirs",
        issue: "les écarts entre élèves selon l'aide disponible à la maison",
        initiative: "des séances d'entraide après les cours avec rotation des rôles",
        action: "chaque élève doit expliquer une notion qu'il maîtrise",
        result: "l'éducation devient moins verticale et plus collaborative",
        tension: "l'exigence académique et l'égalité des chances",
        nextStep: "ouvrir une session en ligne pour les absents",
      },
      {
        id: "monde-du-travail",
        topic: "monde du travail",
        anchor: "Genève",
        place: "un forum des stages",
        issue: "la difficulté à imaginer les métiers qui n'existent pas dans l'entourage familial",
        initiative: "des entretiens courts avec des professionnels de secteurs variés",
        action: "préparer deux questions sur les compétences et une sur les obstacles",
        result: "les élèves découvrent que le parcours professionnel peut être non linéaire",
        tension: "la sécurité d'un choix stable et la curiosité professionnelle",
        nextStep: "constituer un carnet de compétences transférables",
      },
      {
        id: "ordre-public",
        topic: "ordre public",
        anchor: "Dakar",
        place: "une réunion entre élèves, commerçants et agents municipaux",
        issue: "le partage difficile de l'espace public autour du lycée",
        initiative: "un parcours sécurisé pour les sorties tardives",
        action: "identifier les zones mal éclairées et proposer des règles de circulation",
        result: "l'ordre public est présenté comme une négociation entre sécurité et liberté",
        tension: "les règles communes et le sentiment de contrôle excessif",
        nextStep: "tester le parcours pendant un mois avec un carnet d'observations",
      },
    ],
  },
  {
    id: "partage-de-la-planete",
    theme: "Partage de la planète",
    topics: [
      {
        id: "environnement",
        topic: "environnement",
        anchor: "Rabat",
        place: "un lycée près d'un oued",
        issue: "les déchets plastiques visibles après les pluies",
        initiative: "des stations de remplissage et une collecte cartographiée",
        action: "noter les zones les plus touchées avant de proposer une solution",
        result: "les élèves passent d'une plainte générale à une action mesurable",
        tension: "les gestes individuels et les responsabilités collectives",
        nextStep: "présenter une carte des déchets à la commune",
      },
      {
        id: "droits-de-l-homme",
        topic: "droits de l’homme",
        anchor: "Lyon",
        place: "une maison des associations",
        issue: "la méconnaissance des droits concrets dans la vie quotidienne",
        initiative: "un atelier d'information juridique en langage simple",
        action: "transformer des situations ordinaires en questions de droits",
        result: "les élèves comprennent que les droits humains concernent aussi l'école, le logement et la santé",
        tension: "les grands principes et leur application locale",
        nextStep: "créer une foire aux questions pour les jeunes",
      },
      {
        id: "paix-et-conflits",
        topic: "paix et conflits",
        anchor: "Québec",
        place: "une radio communautaire",
        issue: "les débats qui se transforment rapidement en insultes en ligne",
        initiative: "une émission où deux groupes défendent des points de vue opposés avec des règles strictes",
        action: "reformuler l'argument de l'autre avant de répondre",
        result: "les auditeurs entendent que la paix commence parfois par une méthode de discussion",
        tension: "la conviction forte et l'écoute active",
        nextStep: "former des animateurs élèves aux débats sensibles",
      },
      {
        id: "egalite",
        topic: "égalité",
        anchor: "Fort-de-France",
        place: "un club sportif scolaire",
        issue: "la participation inégale des filles, des garçons et des élèves en situation de handicap",
        initiative: "des équipes mixtes avec rôles tournants",
        action: "changer les règles du tournoi pour valoriser l'entraide autant que le score",
        result: "l'égalité devient une organisation concrète, pas seulement un slogan",
        tension: "la compétition et l'inclusion",
        nextStep: "demander aux élèves exclus de redessiner les règles",
      },
      {
        id: "mondialisation",
        topic: "mondialisation",
        anchor: "Lausanne",
        place: "une coopérative alimentaire",
        issue: "la difficulté à connaître l'origine réelle des produits consommés",
        initiative: "un atelier de traçabilité des goûters préférés des élèves",
        action: "relier un produit à son trajet, à son prix et à son impact social",
        result: "la mondialisation devient visible dans un objet quotidien",
        tension: "le confort du consommateur et la responsabilité globale",
        nextStep: "comparer une option importée et une option locale",
      },
      {
        id: "ethique",
        topic: "éthique",
        anchor: "Montréal",
        place: "un café-débat étudiant",
        issue: "les choix difficiles liés à l'intelligence artificielle, à la science et aux données personnelles",
        initiative: "un tribunal fictif où les élèves défendent plusieurs décisions possibles",
        action: "identifier qui gagne, qui risque de perdre et quelles limites poser",
        result: "les élèves apprennent que l'éthique commence quand une bonne intention peut avoir un effet injuste",
        tension: "l'efficacité technique et la justice",
        nextStep: "rédiger une charte d'usage responsable",
      },
      {
        id: "environnements-urbains-et-ruraux",
        topic: "environnements urbains et ruraux",
        anchor: "Port-au-Prince",
        place: "une école partenaire entre ville et campagne",
        issue: "les différences d'accès au transport, à l'eau et aux espaces verts",
        initiative: "un échange entre élèves urbains et ruraux autour d'un jardin scolaire",
        action: "comparer les trajets quotidiens et les solutions locales déjà existantes",
        result: "les élèves évitent de présenter la ville ou la campagne comme un problème unique",
        tension: "les besoins locaux et les décisions prises à distance",
        nextStep: "préparer une carte commune des ressources utiles",
      },
    ],
  },
];

const paper1TypeSets = [
  ["Article", "Blog", "Chronique d'opinion / courrier des lecteurs"],
  ["Courriel formel", "Lettre officielle", "Proposition"],
  ["Discours / exposé / débat", "Brochure / tract / dépliant / prospectus", "Message dans les médias sociaux / forum"],
  ["Lettre de motivation", "Entretien / interview", "Rapport officiel"],
  ["Courriel informel", "Lettre personnelle", "Journal intime"],
];

const normalizeAscii = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const escapeForTs = (value) => JSON.stringify(value, null, 2);
const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const wordCount = (value) => value.split(/\s+/).filter(Boolean).length;

const rotate = (items, seed) => {
  const offset = seed % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
};

const themePptxSlugs = {
  identites: "identites",
  experiences: "experiences",
  "ingeniosite-humaine": "ingeniosite_humaine",
  "organisation-sociale": "organisation_sociale",
  "partage-de-la-planete": "partage_de_la_planete",
};

const topicPptxSlugOverrides = {
  "droits-de-l-homme": "droits_de_lhomme_egalite",
  egalite: "droits_de_lhomme_egalite",
  "recits-de-vie": "coutumes_et_traditions",
};

const topicPptxSlug = (topic) => topicPptxSlugOverrides[topic.id] ?? topic.id.replace(/-/g, "_");

const findTopicPptx = (theme, topic) => {
  const themeSlug = themePptxSlugs[theme.id];
  const topicSlug = topicPptxSlug(topic);
  const topicDir = path.join(paper2ListeningOutputRoot, themeSlug, topicSlug);
  if (!fs.existsSync(topicDir)) {
    throw new Error(`Missing PPTX topic directory for ${theme.id}/${topic.id}: ${topicDir}`);
  }

  const pptxFiles = fs
    .readdirSync(topicDir)
    .filter((file) => file.toLowerCase().endsWith(".pptx"))
    .sort();
  const preferred =
    pptxFiles.find((file) => normalizeAscii(file).includes("expression-orale")) ??
    pptxFiles.find((file) => normalizeAscii(file).includes("comprehension-orale")) ??
    pptxFiles.find((file) => normalizeAscii(file).includes("comprehension-ecrite")) ??
    pptxFiles[0];

  if (!preferred) {
    throw new Error(`No PPTX files found in ${topicDir}`);
  }

  return {
    pptxPath: path.join(topicDir, preferred),
    topicSlug,
  };
};

const extractLargestPptxImage = ({ theme, topic, pptxPath }) => {
  const listing = spawnSync("unzip", ["-l", pptxPath], {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (listing.status !== 0) {
    throw new Error(`Could not inspect PPTX media for ${pptxPath}: ${listing.stderr.toString()}`);
  }

  const mediaItems = listing.stdout
    .split("\n")
    .map((line) => line.match(/^\s*(\d+)\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(ppt\/media\/.+\.(?:png|jpe?g|webp))\s*$/i))
    .filter(Boolean)
    .map((match) => ({ size: Number(match[1]), name: match[2] }))
    .filter((item) => item.size > 20_000)
    .sort((a, b) => b.size - a.size);

  if (!mediaItems.length) {
    throw new Error(`No usable images found in ${pptxPath}`);
  }

  const selected = mediaItems[0];
  const extension = path.extname(selected.name).toLowerCase() || ".png";
  const filename = `${theme.id}-${topic.id}${extension === ".jpeg" ? ".jpg" : extension}`;
  const relPath = path.join(theme.id, topic.id, filename);
  const frenchEasePath = path.join(frenchEaseStimulusImageRoot, relPath);
  const publicPath = path.join(publicStimulusImageRoot, relPath);

  const extracted = spawnSync("unzip", ["-p", pptxPath, selected.name], {
    encoding: "buffer",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (extracted.status !== 0) {
    throw new Error(`Could not extract ${selected.name} from ${pptxPath}: ${extracted.stderr.toString()}`);
  }

  fs.mkdirSync(path.dirname(frenchEasePath), { recursive: true });
  fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  fs.writeFileSync(frenchEasePath, extracted.stdout);
  fs.copyFileSync(frenchEasePath, publicPath);

  return {
    relPath,
    mediaName: selected.name,
  };
};

const makeStudentText = (theme, topic) =>
  `Sur cette image, je relie le thème « ${topic.topic} » à la vie des jeunes. L'exemple de ${topic.anchor} me montre qu'une action locale peut être utile. Je pense que ${topic.initiative} est intéressante, mais il faut aussi réfléchir à ${topic.tension}.`;

const makeTopicStimulus = (theme, topic, globalIndex) => {
  const source = findTopicPptx(theme, topic);
  const image = extractLargestPptxImage({ theme, topic, pptxPath: source.pptxPath });
  const audioRelPath = path.join(theme.id, topic.id, `sl-student-${theme.id}-${topic.id}.mp3`);

  return {
    imageUrl: `/frenchease/mock-exams/stimuli/images/${image.relPath.split(path.sep).join("/")}`,
    imageFile: `stimuli/images/${image.relPath.split(path.sep).join("/")}`,
    imageSourcePptx: path.basename(source.pptxPath),
    imageSourceMedia: image.mediaName,
    studentText: makeStudentText(theme, topic),
    studentAudioUrl: `/frenchease/mock-exams/stimuli/student-audio/${audioRelPath.split(path.sep).join("/")}`,
    studentAudioFile: `stimuli/student-audio/${audioRelPath.split(path.sep).join("/")}`,
    studentVoice: studentVoices[globalIndex % studentVoices.length],
  };
};

const paper1MarkScheme = [
  {
    criterion: "Critère A: langue",
    marks: 12,
    topBand: "Vocabulaire varié, structures simples et complexes contrôlées, erreurs rares qui ne gênent pas la communication.",
    teacherFocus: "Vérifier les accords, les temps du passé/futur et la précision des connecteurs.",
  },
  {
    criterion: "Critère B: message",
    marks: 12,
    topBand: "La réponse traite clairement tous les aspects de la tâche, développe les idées et utilise des exemples pertinents.",
    teacherFocus: "Repérer si l'élève explique, justifie et illustre au lieu de lister.",
  },
  {
    criterion: "Critère C: compréhension conceptuelle",
    marks: 6,
    topBand: "Le type de texte, le public, le registre et les conventions sont adaptés et cohérents.",
    teacherFocus: "Contrôler l'adresse au lecteur, l'organisation et les conventions visibles du format choisi.",
  },
];

const makeQuestion = ({ id, skillId, prompt, correct, distractors, explanation, examComponent, seed }) => {
  const options = rotate([correct, ...distractors], seed);
  return {
    id,
    skillId,
    type: "multiple-choice",
    level: 5,
    prompt,
    options,
    correctAnswer: correct,
    acceptableAnswers: [correct],
    explanation,
    tags: ["mock", skillId],
    examComponent,
    marks: 1,
    markScheme: {
      questionId: id,
      expected: correct,
      accept: [correct],
      reject: distractors,
      marks: 1,
      guidance: "Attribuer 1 point pour la réponse correcte. Ne pas accepter un distracteur, même s'il reprend un mot du texte.",
    },
  };
};

const makePaper1 = (theme, topic, index) => {
  const id = `paper1-${theme.id}-${topic.id}`;
  return {
    id,
    title: `Paper 1: ${theme.theme} — ${topic.topic}`,
    durationMinutes: 75,
    tasks: [
      {
        id: `${id}-task-1`,
        theme: theme.theme,
        prompt: `Le magazine de votre établissement prépare un numéro spécial sur le thème « ${topic.topic} ». Rédigez un texte qui explique pourquoi ce sujet est important pour les jeunes, en vous appuyant sur l'exemple de ${topic.anchor}.`,
        textTypeChoices: paper1TypeSets[index % paper1TypeSets.length],
        planningHints: ["Public: communauté scolaire", `Exemple à exploiter: ${topic.initiative}`, "Objectif: expliquer, illustrer et conclure clairement"],
        markScheme: paper1MarkScheme,
      },
      {
        id: `${id}-task-2`,
        theme: theme.theme,
        prompt: `Une association à ${topic.anchor} veut agir sur le problème suivant: ${topic.issue}. Rédigez un texte qui propose une activité réaliste et qui explique comment elle pourrait aider les élèves.`,
        textTypeChoices: paper1TypeSets[(index + 1) % paper1TypeSets.length],
        planningHints: ["Définir le problème", `Proposition possible: ${topic.action}`, "Utiliser le conditionnel et des connecteurs de cause/conséquence"],
        markScheme: paper1MarkScheme,
      },
      {
        id: `${id}-task-3`,
        theme: theme.theme,
        prompt: `Après une discussion en classe sur « ${topic.topic} », vous réfléchissez à la tension suivante: ${topic.tension}. Rédigez un texte personnel qui présente votre opinion et une question qui vous reste.`,
        textTypeChoices: paper1TypeSets[(index + 4) % paper1TypeSets.length],
        planningHints: ["Utiliser le passé pour présenter la discussion", "Exprimer une évolution personnelle", "Terminer par une question ouverte"],
        markScheme: paper1MarkScheme,
      },
    ],
  };
};

const readingQuestionsFor = (theme, topic, textKey, textId, seed) => {
  const titleOption = `${capitalize(topic.topic)}: une réponse locale`;
  const base = [
    {
      prompt: textKey === "A" ? "Quel problème est au centre du texte ?" : textKey === "B" ? "Quelle tension le texte met-il en avant ?" : "Quelle évolution est décrite dans le texte ?",
      correct: textKey === "A" ? topic.issue : textKey === "B" ? topic.tension : topic.result,
      distractors: [
        "un concours sportif international sans lien avec les élèves",
        "une campagne commerciale imposée par une entreprise",
        "un voyage touristique sans objectif pédagogique",
      ],
      explanation: `La réponse se trouve dans le passage consacré à ${topic.topic}; le texte relie le sujet à une situation concrète à ${topic.anchor}.`,
    },
    {
      prompt: "Quelle initiative est mentionnée ?",
      correct: topic.initiative,
      distractors: [
        "une interdiction générale sans consultation",
        "une application payante réservée aux adultes",
        "un examen officiel organisé par la mairie",
      ],
      explanation: "Le texte présente l'initiative comme la réponse locale au problème.",
    },
    {
      prompt: "Que doivent faire les élèves ou participants ?",
      correct: topic.action,
      distractors: [
        "mémoriser un règlement sans le discuter",
        "éviter tout contact avec les autres groupes",
        "remplacer les adultes dans toutes les décisions",
      ],
      explanation: "L'action attendue est explicitement liée à la participation des élèves.",
    },
    {
      prompt: "Quelle idée résume le mieux le message du texte ?",
      correct: "un exemple local peut rendre un thème abstrait plus compréhensible",
      distractors: [
        "les jeunes ne peuvent jamais agir sur ce thème",
        "les solutions locales sont inutiles si elles sont modestes",
        "le texte refuse toute nuance ou tout débat",
      ],
      explanation: "Les trois textes du dossier transforment un thème IB en situation locale analysable.",
    },
    {
      prompt: "Quel titre conviendrait le mieux ?",
      correct: titleOption,
      distractors: [
        "Un programme sans élèves",
        "Une publicité pour touristes",
        "Une règle sans explication",
      ],
      explanation: "Le titre correct associe le thème et la réponse locale présentée dans le texte.",
    },
  ];

  return base.map((item, index) =>
    makeQuestion({
      id: `${textId}-q${index + 1}`,
      skillId: "reading-question-types",
      prompt: item.prompt,
      correct: item.correct,
      distractors: item.distractors,
      explanation: item.explanation,
      examComponent: "Paper 2 reading",
      seed: seed + index,
    }),
  );
};

const makeReading = (theme, topic, index) => {
  const id = `reading-${theme.id}-${topic.id}`;
  const textA = `À ${topic.anchor}, ${topic.place} a lancé ${topic.initiative}. Le projet répond à un constat précis: ${topic.issue}. Les organisateurs ne veulent pas faire une grande campagne abstraite. Ils demandent plutôt aux élèves de ${topic.action}. Cette méthode oblige chacun à observer la réalité avant de proposer une solution. Pour les professeurs, l'intérêt est double: le thème « ${topic.topic} » devient plus concret, et les élèves apprennent à justifier leurs choix avec des exemples proches de leur vie.`;
  const textB = `Pendant une réunion publique, deux opinions se sont opposées. Certains participants pensent que le thème « ${topic.topic} » doit rester une affaire personnelle, car il met en jeu ${topic.tension}. D'autres répondent que l'école a aussi un rôle à jouer quand un problème devient visible dans la vie quotidienne. Une élève propose alors un compromis: partir de l'initiative locale, « ${topic.initiative} », mais laisser chaque groupe adapter l'action proposée à son contexte. Cette proposition ne supprime pas le débat, mais elle empêche les slogans faciles.`;
  const textC = `Trois mois après le lancement, ${topic.place} a publié un premier bilan. Les résultats ne sont pas spectaculaires, mais ils sont utiles: ${topic.result}. Les élèves interrogés disent que l'activité a surtout changé leur manière de poser les questions. Au lieu de demander qui a raison, ils cherchent maintenant quelles preuves existent et qui est concerné. La prochaine étape sera de ${topic.nextStep}. Les responsables rappellent cependant qu'un projet scolaire ne remplace pas une politique publique; il peut seulement montrer une direction crédible.`;

  const texts = [
    ["A", "Une initiative locale", textA],
    ["B", "Deux points de vue", textB],
    ["C", "Un bilan nuancé", textC],
  ].map(([label, subtitle, text], textIndex) => {
    const baseId = `${id}-${label.toLowerCase()}`;
    return {
      id: baseId,
      title: `Texte ${label}: ${subtitle} — ${topic.topic}`,
      theme: theme.theme,
      difficulty: label,
      sourceType: textIndex === 0 ? "article d'information" : textIndex === 1 ? "compte rendu de réunion" : "bilan de projet",
      wordCount: wordCount(text),
      text,
      questions: readingQuestionsFor(theme, topic, label, baseId, index + textIndex),
    };
  });

  return {
    id,
    title: `Paper 2 Reading: ${theme.theme} — ${topic.topic}`,
    totalMarks: texts.reduce((sum, text) => sum + text.questions.reduce((inner, question) => inner + question.marks, 0), 0),
    texts,
  };
};

const listeningQuestionsFor = (theme, topic, textKey, textId, seed) => {
  const common = [
    {
      prompt: "Quel est le thème principal du document ?",
      correct: topic.topic,
      distractors: ["la publicité commerciale", "la météo du week-end", "un examen de mathématiques"],
      explanation: `Le document annonce clairement le thème « ${topic.topic} ».`,
    },
    {
      prompt: "Quel lieu francophone est lié au document ?",
      correct: topic.anchor,
      distractors: ["Paris uniquement", "un pays anglophone", "une ville imaginaire"],
      explanation: `Le document situe l'exemple à ${topic.anchor}.`,
    },
  ];

  const specific =
    textKey === "A"
      ? [
          {
            prompt: "Que faut-il préparer avant l'activité ?",
            correct: "une question courte",
            distractors: ["un exposé de vingt minutes", "un billet d'avion", "un uniforme spécial"],
            explanation: "L'annonce demande aux participants d'arriver avec une question courte.",
          },
          {
            prompt: "Quel est l'objectif de la rencontre ?",
            correct: "relier un thème à une action concrète",
            distractors: ["vendre un produit", "annuler les cours", "remplacer le conseil municipal"],
            explanation: "L'objectif annoncé est de relier le thème à une action concrète.",
          },
          {
            prompt: "À qui s'adresse surtout le message ?",
            correct: "aux élèves intéressés",
            distractors: ["aux touristes étrangers", "aux professeurs retraités", "aux conducteurs de bus"],
            explanation: "Le message vise les élèves qui peuvent participer à l'activité.",
          },
        ]
      : textKey === "B"
        ? [
            {
              prompt: "Pourquoi Malik hésite-t-il ?",
              correct: "il craint que l'activité soit trop théorique",
              distractors: ["il refuse de parler français", "il a oublié son ordinateur", "il ne connaît pas le lieu"],
              explanation: "Malik hésite parce qu'il a peur d'une activité trop théorique.",
            },
            {
              prompt: "Quel exemple Nora propose-t-elle d'utiliser ?",
              correct: topic.initiative,
              distractors: ["un devoir de grammaire", "une publicité de magasin", "une recette sans rapport"],
              explanation: "Nora veut s'appuyer sur l'initiative locale pour rendre le sujet concret.",
            },
            {
              prompt: "Quelle décision les deux élèves prennent-ils ?",
              correct: "préparer deux exemples personnels",
              distractors: ["quitter le club", "supprimer le débat", "demander une note supplémentaire"],
              explanation: "Ils décident de préparer chacun des exemples personnels.",
            },
          ]
        : [
            {
              prompt: "Quel format le reportage décrit-il ?",
              correct: "un mini-reportage audio",
              distractors: ["un manuel officiel", "un match sportif", "un formulaire administratif"],
              explanation: "Le document parle d'un mini-reportage audio.",
            },
            {
              prompt: "Quel résultat est mentionné ?",
              correct: topic.result,
              distractors: ["une interdiction totale", "une absence complète de participants", "un prix de voyage"],
              explanation: "Le résultat mentionné reprend le bilan local du projet.",
            },
            {
              prompt: "Quelle prochaine étape est annoncée ?",
              correct: topic.nextStep,
              distractors: ["fermer le projet immédiatement", "changer de langue officielle", "vendre les enregistrements"],
              explanation: "La fin du reportage annonce l'étape suivante du projet.",
            },
          ];

  return [...common, ...specific].map((item, index) =>
    makeQuestion({
      id: `${textId}-q${index + 1}`,
      skillId: "listening-strategy",
      prompt: item.prompt,
      correct: item.correct,
      distractors: item.distractors,
      explanation: item.explanation,
      examComponent: "Paper 2 listening",
      seed: seed + index,
    }),
  );
};

const makeListening = (theme, topic, index) => {
  const id = `listening-${theme.id}-${topic.id}`;
  const scripts = [
    `Bonjour à toutes et à tous. Cette semaine, ${topic.place} organise une rencontre sur le thème « ${topic.topic} ». Le rendez-vous aura lieu jeudi à treize heures trente. L'objectif est de relier ce thème à une action concrète: ${topic.action}. Les élèves intéressés doivent préparer une question courte et écouter l'exemple de ${topic.anchor} avant la discussion.`,
    `Nora : Tu viens à l'atelier sur « ${topic.topic} » ? Malik : Je ne sais pas. J'ai peur que l'activité soit trop théorique. Nora : Justement, on va partir d'un exemple réel: ${topic.initiative}. Malik : Dans ce cas, je pourrais parler de ce que je vois dans mon quartier. Nora : Bonne idée. Moi, je vais préparer deux exemples personnels et les comparer avec le projet de ${topic.anchor}.`,
    `Dans ce mini-reportage audio, nous revenons sur un projet mené à ${topic.anchor}. Au départ, les organisateurs voulaient seulement sensibiliser les jeunes au thème « ${topic.topic} ». Peu à peu, ils ont compris qu'il fallait partir d'une expérience précise. Le bilan est encourageant: ${topic.result}. La prochaine étape sera de ${topic.nextStep}.`,
  ];

  const texts = scripts.map((script, scriptIndex) => {
    const label = ["A", "B", "C"][scriptIndex];
    const title = ["Annonce courte", "Dialogue entre deux élèves", "Mini-reportage"][scriptIndex];
    const baseId = `${id}-${label.toLowerCase()}`;
    const audioRelPath = `${theme.id}/${topic.id}/${baseId}.m4a`;
    return {
      id: baseId,
      title: `Texte ${label}: ${title} — ${topic.topic}`,
      theme: theme.theme,
      script,
      audioUrl: `/frenchease/mock-exams/audio/${audioRelPath}`,
      audioFile: `audio/${audioRelPath}`,
      voice,
      instructions:
        scriptIndex === 0
          ? "Écoutez deux fois. Repérez le thème, le lieu et l'objectif."
          : scriptIndex === 1
            ? "Écoutez deux fois. Identifiez le problème, l'exemple et la décision."
            : "Écoutez deux fois. Repérez le format, le bilan et la prochaine étape.",
      noteSpacePrompt:
        scriptIndex === 0
          ? "Thème / lieu / objectif"
          : scriptIndex === 1
            ? "Hésitation / exemple / décision"
            : "Format / résultat / prochaine étape",
      questions: listeningQuestionsFor(theme, topic, label, baseId, index + scriptIndex),
    };
  });

  return {
    id,
    title: `Paper 2 Listening: ${theme.theme} — ${topic.topic}`,
    totalMarks: texts.reduce((sum, text) => sum + text.questions.reduce((inner, question) => inner + question.marks, 0), 0),
    texts,
  };
};

let topicOrdinal = 0;

const catalog = {
  metadata: {
    title: "DP French B SL Mastery Full Mock Exam Bank",
    generatedAt: new Date().toISOString(),
    source: "Original mock content generated for the ILG DP French B SL Mastery app. No official IB papers, texts, audio or markschemes are copied.",
    topicCount: themes.reduce((sum, theme) => sum + theme.topics.length, 0),
    paperTypesPerTopic: ["Paper 1 Writing", "Paper 2 Reading", "Paper 2 Listening"],
    audioFormat: "AAC .m4a generated locally with macOS say and afconvert",
    topicStimulus: "PPTX images copied from the FrenchEase Paper_2_Listening decks, with SL student model texts rendered as MP3 using Qwen3 cloned French voices.",
  },
  themes: themes.map((theme) => ({
    id: theme.id,
    theme: theme.theme,
    topics: theme.topics.map((topic) => {
      const globalIndex = topicOrdinal++;
      return {
        id: `${theme.id}-${topic.id}`,
        theme: theme.theme,
        topic: topic.topic,
        francophoneAnchor: topic.anchor,
        productionNote: "Original DP French B SL-style mock content. Use as practice material, not as an official IB paper.",
        stimulus: makeTopicStimulus(theme, topic, globalIndex),
        paper1: makePaper1(theme, topic, globalIndex),
        reading: makeReading(theme, topic, globalIndex),
        listening: makeListening(theme, topic, globalIndex),
      };
    }),
  })),
};

const audioTexts = catalog.themes.flatMap((theme) =>
  theme.topics.flatMap((topic) =>
    topic.listening.texts.map((text) => ({
      relPath: text.audioFile.replace(/^audio\//, ""),
      script: text.script,
    })),
  ),
);

const studentAudioTexts = catalog.themes.flatMap((theme) =>
  theme.topics.map((topic) => ({
    id: topic.id,
    voice: topic.stimulus.studentVoice,
    text: topic.stimulus.studentText,
    outputPath: path.join(frenchEaseOutput, topic.stimulus.studentAudioFile),
    publicOutputPath: path.join(publicStudentAudioRoot, topic.stimulus.studentAudioFile.replace(/^stimuli\/student-audio\//, "")),
    relPath: topic.stimulus.studentAudioFile.replace(/^stimuli\/student-audio\//, ""),
  })),
);

const renderSpeechText = (script) =>
  script
    .replace(/Nora\s*:/g, "Nora.")
    .replace(/Malik\s*:/g, "Malik.")
    .replace(/\s+/g, " ")
    .trim();

const renderAudioFile = ({ relPath, script }) => {
  const frenchEasePath = path.join(frenchEaseAudioRoot, relPath);
  const publicPath = path.join(publicAudioRoot, relPath);
  fs.mkdirSync(path.dirname(frenchEasePath), { recursive: true });
  fs.mkdirSync(path.dirname(publicPath), { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "frenchease-audio-"));
  const tmpAiff = path.join(tmpDir, "speech.aiff");
  const speechText = renderSpeechText(script);
  const sayResult = spawnSync("say", ["-v", voice, "-r", "162", "-o", tmpAiff, speechText], { stdio: "pipe" });
  if (sayResult.status !== 0) {
    throw new Error(`say failed for ${relPath}: ${sayResult.stderr.toString()}`);
  }
  const convertResult = spawnSync("afconvert", ["-f", "m4af", "-d", "aac", "-b", "64000", tmpAiff, frenchEasePath], { stdio: "pipe" });
  if (convertResult.status !== 0) {
    throw new Error(`afconvert failed for ${relPath}: ${convertResult.stderr.toString()}`);
  }
  fs.copyFileSync(frenchEasePath, publicPath);
  fs.rmSync(tmpDir, { recursive: true, force: true });
};

const renderStudentAudioBatch = () => {
  fs.mkdirSync(frenchEaseOutput, { recursive: true });
  const manifestPath = path.join(frenchEaseOutput, "student_audio_render_queue.json");
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        engine: "qwen-tts",
        voices: studentVoices,
        items: studentAudioTexts,
      },
      null,
      2,
    )}\n`,
  );

  const args = [qwenStudentRenderer, manifestPath];
  if (shouldForceStudentAudio) args.push("--force");

  const renderResult = spawnSync(qwenPython, args, {
    stdio: "inherit",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (renderResult.status !== 0) {
    throw new Error(`Qwen student audio render failed with status ${renderResult.status}`);
  }
};

const renderMarkdown = (bundle) => {
  const lines = [
    `# ${bundle.theme} — ${bundle.topic}`,
    "",
    `Francophone anchor: ${bundle.francophoneAnchor}`,
    "",
    "Original DP French B SL-style mock content. No official IB papers, texts, audio or markschemes are copied.",
    "",
    "## Topic stimulus",
    "",
    `Image: ${bundle.stimulus.imageFile}`,
    `Image source PPTX: ${bundle.stimulus.imageSourcePptx}`,
    `Image source media: ${bundle.stimulus.imageSourceMedia}`,
    "",
    `SL student text (${bundle.stimulus.studentVoice}):`,
    "",
    bundle.stimulus.studentText,
    "",
    `Student audio: ${bundle.stimulus.studentAudioFile}`,
    "",
    "## Paper 1 Writing",
    "",
    `Duration: ${bundle.paper1.durationMinutes} minutes`,
    "",
  ];

  bundle.paper1.tasks.forEach((task, index) => {
    lines.push(`### Task ${index + 1}`, "", task.prompt, "", `Text-type choices: ${task.textTypeChoices.join(" | ")}`, "", `Planning hints: ${task.planningHints.join(" | ")}`, "", "Markscheme:", "");
    task.markScheme.forEach((criterion) => {
      lines.push(`- ${criterion.criterion} (${criterion.marks} marks): ${criterion.topBand} Teacher focus: ${criterion.teacherFocus}`);
    });
    lines.push("");
  });

  lines.push("## Paper 2 Reading", "", `Total marks: ${bundle.reading.totalMarks}`, "");
  bundle.reading.texts.forEach((text) => {
    lines.push(`### ${text.title}`, "", `Source type: ${text.sourceType}`, `Word count: ${text.wordCount}`, "", text.text, "", "Questions and markscheme:", "");
    text.questions.forEach((question, index) => {
      lines.push(
        `${index + 1}. ${question.prompt}`,
        `   - Options: ${question.options.join(" | ")}`,
        `   - Answer: ${question.correctAnswer}`,
        `   - Accept: ${question.markScheme.accept.join(" | ")}`,
        `   - Reject: ${question.markScheme.reject.join(" | ")}`,
        `   - Marks: ${question.marks}`,
        `   - Guidance: ${question.markScheme.guidance}`,
      );
    });
    lines.push("");
  });

  lines.push("## Paper 2 Listening", "", `Total marks: ${bundle.listening.totalMarks}`, "");
  bundle.listening.texts.forEach((text) => {
    lines.push(`### ${text.title}`, "", `Audio: ${text.audioFile}`, `Voice: ${text.voice}`, `Instructions: ${text.instructions}`, "", `Script: ${text.script}`, "", "Questions and markscheme:", "");
    text.questions.forEach((question, index) => {
      lines.push(
        `${index + 1}. ${question.prompt}`,
        `   - Options: ${question.options.join(" | ")}`,
        `   - Answer: ${question.correctAnswer}`,
        `   - Accept: ${question.markScheme.accept.join(" | ")}`,
        `   - Reject: ${question.markScheme.reject.join(" | ")}`,
        `   - Marks: ${question.marks}`,
        `   - Guidance: ${question.markScheme.guidance}`,
      );
    });
    lines.push("");
  });

  return `${lines.join("\n")}\n`;
};

const writeJsonAndDocs = () => {
  fs.mkdirSync(topicDocsOutput, { recursive: true });
  fs.writeFileSync(path.join(frenchEaseOutput, "mock_exam_catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
  fs.writeFileSync(path.join(frenchEaseOutput, "audio_manifest.json"), `${JSON.stringify({ voice, files: audioTexts.map((item) => item.relPath) }, null, 2)}\n`);
  fs.writeFileSync(
    path.join(frenchEaseOutput, "student_audio_manifest.json"),
    `${JSON.stringify({ engine: "qwen-tts", voices: studentVoices, files: studentAudioTexts.map((item) => item.relPath) }, null, 2)}\n`,
  );

  const indexLines = [
    "# DP French B SL Mastery Full Mock Exam Bank",
    "",
    "Original DP French B SL-style mock content generated for the app. No official IB papers, texts, audio or markschemes are copied.",
    "",
    `Generated: ${catalog.metadata.generatedAt}`,
    "",
    `Topics: ${catalog.metadata.topicCount}`,
    `Listening audio files: ${audioTexts.length}`,
    `Topic PPTX images: ${studentAudioTexts.length}`,
    `SL student Qwen audio files: ${studentAudioTexts.length}`,
    "",
  ];

  catalog.themes.forEach((theme) => {
    indexLines.push(`## ${theme.theme}`, "");
    const themeDir = path.join(topicDocsOutput, normalizeAscii(theme.theme));
    fs.mkdirSync(themeDir, { recursive: true });
    theme.topics.forEach((bundle) => {
      const filename = `${normalizeAscii(bundle.topic)}.md`;
      fs.writeFileSync(path.join(themeDir, filename), renderMarkdown(bundle));
      indexLines.push(`- ${bundle.topic}: topics/${normalizeAscii(theme.theme)}/${filename}`);
    });
    indexLines.push("");
  });

  fs.writeFileSync(path.join(frenchEaseOutput, "README.md"), `${indexLines.join("\n")}\n`);
};

const writeTs = () => {
  const source = [
    "import type { ListeningMock, Paper1Mock, ReadingMock, TopicStimulus } from \"../types\";",
    "",
    "export interface MockExamTopicBundle {",
    "  id: string;",
    "  theme: string;",
    "  topic: string;",
    "  francophoneAnchor: string;",
    "  productionNote: string;",
    "  stimulus: TopicStimulus;",
    "  paper1: Paper1Mock;",
    "  reading: ReadingMock;",
    "  listening: ListeningMock;",
    "}",
    "",
    "export interface MockExamThemeCatalog {",
    "  id: string;",
    "  theme: string;",
    "  topics: MockExamTopicBundle[];",
    "}",
    "",
    `export const mockExamThemes = ${escapeForTs(catalog.themes)} as MockExamThemeCatalog[];`,
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(appOutput), { recursive: true });
  fs.writeFileSync(appOutput, source);
};

writeJsonAndDocs();

if (shouldRenderAudio) {
  audioTexts.forEach((item, index) => {
    renderAudioFile(item);
    if ((index + 1) % 10 === 0 || index === audioTexts.length - 1) {
      console.log(`Rendered audio ${index + 1}/${audioTexts.length}`);
    }
  });
}

if (shouldRenderStudentAudio) {
  renderStudentAudioBatch();
}

writeTs();

console.log(`Wrote ${catalog.metadata.topicCount} topic bundles`);
console.log(`FrenchEase catalog: ${path.join(frenchEaseOutput, "mock_exam_catalog.json")}`);
console.log(`FrenchEase audio: ${frenchEaseAudioRoot}`);
console.log(`FrenchEase student audio: ${frenchEaseStudentAudioRoot}`);
console.log(`FrenchEase stimulus images: ${frenchEaseStimulusImageRoot}`);
console.log(`Public audio: ${publicAudioRoot}`);
console.log(`Public student audio: ${publicStudentAudioRoot}`);
console.log(`Public stimulus images: ${publicStimulusImageRoot}`);
console.log(`App data: ${appOutput}`);
