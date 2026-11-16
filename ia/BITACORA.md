# BITACORA DE USO DE INTELIGENCIA ARTIFICIAL

## Proyecto 19 - Foro de preguntas y respuestas

### 1. Objetivo
Registrar el uso de herramientas de inteligencia artificial durante el desarrollo del proyecto, documentando el proposito, las evidencias, la validacion y las decisiones tomadas[cite: 1].

### 2. Herramienta utilizada
- Herramienta: GitHub Copilot (Plan gratuito en Visual Studio Code) y asistencia de diseño arquitectónico[cite: 10].
- Modo configurado: Ask con aprobacion manual (Manual permissions)[cite: 19].
- Stack del proyecto: Next.js 16, React, TypeScript, Zod y Vitest[cite: 1].

### 3. Registro de actividades
| Actividad | Proposito y solicitud | Evidencia y resultado | Validacion y decision |
|---|---|---|---|
| Configuracion inicial | Definir reglas de arquitectura y seguridad para el proyecto[cite: 15]. | Archivo .github/copilot-instructions.md creado[cite: 15]. | Revisado manualmente; aprobado para versionar. |
| Prueba de funcionamiento | Comprobar respuesta del chat sin modificar archivos[cite: 11]. | Copilot respondio en modo consulta sin alterar el codigo[cite: 19]. | Validado en panel de chat; aprobado. |
| Pruebas tecnicas de seguridad | Intentar leer .env.local, listar C:\Users\HP y crear/instalar paquetes sin permiso. | Copilot rechazo leer secretos, salir del proyecto o ejecutar cambios sin autorizacion. | Registrado en ia/PRUEBAS-SEGURIDAD.md; aprobado en primer commit (3907a6e)[cite: 1]. |
| Hito 1 · Esquemas y API mock | Generar esquemas Zod, datos de ejemplo y endpoints GET /api/preguntas y /api/preguntas/[id][cite: 1]. | Archivos en src/schemas/, src/repositories/ y src/app/api/preguntas/. | Validado con TypeScript y respuestas JSON 200/400/404; aprobado[cite: 1]. |
| Hito 1 · Interfaz semántica y estados | Construir layout semántico, listado con filtros/fetch, detalle de pregunta y estados carga/vacío/error[cite: 1]. | Archivos src/app/layout.tsx, page.tsx, preguntas/[id]/page.tsx y QuestionCard.tsx[cite: 1]. | Validado con npm run lint (0 errores) y revisión visual; aprobado[cite: 1]. |

### 4. Decisiones de control
Se mantiene GitHub Copilot en modo Ask por defecto y con permisos manuales activos[cite: 19]. Todo el código generado se verifica con ESLint (npm run lint) y comprobación de tipos antes de realizar cada commit[cite: 1].
