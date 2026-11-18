// Describe el entorno de desarrollo usando solo lo que Vite ya nos informa.
// No consulta WebGPU: eso se hará en la etapa 2.
export function getEnvironmentStatus(): string {
  const mode = import.meta.env.MODE; // "development" con npm run dev
  return `Vite + TypeScript en ejecución (modo ${mode})`;
}

