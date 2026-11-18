// Paso B: obtener el adaptador y el dispositivo GPU.
//
//   navigator.gpu ──requestAdapter()──▶ GPUAdapter ──requestDevice()──▶ GPUDevice
//
// - El adaptador representa la GPU física (o una implementación por software).
// - El dispositivo es la conexión lógica que usaremos para trabajar con la GPU.

import type { FailureStage, InitResult, WebGPUContext } from "../types/webgpu";
import { describeError } from "./text";
import { checkWebGPUSupport } from "./webgpuSupport";

// Guardamos el contexto en una variable del módulo para no inicializar
// WebGPU más de una vez. Solo se guardan inicializaciones exitosas.
let cachedContext: WebGPUContext | null = null;

function fail(
  stage: FailureStage,
  message: string,
  adapter: GPUAdapter | null = null,
): InitResult {
  return { ok: false, stage, message, adapter };
}

export async function initializeWebGPU(): Promise<InitResult> {
  // 0. Si ya hay un dispositivo válido, lo reutilizamos.
  if (cachedContext) {
    return { ok: true, context: cachedContext, reused: true };
  }

  // 1. ¿Existe navigator.gpu?
  const support = checkWebGPUSupport();
  if (!support.supported) {
    return fail("support", support.message);
  }
  const gpu = navigator.gpu;

  // 2. Solicitar el adaptador. Devuelve null si no hay una GPU utilizable.
  let adapter: GPUAdapter | null;
  try {
    adapter = await gpu.requestAdapter();
  } catch (error) {
    return fail("adapter", `requestAdapter() lanzó un error. ${describeError(error)}`);
  }
  if (adapter === null) {
    return fail(
      "adapter",
      "requestAdapter() devolvió null: el navegador no encontró un adaptador gráfico compatible (controlador no compatible, GPU deshabilitada o lista de bloqueo del navegador).",
    );
  }

  // 3. Solicitar el dispositivo. Sin argumentos: sin características opcionales
  //    y con los límites por defecto.
  let device: GPUDevice;
  try {
    device = await adapter.requestDevice();
  } catch (error) {
    return fail("device", `requestDevice() lanzó un error. ${describeError(error)}`, adapter);
  }

  // 4. Si el dispositivo se pierde (por ejemplo, se reinicia el controlador),
  //    se borra la caché para que el siguiente diagnóstico lo cree de nuevo.
  void device.lost.then((info) => {
    console.warn(`Dispositivo WebGPU perdido (${info.reason}): ${info.message}`);
    if (cachedContext?.device === device) {
      cachedContext = null;
    }
  });

  cachedContext = { gpu, adapter, device };
  return { ok: true, context: cachedContext, reused: false };
}

