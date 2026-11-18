// Ejecuta el diagnóstico completo: inicializa WebGPU, lee la información técnica
// y junta todo en un único objeto (WebGPUDiagnostic) que la interfaz puede dibujar.
// Este módulo no toca el HTML.

import type { StageResult, WebGPUDiagnostic } from "../types/webgpu";
import { describeError } from "./text";
import { initializeWebGPU } from "./webgpuDevice";
import { listFeatures, readAdapterDescription, readLimits } from "./webgpuInfo";

const SKIPPED: StageResult = {
  state: "skipped",
  message: "No se intentó porque un paso anterior falló.",
};

const SUPPORT_OK: StageResult = { state: "ok", message: "navigator.gpu está disponible." };
const ADAPTER_OK: StageResult = { state: "ok", message: "requestAdapter() devolvió un adaptador." };
const DEVICE_OK: StageResult = { state: "ok", message: "requestDevice() creó el dispositivo." };

export async function runDiagnostics(): Promise<WebGPUDiagnostic> {
  const diagnostic: WebGPUDiagnostic = {
    checkedAt: new Date(),
    secureContext: window.isSecureContext,
    support: SKIPPED,
    adapter: SKIPPED,
    device: SKIPPED,
    deviceReused: false,
    adapterInfo: null,
    adapterFeatures: [],
    deviceFeatures: [],
    limits: [],
    unexpectedError: null,
  };

  try {
    const result = await initializeWebGPU();

    if (!result.ok) {
      // Marcamos como correctos los pasos anteriores al que falló.
      const failed: StageResult = { state: "failed", message: result.message };

      if (result.stage === "support") {
        diagnostic.support = failed;
      } else if (result.stage === "adapter") {
        diagnostic.support = SUPPORT_OK;
        diagnostic.adapter = failed;
      } else {
        diagnostic.support = SUPPORT_OK;
        diagnostic.adapter = ADAPTER_OK;
        diagnostic.device = failed;
      }

      // Si ya había adaptador, todavía podemos mostrar su información.
      if (result.adapter) {
        diagnostic.adapterInfo = readAdapterDescription(result.adapter);
        diagnostic.adapterFeatures = listFeatures(result.adapter.features);
        diagnostic.limits = readLimits(result.adapter.limits, null);
      }
      return diagnostic;
    }

    const { adapter, device } = result.context;
    diagnostic.support = SUPPORT_OK;
    diagnostic.adapter = ADAPTER_OK;
    diagnostic.device = DEVICE_OK;
    diagnostic.deviceReused = result.reused;
    diagnostic.adapterInfo = readAdapterDescription(adapter);
    diagnostic.adapterFeatures = listFeatures(adapter.features);
    diagnostic.deviceFeatures = listFeatures(device.features);
    diagnostic.limits = readLimits(adapter.limits, device.limits);
  } catch (error) {
    // Cualquier error que no esperábamos (por ejemplo, al leer propiedades).
    diagnostic.unexpectedError = describeError(error);
  }

  return diagnostic;
}
