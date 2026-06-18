import type { VocabularyFamily } from "../types";

export function VocabularyFamilyCard({ family }: { family: VocabularyFamily }) {
  return (
    <article className="resource-card">
      <div className="resource-card__top">
        <h3>{family.family}</h3>
        <span>{family.theme}</span>
      </div>
      <p className="hint">{family.cefr} target family</p>
      <div className="vocab-items">
        {family.items.map((item) => (
          <div className="vocab-item" key={item.french}>
            <strong>{item.french}</strong>
            <span>{item.english}</span>
            <p>{item.example}</p>
            <small>{item.collocations.join(" | ")}</small>
          </div>
        ))}
      </div>
      <div className="stem-row">
        {family.sentenceStems.map((stem) => (
          <span key={stem}>{stem}</span>
        ))}
      </div>
    </article>
  );
}
