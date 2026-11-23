// ============================================================================
// Shader de Cómputo WGSL: Suma Vectorial Paralela (C = A + B)
// ============================================================================
// En WebGPU, un shader de cómputo es un programa que se ejecuta de forma
// masivamente paralela en los núcleos de la GPU.
//
// Los arreglos de tamaño dinámico (runtime-sized arrays) en memoria de
// almacenamiento (storage) deben encapsularse como el último campo de una estructura.

struct VectorBuffer {
    values: array<f32>,
};

// ----------------------------------------------------------------------------
// Declaración de buffers de enlace (Binding Group 0):
// - binding(0): Vector de entrada A (modo sólo lectura: read)
// - binding(1): Vector de entrada B (modo sólo lectura: read)
// - binding(2): Vector de salida C (modo lectura y escritura: read_write)
// ----------------------------------------------------------------------------
@group(0) @binding(0) var<storage, read> vectorA: VectorBuffer;
@group(0) @binding(1) var<storage, read> vectorB: VectorBuffer;
@group(0) @binding(2) var<storage, read_write> vectorC: VectorBuffer;

// ----------------------------------------------------------------------------
// Punto de entrada de cómputo (@compute).
// @workgroup_size(64, 1, 1):
// Define que cada grupo de trabajo (workgroup) contendrá 64 invocaciones (hilos)
// organizadas en una dimensión. Las dimensiones Y y Z son 1 por defecto.
// ----------------------------------------------------------------------------
@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    // global_id.x contiene el índice lineal global único asignado a este hilo
    // a lo largo de todos los grupos de trabajo despachados.
    let index: u32 = global_id.x;

    // Control de límites (Boundary Check):
    // Dado que los grupos de trabajo se despachan en múltiplos del tamaño del grupo (64),
    // si el arreglo tiene 5 elementos se despacha 1 grupo (64 hilos).
    // Los hilos con index >= 5 deben descartarse inmediatamente para evitar
    // lecturas o escrituras fuera de rango en la memoria de la GPU.
    if (index >= arrayLength(&vectorA.values)) {
        return;
    }

    // Operación matemática elemental ejecutada en paralelo:
    // C[i] = A[i] + B[i]
    vectorC.values[index] = vectorA.values[index] + vectorB.values[index];
}
