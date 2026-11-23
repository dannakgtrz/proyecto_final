// Tipos de datos para la operación de suma vectorial en WebGPU.

export interface VectorAddResult {
  // Vectores originales de entrada
  vectorA: Float32Array;
  vectorB: Float32Array;

  // Resultado de referencia calculado en CPU (TypeScript)
  expected: Float32Array;

  // Resultado recuperado de la GPU tras la ejecución del shader WGSL
  resultGPU: Float32Array;

  // Estado de validación numérica (¿el resultado de la GPU coincide con la CPU?)
  isValid: boolean;

  // Diferencia absoluta máxima detectada entre CPU y GPU
  maxDifference: number;

  // Cantidad total de elementos procesados
  elementCount: number;

  // Tiempo total de ejecución de la prueba en milisegundos (CPU -> GPU -> CPU)
  // Nota: Este valor es informativo para pruebas locales, no un benchmark formal.
  executionTimeMs: number;

  // Parámetros de paralelización en la GPU
  workgroupsDispatched: number;
  workgroupSize: number;
  totalThreadsSpawned: number;

  // Mensaje de error si la ejecución falló
  error: string | null;
}
