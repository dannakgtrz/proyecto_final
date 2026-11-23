// Componente de interfaz para la Etapa 3: Primera operación paralela en WebGPU.
// Muestra la suma vectorial en paralelo, comparación con la verdad terreno (CPU)
// y permite ejecutar tanto el caso base (5 elementos) como una prueba ampliada (1,000 elementos).

import type { VectorAddResult } from "../types/vectorAdd";
import { escapeHtml } from "../utils/text";
import { initializeWebGPU } from "../utils/webgpuDevice";
import { executeVectorAddWebGPU } from "../utils/vectorAdd";

/** Formatea un Float32Array para visualización concisa */
function formatVector(vec: Float32Array, maxItems = 6): string {
  if (vec.length <= maxItems) {
    return `[${Array.from(vec).join(", ")}]`;
  }
  const head = Array.from(vec.slice(0, 3)).join(", ");
  const tail = Array.from(vec.slice(-2)).join(", ");
  return `[${head}, … (${vec.length - 5} elementos más) …, ${tail}]`;
}

/** Genera el HTML descriptivo de los resultados de cómputo */
function renderResultsHtml(res: VectorAddResult): string {
  const statusBadge = res.isValid
    ? `<span class="badge badge--ok">Válido: 100% Coincidencia</span>`
    : `<span class="badge badge--failed">Error: Discrepancia numérica</span>`;

  return `
    <div class="va-status-banner ${res.isValid ? "va-status-banner--ok" : "va-status-banner--failed"}">
      <strong>${res.isValid ? "Cálculo paralelo exitoso en la GPU" : "Fallo en la validación numérica"}</strong>
      <p>Los resultados calculados por el shader WGSL fueron comparados con el cálculo secuencial de referencia en TypeScript.</p>
    </div>

    <div class="card va-summary-card">
      <div class="info-row">
        <dt>Estado de validación</dt>
        <dd>${statusBadge}</dd>
      </div>
      <div class="info-row">
        <dt>Elementos calculados</dt>
        <dd><strong>${res.elementCount.toLocaleString("es")}</strong> invocaciones activas</dd>
      </div>
      <div class="info-row">
        <dt>Paralelismo GPU</dt>
        <dd>${res.workgroupsDispatched} workgroups × ${res.workgroupSize} hilos = ${res.totalThreadsSpawned} hilos despachados</dd>
      </div>
      <div class="info-row">
        <dt>Tiempo de prueba (CPU-GPU-CPU)</dt>
        <dd>${res.executionTimeMs.toFixed(2)} ms <span class="muted-note">(tiempo de prueba local, no benchmark formal)</span></dd>
      </div>
      <div class="info-row">
        <dt>Diferencia máxima (|GPU - CPU|)</dt>
        <dd><code>${res.maxDifference.toExponential(2)}</code></dd>
      </div>
    </div>

    <h3 class="block-title">Comparación de Vectores</h3>
    <div class="card va-vectors-card">
      <div class="vector-field">
        <div class="vector-label">Vector A (Entrada en GPU):</div>
        <div class="vector-code"><code>${escapeHtml(formatVector(res.vectorA))}</code></div>
      </div>
      <div class="vector-field">
        <div class="vector-label">Vector B (Entrada en GPU):</div>
        <div class="vector-code"><code>${escapeHtml(formatVector(res.vectorB))}</code></div>
      </div>
      <div class="vector-field">
        <div class="vector-label">Resultado esperado (Referencia CPU):</div>
        <div class="vector-code expected"><code>${escapeHtml(formatVector(res.expected))}</code></div>
      </div>
      <div class="vector-field">
        <div class="vector-label">Resultado calculado (WebGPU WGSL):</div>
        <div class="vector-code calculated"><code>${escapeHtml(formatVector(res.resultGPU))}</code></div>
      </div>
    </div>
  `;
}

/** Monta la sección en el contenedor del DOM */
export function mountVectorAddDemo(container: HTMLElement): void {
  container.innerHTML = `
    <div class="va-header">
      <div>
        <h2>Primera operación paralela en WebGPU</h2>
        <p class="subtitle">Suma vectorial ejecutada en paralelo mediante shader de cómputo WGSL (C = A + B).</p>
      </div>
      <div class="va-actions">
        <button type="button" class="btn" id="run-base-btn">Ejecutar caso base (5 elementos)</button>
        <button type="button" class="btn btn--secondary" id="run-large-btn">Ejecutar prueba (1,000 elementos)</button>
      </div>
    </div>
    <div id="va-output"></div>
  `;

  const output = container.querySelector<HTMLDivElement>("#va-output");
  const runBaseBtn = container.querySelector<HTMLButtonElement>("#run-base-btn");
  const runLargeBtn = container.querySelector<HTMLButtonElement>("#run-large-btn");

  if (!output || !runBaseBtn || !runLargeBtn) return;

  async function runComputation(count: number): Promise<void> {
    if (!output || !runBaseBtn || !runLargeBtn) return;

    runBaseBtn.disabled = true;
    runLargeBtn.disabled = true;
    output.innerHTML = `<div class="va-loading"><p class="muted">Ejecutando cómputo en la GPU (${count.toLocaleString("es")} elementos)...</p></div>`;

    try {
      // 1. Obtener dispositivo WebGPU inicializado
      const initRes = await initializeWebGPU();
      if (!initRes.ok) {
        output.innerHTML = `
          <div class="va-status-banner va-status-banner--failed">
            <strong>WebGPU no está disponible para ejecutar el shader.</strong>
            <p>${escapeHtml(initRes.message)}</p>
          </div>
        `;
        return;
      }

      const device = initRes.context.device;

      // 2. Preparar los vectores de entrada en Float32Array
      let vecA: Float32Array;
      let vecB: Float32Array;

      if (count === 5) {
        vecA = new Float32Array([1, 2, 3, 4, 5]);
        vecB = new Float32Array([10, 20, 30, 40, 50]);
      } else {
        vecA = new Float32Array(count);
        vecB = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          vecA[i] = i + 1;
          vecB[i] = (i + 1) * 10;
        }
      }

      // 3. Ejecución del cómputo paralelo
      const result = await executeVectorAddWebGPU(device, vecA, vecB);
      output.innerHTML = renderResultsHtml(result);
    } catch (err) {
      output.innerHTML = `
        <div class="va-status-banner va-status-banner--failed">
          <strong>Error durante la ejecución del shader:</strong>
          <p>${escapeHtml(String(err))}</p>
        </div>
      `;
    } finally {
      runBaseBtn.disabled = false;
      runLargeBtn.disabled = false;
    }
  }

  runBaseBtn.addEventListener("click", () => void runComputation(5));
  runLargeBtn.addEventListener("click", () => void runComputation(1000));

  // Ejecución automática inicial del caso base de 5 elementos
  void runComputation(5);
}
