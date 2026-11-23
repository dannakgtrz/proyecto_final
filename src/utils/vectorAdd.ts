// Lógica de cómputo para la suma vectorial en WebGPU y cálculo de referencia en CPU.

import shaderCode from "../shaders/vectorAdd.wgsl?raw";
import type { VectorAddResult } from "../types/vectorAdd";

// Tamaño del grupo de trabajo definido en el shader WGSL (@workgroup_size(64, 1, 1))
export const WORKGROUP_SIZE = 64;

/**
 * Cálculo de referencia ejecutado secuencialmente en la CPU mediante TypeScript.
 * Sirve como verdad terreno (ground truth) para validar la exactitud numérica de la GPU.
 */
export function cpuVectorAdd(a: Float32Array, b: Float32Array): Float32Array {
  if (a.length !== b.length) {
    throw new Error(
      `Los vectores deben tener la misma dimensión. A: ${a.length}, B: ${b.length}`,
    );
  }
  const result = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] + b[i];
  }
  return result;
}

/**
 * Compara los resultados numéricos de la GPU frente al valor esperado de la CPU.
 * Utiliza una tolerancia epsilon para contemplar posibles variaciones de precisión float32.
 */
export function compareVectors(
  gpuResult: Float32Array,
  expected: Float32Array,
  epsilon = 1e-5,
): { matches: boolean; maxDiff: number } {
  if (gpuResult.length !== expected.length) {
    return { matches: false, maxDiff: Infinity };
  }

  let maxDiff = 0;
  for (let i = 0; i < expected.length; i++) {
    const diff = Math.abs(gpuResult[i] - expected[i]);
    if (diff > maxDiff) {
      maxDiff = diff;
    }
    if (diff > epsilon) {
      return { matches: false, maxDiff };
    }
  }

  return { matches: true, maxDiff };
}

/**
 * Ejecuta la suma de dos vectores en la GPU mediante WebGPU y WGSL.
 *
 * Flujo completo:
 * 1. Creación de buffers (STORAGE y STAGING) con permisos mínimos.
 * 2. Transferencia de datos CPU -> GPU con writeBuffer().
 * 3. Compilación del shader WGSL con createShaderModule().
 * 4. Configuración del pipeline de cómputo y grupos de enlace (Bind Group).
 * 5. Despacho de invocaciones paralelas con dispatchWorkgroups().
 * 6. Copia GPU VRAM -> Staging Buffer con copyBufferToBuffer().
 * 7. Recuperación asíncrona a memoria de CPU con mapAsync() y getMappedRange().
 * 8. Liberación de recursos GPU con destroy().
 */
