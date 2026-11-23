# Arquitectura

Solo existen las carpetas que se usan hoy; las demás se agregarán cuando una etapa las necesite.

```text
C:\proyecto_final
├── src/
│   ├── components/
│   │   ├── ProjectCard.ts
│   │   ├── WebGPUDiagnostics.ts
│   │   └── VectorAddDemo.ts
│   ├── shaders/
│   │   └── vectorAdd.wgsl
│   ├── styles/
│   │   ├── main.css
│   │   ├── diagnostics.css
│   │   └── vectorAdd.css
│   ├── utils/
│   │   ├── environment.ts
│   │   ├── text.ts
│   │   ├── webgpuSupport.ts
│   │   ├── webgpuDevice.ts
│   │   ├── webgpuInfo.ts
│   │   ├── webgpuDiagnostics.ts
│   │   └── vectorAdd.ts
│   ├── types/
│   │   ├── project.ts
│   │   ├── webgpu.ts
│   │   ├── webgpu-globals.d.ts
│   │   └── vectorAdd.ts
│   └── main.ts
├── public/
├── docs/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md
```

## Responsabilidad de cada directorio

| Directorio | Responsabilidad | Contenido actual |
|---|---|---|
| `src/` | Todo el código fuente de la aplicación. | — |
| `src/components/` | Funciones que generan partes de la interfaz. | `ProjectCard.ts` (página inicial), `WebGPUDiagnostics.ts` (diagnóstico) y `VectorAddDemo.ts` (suma vectorial). |
| `src/shaders/` | Código de shaders en WGSL ejecutados en la GPU. | `vectorAdd.wgsl` (shader de cómputo para suma vectorial). |
| `src/styles/` | Hojas de estilo CSS. | `main.css` (globales), `diagnostics.css` (diagnóstico) y `vectorAdd.css` (operación paralela). |
| `src/utils/` | Lógica y funciones auxiliares, sin HTML. | Módulos de WebGPU, `vectorAdd.ts` (pipeline y CPU ref), `environment.ts` y `text.ts`. |
| `src/types/` | Definiciones de tipos de TypeScript. | `project.ts`, `webgpu.ts`, `webgpu-globals.d.ts` y `vectorAdd.ts`. |
| `public/` | Archivos estáticos que se sirven tal cual, sin procesar. | `favicon.svg`. |
| `docs/` | Documentación del proyecto. | Entorno, arquitectura y hoja de ruta. |

## Archivos de la raíz

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Punto de entrada. Contiene `<div id="app">` y carga `src/main.ts`. |
| `src/main.ts` | Punto de entrada del código. Reúne los datos y dibuja la página. |
| `package.json` | Nombre, versión, scripts y dependencias. |
| `tsconfig.json` | Reglas del compilador de TypeScript. |
| `vite.config.ts` | Configuración de Vite. |
| `.gitignore` | Archivos que Git no debe versionar (`node_modules/`, `dist/`). |
| `README.md` | Presentación del proyecto y cómo ejecutarlo. |

## Flujo de la página inicial

```text
index.html ──carga──▶ src/main.ts ──usa──▶ utils/environment.ts
                          │
                          ├──usa──▶ components/ProjectCard.ts  (genera el HTML)
                          ├──usa──▶ types/project.ts           (forma de los datos)
                          ├──importa──▶ styles/main.css
                          ├──monta──▶ components/WebGPUDiagnostics.ts  (etapa 2)
                          └──monta──▶ components/VectorAddDemo.ts      (etapa 3)
```

## Integración de WebGPU (etapa 2)

WebGPU es una API del navegador, así que no se instaló ninguna dependencia: TypeScript ya incluye sus tipos (`GPU`, `GPUAdapter`, `GPUDevice`...).

### Flujo desde el navegador hasta el dispositivo GPU

```text
navigator.gpu                    ¿el navegador ofrece WebGPU?        (webgpuSupport.ts)
     │  existe
     ▼
requestAdapter()  ──▶ GPUAdapter   la GPU física o su implementación (webgpuDevice.ts)
     │  no es null
     ▼
requestDevice()   ──▶ GPUDevice    conexión lógica para trabajar     (webgpuDevice.ts)
     │
     ▼
lectura de info, features y limits                                   (webgpuInfo.ts)
     │
     ▼
objeto WebGPUDiagnostic  ──▶  pantalla                               (WebGPUDiagnostics.ts)
```

- **`navigator.gpu`**: punto de entrada. Si no existe, no hay WebGPU en ese navegador o contexto.
- **Adaptador**: representa la GPU. `requestAdapter()` devuelve `null` (sin lanzar error) cuando no hay una GPU utilizable.
- **Dispositivo**: es el objeto con el que se crearán buffers y se ejecutará trabajo en la GPU en etapas futuras.
- **Features y limits**: el adaptador informa lo máximo que soporta la GPU. El dispositivo solo tiene activado lo que se pidió al crearlo; sin argumentos, recibe los límites por defecto.

### Responsabilidad de cada módulo

