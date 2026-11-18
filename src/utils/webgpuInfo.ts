// Paso C: leer información técnica del adaptador y del dispositivo.
// Solo se lee lo que la API entrega. Nada se inventa ni se completa a mano.

import type { AdapterDescription, LimitEntry } from "../types/webgpu";

// Datos descriptivos del adaptador (fabricante, arquitectura, etc.).
// Por privacidad, muchos navegadores devuelven cadenas vacías: se conservan vacías.
export function readAdapterDescription(adapter: GPUAdapter): AdapterDescription {
  const info: GPUAdapterInfo | undefined = adapter.info;
  return {
    vendor: info?.vendor ?? "",
    architecture: info?.architecture ?? "",
    device: info?.device ?? "",
    description: info?.description ?? "",
  };
}

// Convierte el conjunto de características (features) en una lista ordenada.
export function listFeatures(features: GPUSupportedFeatures): string[] {
  return [...features].sort();
}

// Lee los límites. El objeto "limits" no es un diccionario normal: sus propiedades
// son atributos de la API. Se recorren con for...in y solo se conservan los números.
function readNumericLimits(limits: GPUSupportedLimits): Map<string, number> {
  const values = new Map<string, number>();
  const source = limits as unknown as Record<string, unknown>;
  for (const name in source) {
    const value = source[name];
    if (typeof value === "number") {
      values.set(name, value);
    }
  }
  return values;
}

// Combina los límites del adaptador (máximo que soporta la GPU) con los del
// dispositivo (los que realmente quedaron activos). Cualquiera puede faltar.
export function readLimits(
  adapterLimits: GPUSupportedLimits | null,
  deviceLimits: GPUSupportedLimits | null,
): LimitEntry[] {
  const adapterValues = adapterLimits ? readNumericLimits(adapterLimits) : new Map<string, number>();
  const deviceValues = deviceLimits ? readNumericLimits(deviceLimits) : new Map<string, number>();

  const names = new Set([...adapterValues.keys(), ...deviceValues.keys()]);
  return [...names].sort().map((name) => ({
    name,
    deviceValue: deviceValues.get(name) ?? null,
    adapterValue: adapterValues.get(name) ?? null,
  }));
}

