# Hoja de ruta

Plan de etapas del proyecto. Las etapas 1 y 2 están realizadas; las demás son planes y no están implementadas.

| # | Etapa | Estado |
|---|---|---|
| 1 | Preparación del entorno y estructura base | Completada |
| 2 | Introducción a WebGPU y detección del dispositivo GPU | Completada |
| 3 | Administración de memoria y buffers | Pendiente |
| 4 | Implementación de shaders WGSL | Pendiente |
| 5 | Regresión lineal y descenso de gradiente | Pendiente |
| 6 | Implementación vectorizada | Pendiente |
| 7 | Integración de TensorFlow.js | Pendiente |
| 8 | Implementación de referencia en Python | Pendiente |
| 9 | Benchmarking y evaluación experimental | Pendiente |
| 10 | Visualización de resultados | Pendiente |
| 11 | Artículo científico Springer LNCS con Typst | Pendiente |
| 12 | Preparación de la presentación final | Pendiente |

## Descripción de las etapas

1. **Preparación del entorno y estructura base.** Herramientas verificadas, proyecto Vite + TypeScript, carpetas, página inicial y documentación.
2. **Introducción a WebGPU y detección del dispositivo GPU.** Comprobar que el navegador soporta WebGPU y obtener información del adaptador y dispositivo. *Realizada: diagnóstico en pantalla y pruebas documentadas en `ENVIRONMENT.md`.*
3. **Administración de memoria y buffers.** Crear buffers en la GPU y transferir datos entre CPU y GPU.
4. **Implementación de shaders WGSL.** Escribir los primeros programas de cómputo en WGSL y ejecutarlos.
5. **Regresión lineal y descenso de gradiente.** Definir el modelo, la función de pérdida y el algoritmo de entrenamiento.
6. **Implementación vectorizada.** Llevar el entrenamiento a la GPU con operaciones sobre vectores y matrices.
7. **Integración de TensorFlow.js.** Implementar el mismo problema en TensorFlow.js como punto de comparación.
8. **Implementación de referencia en Python.** Crear una versión de referencia para validar los resultados.
9. **Benchmarking y evaluación experimental.** Diseñar y ejecutar mediciones de rendimiento reproducibles.
10. **Visualización de resultados.** Presentar los resultados medidos con tablas y gráficas.
11. **Artículo científico Springer LNCS con Typst.** Redactar el artículo con la plantilla LNCS.
12. **Preparación de la presentación final.** Preparar la presentación de defensa del proyecto.

> Cada etapa se iniciará solo después de aprobar la anterior. Este plan puede ajustarse conforme avance el proyecto.

