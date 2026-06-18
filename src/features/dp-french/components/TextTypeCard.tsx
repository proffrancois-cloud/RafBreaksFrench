import type { TextTypeCard as TextTypeCardModel } from "../types";

export function TextTypeCard({ textType }: { textType: TextTypeCardModel }) {
  return (
    <article className="resource-card">
      <div className="resource-card__top">
        <h3>{textType.title}</h3>
        <span>{textType.register}</span>
      </div>
      <p>{textType.whenToChoose}</p>
      <div className="content-grid tight">
        <div>
          <h4>Use when</h4>
          <p>{textType.whenToChoose}</p>
        </div>
        <div>
          <h4>Avoid when</h4>
          <p>{textType.whenNotToChoose}</p>
        </div>
      </div>
      <div className="mini-list">
        <strong>Conventions</strong>
        <span>{textType.conventions.join(" | ")}</span>
      </div>
      <div className="model-box">{textType.miniModel}</div>
      <div className="mini-list">
        <strong>Practice</strong>
        <span>{textType.practiceTask}</span>
      </div>
    </article>
  );
}
