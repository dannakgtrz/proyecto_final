import "./styles/main.css";
import "./styles/diagnostics.css";
import packageJson from "../package.json";
import { renderProjectCard } from "./components/ProjectCard";
import { mountWebGPUDiagnostics } from "./components/WebGPUDiagnostics";
import { getEnvironmentStatus } from "./utils/environment";
import type { ProjectInfo } from "./types/project";

// Datos que se mostrarán en la página inicial.
const info: ProjectInfo = {
  title: "Implementación Vectorizada de Regresión Lineal en WebGPU",
  subtitle: "Evaluación de rendimiento frente a TensorFlow.",
  projectType: "Proyecto académico de maestría",
  environmentStatus: getEnvironmentStatus(),
  version: packageJson.version, // se lee de package.json
  status: "Proyecto base configurado",
};

// Insertamos el HTML dentro del <div id="app"> de index.html.
const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  app.innerHTML = renderProjectCard(info);

  // Sección de diagnóstico de WebGPU (etapa 2), debajo de la tarjeta inicial.
  const diagnostics = document.createElement("section");
  diagnostics.className = "diagnostics";
  app.appendChild(diagnostics);
  mountWebGPUDiagnostics(diagnostics);
}

