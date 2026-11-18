// Tipos del diagnóstico de WebGPU.
// Los tipos GPU, GPUAdapter y GPUDevice ya vienen incluidos en TypeScript.

// Estado de cada paso del diagnóstico:
//  - ok:      el paso se completó correctamente.
//  - failed:  el paso falló.
//  - skipped: no se intentó porque un paso anterior falló.
export type StageState = "ok" | "failed" | "skipped";

export interface StageResult {
  state: StageState;
  message: string;
}

// Paso en el que puede fallar la inicialización.
export type FailureStage = "support" | "adapter" | "device";

// Referencias que guardamos para usar en etapas futuras.
export interface WebGPUContext {
  gpu: GPU;
  adapter: GPUAdapter;
  device: GPUDevice;
}

// Resultado de initializeWebGPU(): éxito, o fallo indicando en qué paso ocurrió.
export type InitResult =
  | { ok: true; context: WebGPUContext; reused: boolean }
  | { ok: false; stage: FailureStage; message: string; adapter: GPUAdapter | null };

// Datos descriptivos del adaptador. Cada campo es "" si el navegador no lo proporciona.
export interface AdapterDescription {
  vendor: string;
  architecture: string;
  device: string;
  description: string;
}

// Un límite de WebGPU. Cada valor es null si no aplica (por ejemplo, no hay dispositivo).
export interface LimitEntry {
  name: string;
  deviceValue: number | null;
  adapterValue: number | null;
}

// Resultado completo del diagnóstico: lo que la interfaz necesita para dibujarse.
export interface WebGPUDiagnostic {
  checkedAt: Date;
  secureContext: boolean;
  support: StageResult;
  adapter: StageResult;
  device: StageResult;
  deviceReused: boolean;
  adapterInfo: AdapterDescription | null;
  adapterFeatures: string[];
  deviceFeatures: string[];
  limits: LimitEntry[];
  unexpectedError: string | null;
}

