// Un "tipo" describe la forma de un objeto. TypeScript lo usa para avisarnos
// de errores antes de ejecutar el programa (por ejemplo, un campo faltante).
export interface ProjectInfo {
  title: string;
  subtitle: string;
  projectType: string;
  environmentStatus: string;
  version: string;
  status: string;
}

