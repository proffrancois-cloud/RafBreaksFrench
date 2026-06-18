import { skills } from "./skills";
import type { Lesson } from "../types";

interface LessonContent {
  explanation: string;
  rules: string[];
  examples: [string, string, string][];
  commonMistakes: string[];
  examUse: string;
}

const content: Record<string, LessonContent> = {
  elision: {
    explanation: "Elision makes French smoother before a vowel sound or silent h. The apostrophe replaces the final vowel of a short word.",
    rules: ["Use j', l', d', qu', c', s', m', t' and n' before a vowel sound.", "Do not use elision before an aspirated h.", "Keep the apostrophe attached to the shortened word."],
    examples: [["Correct", "J'aime l'idée d'habiter a Montreal.", "j' + aime, l' + idee, d' + habiter"], ["Correct", "Qu'est-ce qu'elle a vu ?", "que becomes qu' before est and elle"], ["Careful", "Le heros arrive.", "heros uses aspirated h, so no l'"]],
    commonMistakes: ["Writing je aime instead of j'aime.", "Forgetting l' before a vowel.", "Adding elision where French keeps the full article."],
    examUse: "Check elision during final editing; repeated apostrophe errors make otherwise good writing look unstable.",
  },
  "infinitive-after-verb": {
    explanation: "After many conjugated verbs, the next action remains in the infinitive.",
    rules: ["Conjugate the first verb for the subject.", "Keep the second verb as an infinitive.", "Common triggers include vouloir, pouvoir, devoir, savoir, aller, aimer and il faut."],
    examples: [["Correct", "Je veux partir plus tot.", "veux is conjugated; partir remains infinitive"], ["Correct", "Il faut proteger l'environnement.", "falloir is followed by an infinitive"], ["Correct", "Nous allons organiser une reunion.", "future proche uses aller + infinitive"]],
    commonMistakes: ["Writing je veux pars.", "Conjugating both verbs after il faut.", "Dropping the infinitive ending in long sentences."],
    examUse: "Use this pattern to build fluent recommendations: on devrait recycler, il faut reduire, nous pouvons agir.",
  },
  "basic-place-prepositions": {
    explanation: "Place prepositions depend on the type and gender of the place name.",
    rules: ["Use a with cities: a Paris, a Dakar.", "Use en with feminine countries and vowel-starting countries: en France, en Iran.", "Use au with masculine countries and aux with plural countries: au Canada, aux Etats-Unis."],
    examples: [["City", "Elle etudie a Bruxelles.", "a + city"], ["Country", "Ils habitent au Maroc.", "au + masculine country"], ["Origin", "Il vient des Pays-Bas.", "de + les becomes des"]],
    commonMistakes: ["Writing dans Paris for normal location.", "Using en with masculine countries such as le Canada.", "Forgetting contractions: de + le = du."],
    examUse: "Travel, migration and Francophone culture tasks often require precise place prepositions.",
  },
  "articles-core": {
    explanation: "French nouns usually need an article. The article shows gender, number and meaning.",
    rules: ["Use definite articles for general ideas: la sante, les medias.", "Use indefinite articles for one/a: une tradition, un emploi.", "Use partitives for unspecified amounts: du temps, de la patience, de l'eau."],
    examples: [["General", "La technologie change la vie quotidienne.", "la marks a general concept"], ["Partitive", "Il faut de la patience.", "de la marks an unspecified amount"], ["After negative", "Je n'ai pas de solution simple.", "un/une/des often becomes de after negation"]],
    commonMistakes: ["Dropping articles before abstract nouns.", "Using des after pas when de is required.", "Forgetting l' before a vowel."],
    examUse: "Articles are tiny but frequent; stable article control lifts overall language accuracy.",
  },
  "gender-agreement": {
    explanation: "Every noun has a gender. Adjectives and some past participles must agree with the noun they describe.",
    rules: ["Learn nouns with the article: la communaute, le travail.", "Add feminine and plural endings when needed.", "Check adjective placement and irregular forms such as beau/belle and nouveau/nouvelle."],
    examples: [["Feminine", "Une initiative locale importante.", "initiative is feminine"], ["Masculine", "Un probleme social complexe.", "probleme is masculine"], ["Plural", "Des valeurs culturelles fortes.", "valeurs is feminine plural"]],
    commonMistakes: ["Memorizing nouns without le/la/un/une.", "Assuming words ending in -e are always feminine.", "Forgetting plural agreement after a long noun phrase."],
    examUse: "When vocabulary appears in the app, nouns are shown with articles to train gender automatically.",
  },
  "present-irregulars": {
    explanation: "High-frequency irregular verbs let you express ability, obligation, movement, knowledge and opinion.",
    rules: ["Memorize je/tu/il/nous/vous/ils forms for the core verbs.", "Use the correct stem: nous faisons, ils peuvent, je sais.", "Avoid English-based guesses."],
    examples: [["Pouvoir", "Nous pouvons participer au projet.", "pouvons is the nous form"], ["Devoir", "Les jeunes doivent faire attention.", "doivent is plural"], ["Venir", "Je viens de Quebec.", "venir also expresses origin"]],
    commonMistakes: ["Writing ils peuvent with an invented regular ending.", "Confusing savoir and connaitre.", "Forgetting vous faites."],
    examUse: "These verbs appear in almost every strong Paper 1 response.",
  },
  "basic-negation": {
    explanation: "Basic negation surrounds the conjugated verb with ne and pas. In spoken French ne often drops, but written exam French keeps it.",
    rules: ["Place ne before the conjugated verb and pas after it.", "With an infinitive, use ne pas before the infinitive when only the infinitive is negated.", "Use de after many negative quantity expressions."],
    examples: [["Standard", "Je ne comprends pas cette question.", "ne...pas around comprends"], ["Infinitive", "Il prefere ne pas repondre.", "ne pas before repondre"], ["Quantity", "Nous n'avons pas de voiture.", "des becomes de"]],
    commonMistakes: ["Dropping ne in formal writing.", "Putting pas after the infinitive in the wrong clause.", "Forgetting n' before a vowel."],
    examUse: "Negation helps you state limits and counterarguments clearly.",
  },
  "sentence-order": {
    explanation: "A stable French sentence normally starts with a clear subject, a conjugated verb and a complement.",
    rules: ["Put the conjugated verb early.", "Keep adjectives, pronouns and adverbs attached to the right word.", "Avoid English order when adding adverbs or object pronouns."],
    examples: [["Clear", "Les eleves utilisent les reseaux sociaux tous les jours.", "subject + verb + object + time"], ["Opinion", "Je pense que cette solution est realiste.", "que introduces a clause"], ["Contrast", "Cependant, le cout reste eleve.", "connector + subject + verb"]],
    commonMistakes: ["Copying English word order.", "Separating subject and verb with too many ideas.", "Forgetting the conjugated verb in long sentences."],
    examUse: "Clear sentence order is the base layer before complex grammar.",
  },
  "passe-compose-imparfait": {
    explanation: "Passe compose presents completed events; imparfait gives background, description or habits.",
    rules: ["Use passe compose for a specific completed action.", "Use imparfait for ongoing context, description and repeated past actions.", "Use both together when a background situation is interrupted by an event."],
    examples: [["Event", "Hier, j'ai rencontre une benevole.", "one completed event"], ["Background", "Quand j'etais petit, je lisais beaucoup.", "past habit"], ["Combined", "Il pleuvait quand nous sommes arrives.", "background + event"]],
    commonMistakes: ["Using passe compose for every past verb.", "Using imparfait for one-time completed events.", "Forgetting etre verbs in passe compose."],
    examUse: "This contrast is essential for stories, travel, migration and personal reflection.",
  },
  "future-forms": {
    explanation: "French has several useful future and near-past forms. Choose the form that matches time and tone.",
    rules: ["Use aller + infinitive for near future.", "Use the futur simple for formal predictions or plans.", "Use venir de + infinitive for recent past."],
    examples: [["Near future", "Je vais preparer un discours.", "aller + infinitive"], ["Formal future", "La ville investira dans le transport public.", "futur simple"], ["Recent past", "Nous venons de finir le sondage.", "venir de + infinitive"]],
    commonMistakes: ["Writing je vais prepare.", "Mixing future and conditional endings.", "Forgetting de in venir de."],
    examUse: "Use these forms in proposals, reports and future-oriented culture tasks.",
  },
  imperative: {
    explanation: "The imperative gives commands, advice and instructions without a subject pronoun.",
    rules: ["Use tu, nous and vous forms without the subject.", "Drop the final s in regular tu -er commands before no pronoun: parle, regarde.", "Keep polite register with vous commands when appropriate."],
    examples: [["Advice", "Protegez vos donnees personnelles.", "formal/plural command"], ["Group", "Faisons attention a l'eau.", "nous imperative"], ["Instruction", "Cliquez sur le lien et repondez.", "two commands"]],
    commonMistakes: ["Writing vous protegez in a command.", "Using tu commands in a formal brochure.", "Forgetting accent or pronoun order in negative commands."],
    examUse: "Useful for brochures, campaigns, instructions and speeches.",
  },
  "tonic-pronouns": {
    explanation: "Tonic pronouns appear after prepositions and for emphasis.",
    rules: ["Use moi, toi, lui, elle, nous, vous, eux, elles after prepositions.", "Use them for contrast: Moi, je pense que...", "Do not replace COD/COI pronouns with tonic pronouns in front of the verb."],
    examples: [["After preposition", "Ce projet est important pour eux.", "pour + tonic pronoun"], ["Emphasis", "Moi, je prefere le velo.", "contrast/emphasis"], ["Comparison", "Elle est plus motivee que lui.", "comparison"]],
    commonMistakes: ["Writing pour il.", "Using moi as a subject without je.", "Confusing lui as tonic pronoun and lui as COI pronoun."],
    examUse: "Tonic pronouns add clarity in opinions and comparisons.",
  },
  "cod-coi-basics": {
    explanation: "Object pronouns replace repeated objects and usually go before the conjugated verb.",
    rules: ["Use le, la, l' and les for direct objects.", "Use lui and leur for many a + person objects.", "Place the pronoun before the conjugated verb, or before the infinitive when it belongs to the infinitive."],
    examples: [["COD", "Je la comprends.", "la replaces la question"], ["COI", "Je lui ecris.", "lui replaces a mon professeur"], ["Infinitive", "Je vais les lire ce soir.", "les belongs to lire"]],
    commonMistakes: ["Writing je ecris lui.", "Using leur for direct objects.", "Forgetting l' before a vowel."],
    examUse: "Pronouns reduce repetition and create more natural written French.",
  },
  "y-en-basics": {
    explanation: "Y and en replace common prepositional phrases. They are small but powerful cohesion tools.",
    rules: ["Use y for a + place or a + idea.", "Use en for de + noun, quantities and partitives.", "Place y/en before the conjugated verb or before the infinitive they belong to."],
    examples: [["Y", "J'y vais demain.", "y replaces a la bibliotheque"], ["En", "J'en ai besoin.", "en replaces de ce conseil"], ["Quantity", "Il en a trois.", "en replaces three of something"]],
    commonMistakes: ["Using y for people.", "Using en when the phrase starts with a.", "Putting y/en after the verb in normal statements."],
    examUse: "Y and en make sentences concise in Paper 1 and oral answers.",
  },
  "time-expressions": {
    explanation: "English since and for do not map to one French word. Choose by time meaning.",
    rules: ["Use depuis with present tense for an action still continuing.", "Use pendant for a completed duration.", "Use il y a for ago, dans for in a future time, and pour for intended duration."],
    examples: [["Since", "J'apprends le francais depuis cinq ans.", "still learning now"], ["For", "J'ai travaille pendant deux heures.", "completed duration"], ["Future", "L'examen aura lieu dans un an.", "future time"]],
    commonMistakes: ["Using pour for every English for.", "Writing depuis with a completed past action.", "Confusing il y a and depuis."],
    examUse: "Time expressions matter in narratives, plans and reflection.",
  },
  "faux-amis-core": {
    explanation: "Faux amis look familiar but change meaning. They can damage the message even when grammar is correct.",
    rules: ["Learn the French meaning in context.", "Check risky English words before translating directly.", "Use a safer synonym when unsure."],
    examples: [["Actuellement", "Actuellement, je prepare mes examens.", "currently, not actually"], ["Assister a", "J'ai assiste a une conference.", "to attend"], ["Librairie", "J'ai achete un roman dans une librairie.", "bookshop"]],
    commonMistakes: ["Using attendre for attend.", "Using sensible for reasonable.", "Using location for geographical location."],
    examUse: "Faux amis are high-risk in both writing and comprehension answers.",
  },
  "connectors-basic": {
    explanation: "Connectors show the logic between ideas and help a paragraph feel planned.",
    rules: ["Use addition, contrast, cause, consequence and example connectors.", "Do not start every sentence with aussi.", "Choose register-appropriate connectors."],
    examples: [["Cause", "Je suis d'accord parce que cette mesure est juste.", "simple cause"], ["Contrast", "Cependant, le cout reste un probleme.", "formal contrast"], ["Example", "Par exemple, plusieurs villes limitent les voitures.", "supporting example"]],
    commonMistakes: ["Overusing et.", "Using donc without a real consequence.", "Starting every paragraph the same way."],
    examUse: "Connectors strengthen Criterion B organization and message.",
  },
  "word-family-bank": {
    explanation: "Vocabulary is easier to use accurately when words are learned as families, not isolated translations.",
    rules: ["Learn each noun with an article: la pollution, un emploi, une communaute.", "Record useful collocations, not only meanings.", "Connect verbs, nouns, adjectives and adverbs from the same family."],
    examples: [["Family", "proteger l'environnement, la protection, durable", "words that support one topic"], ["Gender", "une communaute locale", "article and adjective agreement"], ["Collocation", "developper une competence", "natural word partnership"]],
    commonMistakes: ["Memorizing English-to-French lists without gender.", "Using a correct word in an unnatural collocation.", "Repeating the same basic adjective instead of using a family."],
    examUse: "Word families improve range in Paper 1 and speed up comprehension in Paper 2.",
  },
  "relative-simple": {
    explanation: "Simple relative pronouns combine ideas without repeating nouns.",
    rules: ["Use qui for the subject of the second verb.", "Use que for the object of the second verb.", "Use ou for place/time and dont for de phrases."],
    examples: [["Qui", "C'est une initiative qui aide les jeunes.", "initiative does the helping"], ["Que", "Le film que j'ai vu etait touchant.", "film is the object"], ["Dont", "C'est un sujet dont on parle souvent.", "parler de"]],
    commonMistakes: ["Using que for every relative clause.", "Forgetting that dont replaces de.", "Dropping the subject after que when needed."],
    examUse: "Relative clauses increase range while keeping ideas clear.",
  },
  "relative-composed": {
    explanation: "Compound relative pronouns are more formal and agree with the noun they refer to.",
    rules: ["Choose lequel/laquelle/lesquels/lesquelles according to gender and number.", "Contract a + lequel to auquel and de + lequel to duquel.", "Use them mostly after prepositions in formal writing."],
    examples: [["Lequel", "Le programme dans lequel elle travaille est local.", "dans + lequel"], ["Auquel", "C'est un probleme auquel il faut repondre.", "a + lequel"], ["Desquelles", "Les raisons pour lesquelles elle agit sont claires.", "pour + lesquelles"]],
    commonMistakes: ["Using qui after any preposition.", "Forgetting agreement.", "Using compound relatives when a simple qui/que would be clearer."],
    examUse: "Recognition helps reading; controlled use can polish formal Paper 1 writing.",
  },
  "pronominal-verbs": {
    explanation: "Pronominal verbs use a reflexive pronoun and can be literal, reciprocal or idiomatic.",
    rules: ["Match the reflexive pronoun to the subject.", "Use etre in passe compose.", "Check agreement when the reflexive pronoun is a direct object."],
    examples: [["Routine", "Elle se leve a sept heures.", "reflexive routine"], ["Reciprocal", "Ils se sont aides pendant le projet.", "they helped each other"], ["Idiomatic", "Je me rends compte du probleme.", "idiomatic meaning"]],
    commonMistakes: ["Writing je leve instead of je me leve.", "Using avoir in passe compose.", "Over-agreeing when the direct object follows the verb."],
    examUse: "Useful for identity, well-being, relationships and daily life.",
  },
  conditionnel: {
    explanation: "The conditionnel present expresses politeness, hypothesis and advice; the past conditional expresses what would have happened.",
    rules: ["Use the future stem plus imparfait endings.", "Use je voudrais for polite requests.", "Use si + imparfait + conditionnel for unreal present hypotheses."],
    examples: [["Polite", "Je voudrais proposer une solution.", "soft formal tone"], ["Hypothesis", "Si j'avais plus de temps, je participerais.", "imparfait + conditionnel"], ["Past exposure", "J'aurais aime aider davantage.", "basic past conditional"]],
    commonMistakes: ["Using conditionnel after si in the same clause.", "Confusing future and conditional endings.", "Overusing je voudrais in informal texts."],
    examUse: "Adds nuance to recommendations, proposals and regrets.",
  },
  "advanced-negation": {
    explanation: "Advanced negatives make meaning more exact than ne...pas.",
    rules: ["Use ne...jamais for never and ne...plus for no longer.", "Use ne...rien and ne...personne for nothing/no one.", "Use ne...que for only, which is restrictive rather than fully negative."],
    examples: [["Never", "Je ne mange jamais de viande.", "jamais replaces pas"], ["No one", "Personne ne repond.", "negative subject"], ["Only", "Elle ne boit que de l'eau.", "only water"]],
    commonMistakes: ["Combining pas with jamais.", "Forgetting ne with personne/rien subjects.", "Misreading ne...que as a normal negative."],
    examUse: "Precise negation supports arguments and comprehension.",
  },
  "pronoun-order": {
    explanation: "When two pronouns appear before the verb, they follow a fixed order.",
    rules: ["First: me, te, se, nous, vous.", "Then: le, la, les before lui, leur.", "Y comes before en at the end of the chain."],
    examples: [["Two pronouns", "Je le lui explique.", "le before lui"], ["Y and en", "Il y en a beaucoup.", "y before en"], ["Infinitive", "Je vais le leur envoyer.", "pronouns before envoyer"]],
    commonMistakes: ["Putting lui before le.", "Using two pronouns when repeating the noun would be clearer.", "Forgetting pronouns move after affirmative commands."],
    examUse: "Useful in transformations and high-control revision.",
  },
  "si-clauses": {
    explanation: "Si clauses link condition and result. The tense pattern changes the meaning.",
    rules: ["Use si + present + future for realistic future conditions.", "Use si + imparfait + conditionnel for hypothetical situations.", "Do not use the future or conditional directly after si in these patterns."],
    examples: [["Real", "Si nous agissons maintenant, la situation changera.", "present + future"], ["Hypothetical", "Si j'etais maire, je construirais plus de pistes cyclables.", "imparfait + conditionnel"], ["Advice", "Si tu veux progresser, revise chaque semaine.", "present + imperative"]],
    commonMistakes: ["Writing si je serai.", "Writing si j'aurais.", "Losing the logical relation between clauses."],
    examUse: "Excellent for speeches, opinion columns and proposals.",
  },
  "gerund-participle": {
    explanation: "The gerondif expresses how or while something happens. The participe present is more formal and often seen in reading.",
    rules: ["Use en + present participle for simultaneous action or manner.", "Keep the subject of both actions the same for the gerondif.", "Recognize formal participles in written texts."],
    examples: [["Manner", "On apprend en pratiquant regulierement.", "how one learns"], ["Simultaneous", "Elle ecoute de la musique en travaillant.", "same subject"], ["Formal", "Les personnes vivant en ville...", "participle phrase"]],
    commonMistakes: ["Using gerondif with two different subjects.", "Overusing it in simple writing.", "Confusing it with English -ing in every context."],
    examUse: "A controlled gerondif can add range without a very long sentence.",
  },
  "article-complexity": {
    explanation: "Articles become harder in long sentences because de, negation, quantity and adjective placement interact.",
    rules: ["After beaucoup de, assez de and trop de, use de before the noun.", "After pas, use de for many direct objects.", "Keep the article when the noun is specific or when de is part of a fixed phrase."],
    examples: [["Quantity", "Il y a beaucoup de pollution dans la ville.", "beaucoup de + noun"], ["Specific", "Je parle de la pollution locale.", "specific topic keeps de la"], ["Negative", "Elle n'a pas de solution facile.", "pas de"]],
    commonMistakes: ["Dropping articles in long noun groups.", "Using des after beaucoup.", "Removing articles after every de."],
    examUse: "This lesson directly targets the student's article weakness in complex sentences.",
  },
  "text-type-choice": {
    explanation: "In Paper 1, the best text type is the one that fits audience, purpose and context.",
    rules: ["Identify who writes, who reads and why.", "Choose a text type whose conventions fit the task.", "Avoid choosing the easiest text type if the audience or purpose does not match."],
    examples: [["Formal request", "Une lettre officielle convient a une demande au maire.", "formal audience"], ["Personal reflection", "Un journal intime convient a une experience personnelle.", "private voice"], ["Public advice", "Une brochure convient a une campagne d'information.", "public guidance"]],
    commonMistakes: ["Choosing a blog for a formal complaint.", "Forgetting openings and closings.", "Ignoring audience."],
    examUse: "Good text-type choice protects Criterion C before the writing even begins.",
  },
  "formal-informal-register": {
    explanation: "Register is the relationship between writer and reader. It affects pronouns, formulas, vocabulary and tone.",
    rules: ["Use vous and formal formulas for institutions and unknown adults.", "Use tu and warmer tone for friends and personal contexts.", "Keep register consistent from opening to closing."],
    examples: [["Formal", "Madame, je vous ecris afin de proposer...", "institutional tone"], ["Informal", "Salut Clara, j'espere que tu vas bien.", "friend tone"], ["Neutral", "Bonjour a tous, aujourd'hui je voudrais parler de...", "speech opening"]],
    commonMistakes: ["Mixing tu and vous.", "Using salut in a formal email.", "Ending a formal letter with a casual closing."],
    examUse: "Register is visible in almost every Paper 1 text type.",
  },
  "paragraph-development": {
    explanation: "A strong paragraph develops one idea with support instead of listing disconnected sentences.",
    rules: ["Start with a clear point.", "Add explanation and a concrete example.", "Link back to the task using a connector."],
    examples: [["Point", "Les transports publics rendent la ville plus accessible.", "main idea"], ["Support", "Par exemple, les jeunes peuvent se deplacer sans voiture.", "example"], ["Link", "Ainsi, cette solution reduit les inegalites.", "consequence"]],
    commonMistakes: ["Writing many simple opinions without examples.", "Adding examples that do not support the point.", "Changing topic inside one paragraph."],
    examUse: "Directly improves the message and organization categories of Paper 1.",
  },
  "paper1-criteria": {
    explanation: "Use a simplified self-check before submitting a Paper 1 response.",
    rules: ["Language: range and accuracy.", "Message: relevance, development and organization.", "Conceptual understanding: audience, purpose, context and text-type conventions."],
    examples: [["Language", "Ai-je verifie les accords et les temps ?", "accuracy check"], ["Message", "Chaque paragraphe repond-il a la question ?", "relevance check"], ["Text type", "Ai-je inclus les conventions attendues ?", "Criterion C check"]],
    commonMistakes: ["Editing only vocabulary and ignoring task relevance.", "Forgetting word count.", "Using the same checklist for every text type."],
    examUse: "Revision becomes targeted instead of vague.",
  },
  "reading-question-types": {
    explanation: "Reading questions test evidence, not guesses. Each answer must come from the text.",
    rules: ["Underline the line that proves the answer.", "For headings, identify the paragraph function.", "For reference questions, locate the exact noun or idea replaced."],
    examples: [["Evidence", "La reponse est dans le deuxieme paragraphe.", "text-based"], ["Reference", "\"Cela\" renvoie a la decision du conseil.", "pronoun/reference"], ["Heading", "Le paragraphe presente une solution locale.", "function"]],
    commonMistakes: ["Answering from background knowledge.", "Choosing a heading from one detail only.", "Writing too much in short answers."],
    examUse: "This prepares the student for original 40-mark reading mocks.",
  },
  "listening-strategy": {
    explanation: "Listening is a two-pass task: predict before, capture structure first, then details.",
    rules: ["Use reading time to predict topic and answer type.", "During the first hearing, catch speaker, context and main idea.", "During the second hearing, confirm details and avoid distractors."],
    examples: [["Prediction", "La question demande un lieu, donc j'ecoute une preposition.", "targeted listening"], ["Main idea", "Le texte presente un probleme puis deux solutions.", "structure"], ["Detail", "Le nombre final contredit le premier chiffre entendu.", "distractor control"]],
    commonMistakes: ["Trying to write every word.", "Changing correct answers because of one distractor.", "Ignoring notes between hearings."],
    examUse: "The app uses browser TTS scripts so the strategy can be practiced immediately.",
  },
  "culture-francophone": {
    explanation: "Culture examples should be precise, varied and respectful, not stereotypes.",
    rules: ["Use examples from multiple Francophone contexts.", "Connect culture to the task's theme.", "Avoid sweeping claims about whole countries or communities."],
    examples: [["Quebec", "Au Quebec, la protection du francais influence l'education et les medias.", "language and identity"], ["Senegal", "A Dakar, des initiatives numeriques soutiennent de jeunes entrepreneurs.", "innovation"], ["Belgium", "En Belgique, le multilinguisme peut enrichir la vie sociale.", "identity and society"]],
    commonMistakes: ["Using only France as culture.", "Turning culture into stereotypes.", "Adding facts that do not support the argument."],
    examUse: "Specific Francophone examples strengthen Paper 1 ideas and oral discussion.",
  },
  "mixed-diagnostic": {
    explanation: "A diagnostic mixes short tasks from the whole course to reveal the next best step.",
    rules: ["Answer quickly without overusing notes.", "Review the explanations after each item.", "Use weak areas to select the next lesson."],
    examples: [["Grammar", "Je veux partir, pas je veux pars.", "infinitive after conjugated verb"], ["Text type", "Une lettre officielle convient au maire.", "audience and purpose"], ["Culture", "Un exemple francophone doit etre precis.", "non-stereotyped evidence"]],
    commonMistakes: ["Studying only favorite areas.", "Ignoring mastered skills that are due for review.", "Treating diagnostic score as a final grade."],
    examUse: "The dashboard uses diagnostic results to recommend lessons and reviews.",
  },
};

export const lessons: Lesson[] = skills.map((skill) => {
  const lesson = content[skill.id];

  return {
    id: skill.lessonIds[0],
    skillId: skill.id,
    title: skill.title,
    category: skill.category,
    level: skill.level,
    explanation: lesson.explanation,
    rules: lesson.rules,
    examples: lesson.examples.map(([label, french, note]) => ({ label, french, note })),
    commonMistakes: lesson.commonMistakes,
    examUse: lesson.examUse,
    exerciseIds: skill.exerciseIds,
  };
});

export const lessonsById = Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson])) as Record<string, Lesson>;
