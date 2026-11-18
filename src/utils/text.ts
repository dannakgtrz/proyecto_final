// Utilidades de texto compartidas.

// Convierte cualquier error capturado en un mensaje legible.
// En un bloque catch, el error tiene tipo "unknown": no sabemos qué es hasta revisarlo.
export function describeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

// Reemplaza caracteres especiales de HTML. Los textos que vienen del navegador
// (descripción del adaptador, mensajes de error) se escapan antes de insertarlos
// con innerHTML, para que nunca se interpreten como código HTML.
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

