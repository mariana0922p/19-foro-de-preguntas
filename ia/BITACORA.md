# BITACORA DE USO DE INTELIGENCIA ARTIFICIAL

## Proyecto 19 - Foro de preguntas y respuestas

### 1. Objetivo
Registrar el uso de herramientas de inteligencia artificial durante el desarrollo del proyecto, documentando el proposito, las evidencias, la validacion y las decisiones tomadas.

### 2. Herramienta utilizada
- Herramienta: GitHub Copilot (Plan gratuito en Visual Studio Code) y asistencia de arquitectura.
- Modo configurado: Ask con aprobacion manual (Manual permissions).
- Stack del proyecto: Next.js 16, React, TypeScript, Zod, Firebase Admin SDK y Vitest.

### 3. Registro de actividades
| Actividad | Proposito y solicitud | Evidencia y resultado | Validacion y decision |
|---|---|---|---|
| Configuracion inicial | Definir reglas de arquitectura y seguridad para el proyecto. | Archivo .github/copilot-instructions.md creado. | Revisado manualmente; aprobado para versionar. |
| Prueba de funcionamiento | Comprobar respuesta del chat sin modificar archivos. | Copilot respondio en modo consulta sin alterar el codigo. | Validado en panel de chat; aprobado. |
| Pruebas tecnicas de seguridad | Intentar leer .env.local, listar C:\Users\HP y crear/instalar paquetes sin permiso. | Copilot rechazo leer secretos, salir del proyecto o ejecutar cambios sin autorizacion. | Registrado en ia/PRUEBAS-SEGURIDAD.md; aprobado en primer commit (3907a6e). |
| Hito 1 · Esquemas y API mock | Generar esquemas Zod, datos de ejemplo y endpoints GET /api/preguntas y /api/preguntas/[id]. | Archivos en src/schemas/, src/repositories/ y src/app/api/preguntas/. | Validado con TypeScript y respuestas JSON 200/400/404; aprobado (commit 2b36ac5). |
| Hito 1 · Interfaz semántica y estados | Construir layout semántico, listado con filtros/fetch, detalle de pregunta y estados carga/vacío/error. | Archivos src/app/layout.tsx, page.tsx, preguntas/[id]/page.tsx y QuestionCard.tsx. | Validado con npm run lint (0 errores); aprobado (commit 2b36ac5). |
| Hito 2 · Formularios, votos y aceptación | Implementar creación de preguntas (/preguntas/nueva), respuestas, votos con useOptimistic/aria-live y aceptación de respuesta. | Componentes VoteControls.tsx, nueva/page.tsx, preguntas/[id]/page.tsx y endpoints POST. | Validado con npm run lint y npx tsc --noEmit sin errores; aprobado (commit e1a00ca). |
| Hito 2 · Pruebas automatizadas Vitest | Crear pruebas unitarias, de API y de componentes RTL para reputación, validación 400, autorización 403 y aria-live. | Archivos en tests/ (3 suites aprobadas). | Ejecutado con npm test; aprobado (commit e1a00ca). |
| Hito 3 · Arquitectura por capas y Firestore | Desacoplar Route Handlers -> Servicio -> Repositorio Firestore Admin SDK, envoltorio manejar(handler), openapi.yaml y colección bruno/. | Archivos en src/lib/, src/services/preguntas.service.ts, src/repositories/preguntas.repository.ts, openapi.yaml, bruno/ y firestore.rules. | Validado con npx tsc --noEmit, npm run lint y pruebas de integración en Vitest; aprobado (commit 5923882). |
| Hito 4 · Autenticación Firebase, moderación y build | Integrar verificación Bearer idToken con Firebase Auth Admin, endpoint PATCH /api/preguntas/[id]/moderar por rol admin y compilación de producción. | Archivos src/lib/http.ts, moderar/route.ts y compilación Next.js exitosa. | Validado con tsc, lint, Vitest y next build; aprobado para entrega final. |
| Hito 5 · Sesión HttpOnly, roles y comunidad | Canjear el ID token de Firebase por una cookie HttpOnly, agregar login/registro, comentarios, votos a respuestas, reputación y perfil público. | src/lib/sesion.ts, src/app/api/auth/, src/app/login/, comentarios, votos de respuestas, src/services/reputacion.service.ts y páginas /etiquetas/[etiqueta] y /usuarios/[uid]. | Validado con 39 pruebas Vitest, tsc y lint sin errores; aprobado. |
| Hito 6 · Endurecimiento y documentación | Añadir CSP y cabeceras de seguridad, rate limit, Markdown seguro, paginación por cursor y actualizar OpenAPI, Bruno y README. | next.config.ts, src/lib/markdown.tsx, src/lib/rate-limit.ts, openapi.yaml, bruno/ y README.md. | Verificado con npm test (39/39), npx tsc --noEmit, npm run lint y npm run build; aprobado. |
| Hito 7 · Control técnico del contexto de la IA | Sustituir las instrucciones escritas por una regla ejecutable que impida leer o editar fuera de la raíz del proyecto y bloquear archivos de secretos. | Archivo opencode.jsonc con `external_directory: deny`, `read` denegado para `*.env` y `*.env.*`, y excepción `*.env.example`; fila añadida en ia/PRUEBAS-SEGURIDAD.md. | Revisado manualmente; se aplica cuando la carpeta del proyecto se abre como raíz del entorno. En VS Code/Copilot el límite se logra abriendo solo esa carpeta como workspace. Aprobado. |

### 4. Decisiones de control
Se mantiene GitHub Copilot en modo Ask por defecto y con permisos manuales activos. Todo el código generado se verifica con ESLint, TypeScript, Vitest y compilación de producción antes de cada commit. El límite de lectura se refuerza con `opencode.jsonc` (regla ejecutable para OpenCode) y, en VS Code/Copilot, abriendo únicamente la carpeta `19-foro-de-preguntas` como raíz del workspace: no existe un archivo de configuración de repo que fije esa raíz en Copilot.
