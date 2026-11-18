import type { ProjectInfo } from "../types/project";

// Un componente aquí es simplemente una función que recibe datos y
// devuelve el HTML (texto) correspondiente a una parte de la página.
export function renderProjectCard(info: ProjectInfo): string {
  return `
    <header class="header">
      <h1>${info.title}</h1>
      <p class="subtitle">${info.subtitle}</p>
    </header>

    <section class="card">
      <dl class="info-list">
        <div class="info-row">
          <dt>Tipo de proyecto</dt>
          <dd>${info.projectType}</dd>
        </div>
        <div class="info-row">
          <dt>Entorno de desarrollo</dt>
          <dd>${info.environmentStatus}</dd>
        </div>
        <div class="info-row">
          <dt>Versión de la aplicación</dt>
          <dd>${info.version}</dd>
        </div>
        <div class="info-row">
          <dt>Estado inicial</dt>
          <dd><span class="badge">${info.status}</span></dd>
        </div>
      </dl>
    </section>
  `;
}

