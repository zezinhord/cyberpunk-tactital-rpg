import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./landscape.css";
import "./immersive-ui.css";
import "./arena-v030.css";
import "./character-presentation.css";
import "./audio-controls.css";
import "./class-selection.css";
import "./save-slots.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento raiz #root não encontrado.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
