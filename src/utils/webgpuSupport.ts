// Paso A: ¿el navegador ofrece la API WebGPU?
// Solo comprueba si existe navigator.gpu. No pide adaptador ni dispositivo.

export interface SupportCheck {
  supported: boolean;
  message: string;
}

export function checkWebGPUSupport(): SupportCheck {
  const hasGpu = "gpu" in navigator && Boolean(navigator.gpu);

  if (hasGpu) {
    return { supported: true, message: "navigator.gpu está disponible." };
  }

  // WebGPU solo se expone en "contextos seguros": HTTPS o localhost.
  if (!window.isSecureContext) {
    return {
      supported: false,
      message:
        "navigator.gpu no existe porque la página no se sirve en un contexto seguro. Use HTTPS o http://localhost.",
    };
  }

  return {
    supported: false,
    message:
      "Este navegador no expone navigator.gpu. Puede que sea una versión sin soporte de WebGPU o que esté desactivado.",
  };
}

