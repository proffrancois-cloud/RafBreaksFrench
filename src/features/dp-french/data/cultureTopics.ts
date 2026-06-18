import type { CultureTopic } from "../types";

const themeRows: Array<[string, string, string, string[]]> = [
  ["Identites", "styles de vie", "In several Francophone cities, debates about transport, food habits and screen time show how lifestyle choices are shaped by school, family income and public space.", ["Compare two daily routines", "Write a blog about a healthier school week", "Give advice to new DP students"]],
  ["Identites", "sante et bien-etre", "Quebec and Switzerland offer useful examples for discussing mental health campaigns, outdoor activity and prevention without reducing the topic to one country.", ["A speech about stress before exams", "A brochure for teen well-being", "An article on sleep and school"]],
  ["Identites", "convictions et valeurs", "Francophone communities often debate secularism, family expectations, language protection and solidarity in different ways.", ["An opinion column about values at school", "A formal email proposing a solidarity project", "A diary entry after a volunteer day"]],
  ["Identites", "sous-cultures", "Music, sport, fashion and online communities can express identity in French-speaking contexts from Brussels to Dakar.", ["A blog about youth culture", "An interview with a young artist", "A review of a local cultural event"]],
  ["Identites", "langue et identite", "In Quebec, Belgium, Senegal and Morocco, French can interact with other languages and become part of identity, education and media debates.", ["A speech about multilingualism", "A letter about language policy", "A forum post about speaking several languages"]],
  ["Experiences", "activites de loisirs", "Leisure can reveal access, gender expectations, urban planning and community life in Francophone settings.", ["A brochure for inclusive leisure", "A blog about a new activity", "A proposal for a school club"]],
  ["Experiences", "vacances et voyages", "Tourism in France, Morocco, the Caribbean and Switzerland can raise questions about sustainability, local economies and cultural respect.", ["An article on responsible tourism", "An email from a trip", "A speech encouraging local travel"]],
  ["Experiences", "recits de vie", "Life stories of students, migrants, artists or athletes help connect grammar of past tenses with identity and change.", ["A diary entry about a turning point", "An interview with an older relative", "A blog about a personal challenge"]],
  ["Experiences", "rites de passage", "Graduation, first work experiences, religious or family celebrations, and moving abroad can be discussed without assuming one universal tradition.", ["A speech for a ceremony", "A personal letter about change", "An article on becoming independent"]],
  ["Experiences", "migration", "Francophone migration stories can involve language, employment, education, family separation and belonging.", ["A report on integration support", "A diary entry after arriving in a new city", "A formal email to a community center"]],
  ["Ingeniosite humaine", "divertissements", "Streaming, gaming, festivals and sport show how entertainment can be creative, commercial and social.", ["A review of a series", "A blog about screen time", "A speech on entertainment and identity"]],
  ["Ingeniosite humaine", "expressions artistiques", "Francophone art from comic books, street art, film and music can comment on social questions.", ["A critique of an exhibition", "An interview with an artist", "A blog about art in public spaces"]],
  ["Ingeniosite humaine", "communications et medias", "French-language media vary across countries and can raise issues of trust, misinformation and representation.", ["An article on fake news", "A formal proposal for a media workshop", "A forum post about influencers"]],
  ["Ingeniosite humaine", "technologie", "Digital access, privacy and educational technology are strong DP topics in Francophone contexts.", ["A speech about AI at school", "A brochure on online safety", "A report on digital inequality"]],
  ["Ingeniosite humaine", "innovation scientifique", "Scientific innovation can be linked to health, climate, transport and ethics in realistic DP tasks.", ["A proposal for a science fair", "An article on green innovation", "A debate speech about medical technology"]],
  ["Organisation sociale", "relations sociales", "Friendship, family, intergenerational contact and online relationships can be explored through register and pronouns.", ["A personal letter after a conflict", "A blog about friendship online", "An advice column"]],
  ["Organisation sociale", "communaute", "Community projects in Francophone neighborhoods can show solidarity, local identity and practical citizenship.", ["A report on a local project", "A speech asking for volunteers", "A brochure for a community event"]],
  ["Organisation sociale", "engagement social", "Youth activism in climate, equality and language rights gives realistic reasons to use formal appeals and opinion language.", ["A letter to the school director", "A tract for a campaign", "An opinion column on activism"]],
  ["Organisation sociale", "education", "Education topics can compare access, assessment pressure, languages, technology and vocational routes.", ["A formal email about school reform", "A blog about DP pressure", "A speech proposing peer tutoring"]],
  ["Organisation sociale", "monde du travail", "Work topics can include internships, remote work, youth employment and professional skills.", ["A letter of motivation", "A report on internships", "An interview about a future career"]],
  ["Partage de la planete", "environnement", "Urban pollution, recycling, biodiversity and public transport offer concrete Francophone examples.", ["A brochure on reducing waste", "A speech for Earth Day", "An article about urban pollution"]],
  ["Partage de la planete", "droits de l'homme", "Human rights can be discussed through education, equality, language access and public services.", ["An opinion column on equality", "A formal letter about accessibility", "A speech for a school assembly"]],
  ["Partage de la planete", "paix et conflits", "Peace and conflict topics should focus on human experiences, media, education and reconciliation with care.", ["A report on peace education", "A speech against online hate", "A diary entry from a youth exchange"]],
  ["Partage de la planete", "mondialisation", "Globalization connects language, work, culture, consumption and local identity across Francophone spaces.", ["An article on global brands", "A debate speech about local culture", "A proposal for fair trade at school"]],
  ["Partage de la planete", "environnements urbains et ruraux", "Urban and rural environments raise questions of mobility, services, housing, nature and opportunity.", ["A report on transport", "A brochure for a greener neighborhood", "A blog about life in the countryside"]],
];

export const cultureTopics: CultureTopic[] = themeRows.map(([theme, topic, francophoneKnowledge, paper1Angles], index) => {
  const id = `${theme.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}-${topic
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

  return {
    id: id || `culture-${index + 1}`,
    theme,
    topic,
    keyVocabulary: ["un enjeu", "une communaute", "une initiative", "un changement", "une consequence"],
    usefulExpressions: ["Il est important de nuancer.", "Cela montre que...", "Dans un contexte francophone...", "On peut comparer cela a..."],
    francophoneKnowledge,
    paper1Angles,
    readingTextIdea: `Original text idea: a short article or interview about ${topic} in a Francophone community, with one concrete local initiative and one limitation.`,
    listeningTextIdea: `Original listening idea: two speakers discuss ${topic}, first giving a personal experience, then a practical recommendation.`,
    discussionQuestions: [
      `Comment ${topic} influence-t-il l'identite d'un jeune ?`,
      "Quels exemples francophones pourraient soutenir ton argument ?",
      "Quelle solution serait realiste dans une ecole internationale ?",
    ],
    commonMistakes: ["Using only France as an example.", "Making a generalization about a whole culture.", "Adding a cultural reference that does not support the task."],
    connectors: ["cependant", "par consequent", "en revanche", "par exemple", "ainsi"],
  };
});
