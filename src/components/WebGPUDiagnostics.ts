// Componente de la sección "Diagnóstico de WebGPU".
// Responsabilidad: mostrar en pantalla un WebGPUDiagnostic y manejar el botón.
// No habla con la GPU directamente: llama a runDiagnostics().

import type { LimitEntry, StageResult, StageState, WebGPUDiagnostic } from "../types/webgpu";
import { escapeHtml } from "../utils/text";
import { runDiagnostics } from "../utils/webgpuDiagnostics";

const STATE_LABEL: Record<StageState, string> = {
  ok: "Correcto",
  failed: "Fallo",
  skipped: "No evaluado",
};

const numberFormat = new Intl.NumberFormat("es");

function formatLimit(value: number | null): string {
  return value === null ? "—" : numberFormat.format(value);
}

// ---------- Piezas pequeñas de HTML ----------

function renderStage(title: string, stage: StageResult): string {
  return `
    <article class="stage stage--${stage.state}">
      <h3>${title}</h3>
      <span class="badge badge--${stage.state}">${STATE_LABEL[stage.state]}</span>
      <p>${escapeHtml(stage.message)}</p>
    </article>
  `;
}

function renderOverall(d: WebGPUDiagnostic): string {
  if (d.unexpectedError !== null) {
    return `<div class="overall overall--failed">
      <strong>Error inesperado durante el diagnóstico.</strong>
      <p>${escapeHtml(d.unexpectedError)}</p>
    </div>`;
  }
  const allOk = d.support.state === "ok" && d.adapter.state === "ok" && d.device.state === "ok";
  if (allOk) {
    const note = d.deviceReused
      ? "Se reutilizó el dispositivo creado anteriormente."
      : "Se creó un dispositivo nuevo.";
    return `<div class="overall overall--ok">
      <strong>WebGPU disponible: adaptador y dispositivo inicializados.</strong>
      <p>${note}</p>
    </div>`;
  }
  return `<div class="overall overall--failed">
    <strong>WebGPU no está disponible en este entorno.</strong>
    <p>Revise los mensajes de cada paso para conocer la causa.</p>
  </div>`;
}

function renderAdapterInfo(d: WebGPUDiagnostic): string {
  if (d.adapterInfo === null) {
    return `<p class="muted">Sin información: no se obtuvo un adaptador.</p>`;
  }
  const rows: [string, string][] = [
    ["Fabricante (vendor)", d.adapterInfo.vendor],
    ["Arquitectura", d.adapterInfo.architecture],
    ["Dispositivo", d.adapterInfo.device],
    ["Descripción", d.adapterInfo.description],
  ];
  const html = rows
    .map(([label, value]) => {
      const shown = value === "" ? `<span class="muted">No proporcionado por el navegador</span>` : escapeHtml(value);
      return `<div class="info-row"><dt>${label}</dt><dd>${shown}</dd></div>`;
    })
    .join("");
  return `<dl class="info-list">${html}</dl>`;
}

function renderFeatureList(title: string, features: string[], emptyText: string): string {
  const content =
    features.length === 0
      ? `<p class="muted">${emptyText}</p>`
      : `<ul class="chips">${features.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>`;
  return `<div class="subsection"><h4>${title} (${features.length})</h4>${content}</div>`;
}

function renderLimits(limits: LimitEntry[]): string {
  if (limits.length === 0) {
    return `<p class="muted">Sin límites: no se obtuvo un adaptador.</p>`;
  }
  const rows = limits
    .map(
      (l) => `<tr>
        <td><code>${escapeHtml(l.name)}</code></td>
        <td class="num">${formatLimit(l.deviceValue)}</td>
        <td class="num">${formatLimit(l.adapterValue)}</td>
      </tr>`,
    )
    .join("");
  return `<div class="table-wrap"><table>
    <thead><tr><th>Límite</th><th class="num">Dispositivo</th><th class="num">Adaptador</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

// ---------- Página completa de resultados ----------

function renderResults(d: WebGPUDiagnostic): string {
  const time = d.checkedAt.toLocaleTimeString("es");
  const secure = d.secureContext ? "Sí" : "No";
  return `
    ${renderOverall(d)}

    <div class="stages">
      ${renderStage("1. Soporte en el navegador", d.support)}
      ${renderStage("2. Adaptador", d.adapter)}
      ${renderStage("3. Dispositivo", d.device)}
    </div>

    <h3 class="block-title">Información técnica</h3>
    <div class="card">
      <h4>Adaptador</h4>
      ${renderAdapterInfo(d)}
    </div>

    <div class="card">
      <h4>Características (features)</h4>
      ${renderFeatureList("Del adaptador", d.adapterFeatures, "El adaptador no reporta características opcionales.")}
      ${renderFeatureList("Del dispositivo", d.deviceFeatures, "El dispositivo se creó sin características opcionales.")}
    </div>

    <div class="card">
      <h4>Límites (limits)</h4>
      ${renderLimits(d.limits)}
    </div>

    <p class="meta">Contexto seguro: ${secure} · Última ejecución: ${time}</p>
  `;
}

// ---------- Montaje y botón ----------

export function mountWebGPUDiagnostics(container: HTMLElement): void {
  container.innerHTML = `
    <div class="diag-header">
      <h2>Diagnóstico de WebGPU</h2>
      <button type="button" class="btn" id="rerun-diagnostics">Volver a ejecutar diagnóstico</button>
    </div>
    <div id="diagnostics-output"></div>
  `;

  const button = container.querySelector<HTMLButtonElement>("#rerun-diagnostics");
  const output = container.querySelector<HTMLDivElement>("#diagnostics-output");
  if (!button || !output) {
    return;
  }

  async function execute(): Promise<void> {
    if (!button || !output) return;
    button.disabled = true;
    output.innerHTML = `<p class="muted">Ejecutando diagnóstico…</p>`;
    const diagnostic = await runDiagnostics();
    output.innerHTML = renderResults(diagnostic);
    button.disabled = false;
  }

  button.addEventListener("click", () => {
    void execute();
  });

  void execute(); // primera ejecución automática al cargar la página
}

