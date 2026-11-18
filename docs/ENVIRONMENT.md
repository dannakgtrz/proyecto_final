# Entorno de desarrollo

Versiones detectadas el 17/11/2026 desde la terminal. No se instaló, actualizó ni desinstaló ninguna herramienta del sistema.

## Herramientas del sistema (detectadas)

| Herramienta | Versión | Compatibilidad |
|---|---|---|
| Sistema operativo | Windows 11 Home, 10.0.26200, 64 bits | Compatible |
| Node.js | v24.13.0 | Compatible (Vite 8 requiere 20.19+ o 22.12+) |
| npm | 11.6.2 | Compatible (hay una versión más nueva, 11.21.2; no es necesario actualizar) |
| Git | 2.53.0.windows.1 | Compatible |
| Visual Studio Code | 1.145.2 (x64) | Compatible |
| Google Chrome | 157.0.8103.79 | Compatible (WebGPU incluido por defecto) |
| Microsoft Edge | 157.0.4341.60 | Compatible (WebGPU incluido por defecto) |

## Dependencias del proyecto (instaladas con `npm install`)

Ambas son dependencias de desarrollo (`devDependencies`).

| Paquete | Versión instalada | Para qué sirve |
|---|---|---|
| vite | 8.3.8 | Servidor de desarrollo y empaquetador |
| typescript | 7.0.2 | Compilador y verificador de tipos |

## Verificaciones realizadas

- `npm install`: correcto (17 paquetes añadidos).
- `npm run typecheck`: sin errores.
- `npm run build`: correcto.
- `npm run dev`: Vite inicia en <http://localhost:5173/>.

## Observaciones

- **Aviso de `npm audit`:** reporta 4 vulnerabilidades de severidad alta, todas en una cadena de dependencias de Vite (`picomatch`, `fdir`, `tinyglobby`). Es una vulnerabilidad de ReDoS al procesar patrones glob. Solo afecta herramientas de desarrollo, no la aplicación que se publica. La corrección automática (`npm audit fix --force`) instalaría Vite 6.2.7, una versión anterior. No se aplicó. Conviene revisarlo más adelante, cuando salga una versión corregida.
- **Repositorio Git:** `C:\proyecto_final` no es un repositorio. Existe una subcarpeta `C:\proyecto_final\proyecto_final\` con un `.git` y un `.gitattributes` que no forman parte del proyecto; conviene revisarla y decidir dónde debe estar el repositorio.
- **WebGPU:** comprobado en la etapa 2. Ver las secciones siguientes.

## Requisitos para utilizar WebGPU (etapa 2)

WebGPU es una API del navegador: no requiere instalar ninguna biblioteca. Para que funcione hacen falta cuatro cosas:

1. **Un navegador que la implemente y la tenga activada.** Es la causa más común de fallo.
2. **Un contexto seguro.** La página debe servirse por HTTPS o desde `localhost`. En otro caso `navigator.gpu` no existe. Vite en `http://localhost:5173/` cumple este requisito.
3. **Una GPU con controlador compatible.** El navegador la traduce a la API gráfica nativa del sistema (en Windows, normalmente Direct3D 12). Si el controlador es antiguo o está en la lista de bloqueo del navegador, `requestAdapter()` devuelve `null`.
4. **Aceleración por hardware activada en el navegador.**

### Navegadores

La disponibilidad **depende de la versión del navegador, del sistema operativo y del hardware**. Esta tabla es orientativa; debe confirmarse con el diagnóstico de la aplicación y con la documentación oficial de cada navegador.

| Navegador | Situación general |
|---|---|
| Google Chrome / Microsoft Edge (Chromium) | Soportan WebGPU en las versiones recientes de escritorio. Es el entorno de desarrollo de este proyecto. |
| Firefox | El soporte varía según versión y plataforma. No se probó en este proyecto. |
| Safari | El soporte varía según versión y sistema. No se probó en este proyecto. |

