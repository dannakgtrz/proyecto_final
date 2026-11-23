// Declaraciones de tipos globales para namespaces y constantes de WebGPU
// según la especificación formal de la W3C.
// Evita dependencias externas y asegura compatibilidad estricta con TypeScript.

declare global {
  interface GPUBufferUsageFlags {
    readonly MAP_READ: number;
    readonly MAP_WRITE: number;
    readonly COPY_SRC: number;
    readonly COPY_DST: number;
    readonly INDEX: number;
    readonly VERTEX: number;
    readonly UNIFORM: number;
    readonly STORAGE: number;
    readonly INDIRECT: number;
    readonly QUERY_RESOLVE: number;
  }

  interface GPUShaderStageFlags {
    readonly VERTEX: number;
    readonly FRAGMENT: number;
    readonly COMPUTE: number;
  }

  interface GPUMapModeFlags {
    readonly READ: number;
    readonly WRITE: number;
  }

  var GPUBufferUsage: GPUBufferUsageFlags;
  var GPUShaderStage: GPUShaderStageFlags;
  var GPUMapMode: GPUMapModeFlags;
}

export {};
