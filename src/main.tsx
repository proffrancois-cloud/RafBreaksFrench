import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DPFrenchApp } from "./features/dp-french/DPFrenchApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DPFrenchApp />
  </StrictMode>,
);