### Recomendaciones para ejecutar el proyecto

- Usar Chrome o Edge actualizados y abrir `http://localhost:5173/` (o el puerto que indique Vite).
- Mantener actualizado el controlador de la tarjeta gráfica.
- Confirmar que la aceleración por hardware esté activada en la configuración del navegador.
- Si el diagnóstico falla, revisar `chrome://gpu` (o `edge://gpu`) para ver el estado de WebGPU.
- Ejecutar siempre los benchmarks futuros en el mismo equipo y navegador, para que los resultados sean comparables.

## Resultados de las pruebas de la etapa 2

Las pruebas se hicieron el 17/11/2026 con **Chrome 157 en modo headless** (sin ventana), controlado desde un script mediante el protocolo de depuración de Chrome. El equipo usa Windows 11; según el sistema operativo, su tarjeta gráfica es una Intel Iris Xe.

| Prueba | Resultado |
|---|---|
| `navigator.gpu` | Disponible. |
| `requestAdapter()` | Devolvió un adaptador. |
| `requestDevice()` | Creó el dispositivo. |
| Segunda ejecución del diagnóstico (botón) | Reutilizó el dispositivo; no se inicializó de nuevo. |
| Consola del navegador | Solo mensajes informativos de Vite; sin errores ni advertencias. |
| `npm run typecheck` y `npm run build` | Sin errores. |

Información que reportó el navegador:

| Dato | Valor |
|---|---|
| `vendor` | `intel` |
| `architecture` | `gen-12lp` |
| `device` y `description` | Cadenas vacías (el navegador no las proporciona). |
| Características del adaptador | 21 |
| Características del dispositivo | 1 (`core-features-and-limits`) |
| Límites | 36 valores numéricos |

### Pruebas de manejo de errores

| Caso | Cómo se produjo | Resultado en la interfaz |
|---|---|---|
| Adaptador no disponible | Chrome con `--disable-gpu` (**real**) | `requestAdapter()` devolvió `null`. Paso 2 en rojo y paso 3 «No evaluado». |
| Sin `navigator.gpu` | **Simulado:** el script de prueba ocultó la propiedad | Paso 1 en rojo; pasos 2 y 3 «No evaluado». |
| `requestAdapter()` lanza error | **Simulado:** el script de prueba lo hizo fallar | Paso 2 en rojo con el mensaje del error. |
| `requestDevice()` lanza error | **Simulado:** el script de prueba lo hizo fallar | Paso 3 en rojo con el mensaje del error. |

Solo el caso del adaptador no disponible ocurrió realmente en el navegador; los otros tres se simularon para ejercitar nuestro código, porque este equipo sí tiene WebGPU. No se probó el caso de «contexto no seguro».

### Limitaciones encontradas

- **Los límites del dispositivo son menores que los del adaptador.** Si `requestDevice()` no pide límites, se obtienen los valores por defecto. Por ejemplo, `maxBufferSize` fue 268.435.456 en el dispositivo y 2.147.483.648 en el adaptador. Si una etapa futura necesita más, deberá pedirlo al crear el dispositivo.
- **El navegador oculta datos del adaptador.** `device` y `description` llegaron vacíos. La aplicación muestra «No proporcionado por el navegador» y no inventa nada.
- **Las pruebas no se hicieron en una ventana visible**, sino en Chrome headless. Usa el mismo motor, pero conviene confirmar visualmente en tu navegador.
- **Solo se probó un equipo, un navegador y una GPU.** Los resultados no son generalizables.
- **Herramientas de captura:** con `--dump-dom` y `--screenshot` de Chrome el diagnóstico a veces aparecía sin terminar, porque esas opciones no esperan a la GPU. Por eso se usó el protocolo de depuración, que sí espera. No es un fallo de la aplicación.
- **Puerto 5173 ocupado** durante las pruebas: Vite usó el 5174 automáticamente.

