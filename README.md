# Implementación Vectorizada de Regresión Lineal en WebGPU y Evaluación de Rendimiento frente a TensorFlow

Proyecto final académico de maestría.

## Objetivo general

Implementar un algoritmo de regresión lineal vectorizada utilizando WebGPU y WGSL, y comparar su rendimiento frente a TensorFlow.

## Estado actual

**Etapa 2 completada: diagnóstico de WebGPU.**
La aplicación muestra una página inicial y una sección «Diagnóstico de WebGPU» que detecta el soporte del navegador, solicita el adaptador y el dispositivo GPU, y presenta sus características y límites. Todavía no incluye regresión lineal, shaders, TensorFlow ni benchmarking. Las etapas siguientes están en [docs/ROADMAP.md](docs/ROADMAP.md).

## Tecnologías

Usadas actualmente:

- Node.js y npm: ejecutan las herramientas y administran dependencias.
- TypeScript: JavaScript con tipos para detectar errores antes de ejecutar.
- Vite: servidor de desarrollo y empaquetador.
- HTML y CSS: estructura y estilo de la interfaz.

Previstas para etapas posteriores:

- WebGPU y WGSL (cómputo en GPU).
- TensorFlow.js (comparación).
- Python (implementación de referencia).
- Typst con plantilla Springer LNCS (artículo científico).

## Requisitos

- Node.js 20.19 o superior.
- npm.
- Un navegador moderno (Chrome o Edge).

Versiones con las que se desarrolló: ver [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

## Cómo ejecutar la aplicación

Desde la terminal de Visual Studio Code, en la carpeta del proyecto:

```powershell
cd C:\proyecto_final
npm install        # solo la primera vez: descarga las dependencias
npm run dev        # inicia el servidor de desarrollo
```

Abre en el navegador la dirección que muestra Vite, normalmente <http://localhost:5173/>.
Para detener el servidor, presiona `Ctrl + C`.

## Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con recarga automática. |
| `npm run typecheck` | Verifica los tipos de TypeScript sin generar archivos. |
| `npm run build` | Verifica los tipos y genera la versión final en `dist/`. |
| `npm run preview` | Sirve localmente la versión generada por `build`. |

## Estructura

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