| Módulo | Responsabilidad |
|---|---|
| `types/webgpu.ts` | Define los tipos: resultado de cada paso, contexto (`gpu`, `adapter`, `device`), resultado de la inicialización y el diagnóstico completo. |
| `utils/webgpuSupport.ts` | `checkWebGPUSupport()`: comprueba si existe `navigator.gpu` y explica la causa probable si no. |
| `utils/webgpuDevice.ts` | `initializeWebGPU()`: pide adaptador y dispositivo, captura errores y guarda el contexto en caché para no inicializar dos veces. Si el dispositivo se pierde, borra la caché. |
| `utils/webgpuInfo.ts` | Lee descripción del adaptador, features y límites. Solo devuelve lo que la API entrega. |
| `utils/webgpuDiagnostics.ts` | `runDiagnostics()`: ejecuta los pasos anteriores y los reúne en un `WebGPUDiagnostic`. No maneja HTML. |
| `utils/text.ts` | `describeError()` convierte errores en texto y `escapeHtml()` evita que el texto del navegador se interprete como HTML. |
| `components/WebGPUDiagnostics.ts` | Dibuja el diagnóstico y gestiona el botón «Volver a ejecutar». No conoce los detalles de la API de WebGPU. |
| `styles/diagnostics.css` | Estilos de la sección, separados de la lógica. |

### Decisiones de diseño

- **Un solo resultado intermedio** (`WebGPUDiagnostic`): la lógica produce datos y la interfaz los dibuja. Se puede cambiar la interfaz sin tocar la lógica.
- **Los errores no se lanzan hacia la interfaz:** cada paso devuelve un resultado `ok` o `failed`, con el paso donde falló.
- **El dispositivo se crea una sola vez** y se reutiliza. Las etapas siguientes usarán `initializeWebGPU()` para obtenerlo.
- **No se escribe ningún dato inventado:** si el navegador no da un valor, la interfaz lo indica.

## Decisiones de diseño

- **Sin framework:** TypeScript con funciones simples basta para esta etapa. Es más fácil de entender.
- **Sin dependencias de ejecución:** solo `vite` y `typescript`, ambas de desarrollo.
- **Carpetas por responsabilidad:** separar código, estilos, tipos y utilidades facilita crecer sin desorden.



## Primer shader de cómputo en WGSL (etapa 3)

La etapa 3 implementa la primera operación matemática paralela ejecutada directamente en la GPU: la suma de vectores element-wise ($C = A + B$).

### Flujo de ejecución del cómputo paralelo

```text
[CPU Host: TypeScript]
   │
   ├── 1. Prepara vectores en memoria principal (Float32Array)
   ├── 2. Crea GPUBuffer (STORAGE, COPY_DST, COPY_SRC, MAP_READ)
   ├── 3. Transfiere datos a la VRAM: device.queue.writeBuffer()
   ├── 4. Compila shader WGSL: device.createShaderModule()
   ├── 5. Define BindGroupLayout y crea ComputePipeline
   ├── 6. Vincula buffers reales: device.createBindGroup()
   ├── 7. Graba comandos en CommandEncoder (beginComputePass -> dispatchWorkgroups)
   ├── 8. Ordena copia GPU->Staging: copyBufferToBuffer()
   ├── 9. Envía comandos a la GPU: device.queue.submit()
   │
[GPU Device: WGSL Compute Shader]
   │  Despacho masivo en paralelo:
   │  N invocaciones concurrentes distribuidas en workgroups de 64 hilos.
   │  Cada hilo calcula: vectorC[global_id.x] = vectorA[global_id.x] + vectorB[global_id.x]
   │
[CPU Host: Lectura Asíncrona]
   │
   ├── 10. Mapea staging buffer: stagingBuffer.mapAsync(GPUMapMode.READ)
   ├── 11. Lee rango de memoria: stagingBuffer.getMappedRange()
   ├── 12. Clona a Float32Array y desmapea: stagingBuffer.unmap()
   ├── 13. Destruye buffers para liberar VRAM: buffer.destroy()
   └── 14. Valida numéricamente frente al cálculo de referencia en TypeScript.
```

### Modelo de memoria y buffers

En WebGPU la memoria de la GPU no es directamente legible por la CPU si se encuentra configurada para operaciones de cómputo de alta velocidad (VRAM dedicada). Por ello se utilizan dos categorías de búferes:

1. **Storage Buffers (VRAM interna de la GPU):**
   - `vectorA` y `vectorB`: `GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST`. El shader los lee (`var<storage, read>`) y la CPU escribe en ellos al inicio (`writeBuffer`).
   - `vectorC`: `GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC`. El shader escribe en él (`var<storage, read_write>`) y la GPU permite usarlo como origen de copia hacia el staging buffer.

2. **Staging Buffer (Búfer de paso accesible por la CPU):**
   - `stagingBuffer`: `GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST`. No puede ser enlazado directamente a un compute shader, pero permite el mapeo asíncrono hacia el espacio de direcciones de JavaScript mediante `mapAsync()`.

### Jerarquía de ejecución paralela: Invocaciones y Workgroups

- **Invocación (Invocation / Thread):** La ejecución individual del shader para un único elemento. Cada invocación obtiene su índice unívoco mediante `@builtin(global_invocation_id) global_id: vec3<u32>`.
- **Grupo de trabajo (Workgroup):** Conjunto cooperativo de hilos que se ejecutan juntos en la misma unidad de cómputo (Compute Unit). Se definió `@workgroup_size(64, 1, 1)`.
- **Despacho (Dispatch):** Se calcula $\lceil N / 64 \rceil$. Para $N=5$ se despacha 1 grupo (64 hilos creados). El control de límites `if (index >= arrayLength(&vectorA.values)) return;` descarta inmediatamente las 59 invocaciones sobrantes. Para $N=1000$ se despachan 16 grupos (1024 hilos creados).