export async function executeVectorAddWebGPU(
  device: GPUDevice,
  vectorA: Float32Array,
  vectorB: Float32Array,
): Promise<VectorAddResult> {
  const elementCount = vectorA.length;
  if (elementCount !== vectorB.length) {
    throw new Error(
      `Dimensiones incompatibles: A tiene ${elementCount} elementos y B tiene ${vectorB.length}`,
    );
  }

  const byteLength = vectorA.byteLength;

  // 1. Cálculo de referencia en CPU
  const expected = cpuVectorAdd(vectorA, vectorB);

  // 2. Creación de buffers en la GPU:
  // - bufferA: STORAGE para que el shader lo lea, COPY_DST para recibir datos de la CPU.
  const bufferA = device.createBuffer({
    label: "Vector A Storage Buffer",
    size: byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  // - bufferB: STORAGE para que el shader lo lea, COPY_DST para recibir datos de la CPU.
  const bufferB = device.createBuffer({
    label: "Vector B Storage Buffer",
    size: byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  // - bufferC: STORAGE para que el shader escriba el resultado, COPY_SRC para permitir
  //   copiar su contenido hacia el staging buffer accesible por CPU.
  const bufferC = device.createBuffer({
    label: "Vector C Storage Buffer (Output)",
    size: byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  // - stagingBuffer: Búfer de paso en memoria mapeable.
  //   MAP_READ permite llamar a mapAsync(GPUMapMode.READ) desde la CPU.
  //   COPY_DST permite ser destino de la copia desde bufferC.
  const stagingBuffer = device.createBuffer({
    label: "Staging Result Buffer (Readback)",
    size: byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  try {
    const startTime = performance.now();

    // 3. Escribir los datos de entrada desde la CPU hacia la memoria de la GPU
    device.queue.writeBuffer(bufferA, 0, vectorA);
    device.queue.writeBuffer(bufferB, 0, vectorB);

    // 4. Crear el módulo del shader WGSL
    const shaderModule = device.createShaderModule({
      label: "Vector Addition Shader Module",
      code: shaderCode,
    });

    // 5. Crear el diseño del grupo de enlaces (Bind Group Layout) explícito
    // Esto documenta de forma clara la visibilidad en COMPUTE y los tipos de storage
    const bindGroupLayout = device.createBindGroupLayout({
      label: "Vector Add Bind Group Layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: "Vector Add Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    // 6. Crear el pipeline de cómputo
    const computePipeline = device.createComputePipeline({
      label: "Vector Add Compute Pipeline",
      layout: pipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: "main",
      },
    });

    // 7. Crear el Bind Group vinculando los buffers reales a los números de binding
    const bindGroup = device.createBindGroup({
      label: "Vector Add Bind Group",
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: bufferA } },
        { binding: 1, resource: { buffer: bufferB } },
        { binding: 2, resource: { buffer: bufferC } },
      ],
    });

    // 8. Codificación de comandos (Command Encoder)
    const commandEncoder = device.createCommandEncoder({
      label: "Vector Add Command Encoder",
    });

    const passEncoder = commandEncoder.beginComputePass({
      label: "Vector Add Compute Pass",
    });
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);

    // Cálculo del número de grupos de trabajo necesarios:
    // Por ejemplo, para 5 elementos con workgroup_size=64 -> ceil(5 / 64) = 1 workgroup
    // Para 1,000 elementos con workgroup_size=64 -> ceil(1000 / 64) = 16 workgroups (1,024 hilos)
    const workgroupsCount = Math.ceil(elementCount / WORKGROUP_SIZE);
    passEncoder.dispatchWorkgroups(workgroupsCount);
    passEncoder.end();

    // Copiamos los resultados del buffer de salida (VRAM) al búfer de staging accesible por la CPU
    commandEncoder.copyBufferToBuffer(bufferC, 0, stagingBuffer, 0, byteLength);

    // Finalizar grabación de comandos y enviarlos a la cola de la GPU
    const gpuCommandBuffer = commandEncoder.finish();
    device.queue.submit([gpuCommandBuffer]);

    // 9. Mapeo asíncrono para leer los datos en la CPU
    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const mappedArrayBuffer = stagingBuffer.getMappedRange();

    // Extraemos una copia de los datos antes de desmapear el búfer
    const resultGPU = new Float32Array(mappedArrayBuffer.slice(0));

    // Desmapeamos el búfer para devolver su control a la GPU
    stagingBuffer.unmap();

    const endTime = performance.now();
    const executionTimeMs = endTime - startTime;

    // 10. Validación numérica frente a la CPU
    const comparison = compareVectors(resultGPU, expected);

    return {
      vectorA,
      vectorB,
      expected,
      resultGPU,
      isValid: comparison.matches,
      maxDifference: comparison.maxDiff,
      elementCount,
      executionTimeMs,
      workgroupsDispatched: workgroupsCount,
      workgroupSize: WORKGROUP_SIZE,
      totalThreadsSpawned: workgroupsCount * WORKGROUP_SIZE,
      error: null,
    };
  } finally {
    // 11. Liberación inmediata de los buffers de la GPU para evitar fugas de memoria
    bufferA.destroy();
    bufferB.destroy();
    bufferC.destroy();
    stagingBuffer.destroy();
  }
}
