import inventory from "./paper1SlPack.generated.json";

export interface Paper1SlPackTask {
  theme: string;
  topic: string;
  anchor: string;
  prompt: string;
  options: string[];
  best: string;
  ok: string;
  weak: string;
  audience: string;
  purposes: string[];
  rationale: string;
  repeat_reason?: string;
}

export interface Paper1SlPackForm {
  id: string;
  tasks: Paper1SlPackTask[];
}

const typedInventory = inventory as { forms: Paper1SlPackForm[] };

export const paper1SlPack = {
  title: "Paper 1 SL - Pack eleve",
  subtitle: "10 epreuves d'entrainement au format IB DP French B SL",
  instructions:
    "Realisez une seule tache par epreuve. Utilisez, en fonction des propositions, le type de texte le plus approprie. Ecrivez entre 250 et 400 mots.",
  durationMinutes: 75,
  wordCount: "250-400 mots",
  sourceDocxUrl: "/frenchease/paper1-sl-pack/Paper_1_SL_pack_eleve_10_epreuves.docx",
  forms: typedInventory.forms,
};

export const paper1SlPackStats = {
  formCount: paper1SlPack.forms.length,
  taskCount: paper1SlPack.forms.reduce((sum, form) => sum + form.tasks.length, 0),
  bestTextTypes: Array.from(new Set(paper1SlPack.forms.flatMap((form) => form.tasks.map((task) => task.best)))).sort(),
};
