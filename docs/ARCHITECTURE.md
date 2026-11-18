# Arquitectura

Solo existen las carpetas que se usan hoy; las demás se agregarán cuando una etapa las necesite.

```text
C:\proyecto_final
├── src/
│   ├── components/
│   │   ├── ProjectCard.ts
│   │   └── WebGPUDiagnostics.ts
│   ├── styles/
│   │   ├── main.css
│   │   └── diagnostics.css
│   ├── utils/
│   │   ├── environment.ts
│   │   ├── text.ts
│   │   ├── webgpuSupport.ts
│   │   ├── webgpuDevice.ts
│   │   ├── webgpuInfo.ts
│   │   └── webgpuDiagnostics.ts
│   ├── types/
│   │   ├── project.ts
│   │   └── webgpu.ts
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
| `src/components/` | Funciones que generan partes de la interfaz. | `ProjectCard.ts` (página inicial) y `WebGPUDiagnostics.ts` (diagnóstico). |
| `src/styles/` | Hojas de estilo CSS. | `main.css` (globales) y `diagnostics.css` (sección de diagnóstico). |
| `src/utils/` | Lógica y funciones auxiliares, sin HTML. | Módulos de WebGPU (ver más abajo), `environment.ts` y `text.ts`. |
| `src/types/` | Definiciones de tipos de TypeScript. | `project.ts` y `webgpu.ts`. |
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
                          └──monta──▶ components/WebGPUDiagnostics.ts  (etapa 2)
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

