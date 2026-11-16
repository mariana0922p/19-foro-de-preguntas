# BITACORA DE USO DE INTELIGENCIA ARTIFICIAL

## Proyecto 19 - Foro de preguntas y respuestas

### 1. Objetivo
Registrar el uso de herramientas de inteligencia artificial durante el desarrollo del proyecto, documentando el proposito, las evidencias, la validacion y las decisiones tomadas.

### 2. Herramienta utilizada
- Herramienta: GitHub Copilot (Plan gratuito en Visual Studio Code).
- Modo configurado: Ask con aprobacion manual (Manual permissions).
- Stack del proyecto: Next.js 16, React, TypeScript, Zod y Vitest.

### 3. Registro de actividades
| Actividad | Proposito y solicitud | Evidencia y resultado | Validacion y decision |
|---|---|---|---|
| Configuracion inicial | Definir reglas de arquitectura y seguridad para el proyecto. | Archivo .github/copilot-instructions.md creado. | Revisado manualmente; aprobado para versionar. |
| Prueba de funcionamiento | Comprobar respuesta del chat sin modificar archivos. | Copilot respondio en modo consulta sin alterar el codigo. | Validado en panel de chat; aprobado. |
| Pruebas tecnicas de seguridad | Intentar leer .env.local, listar C:\Users\HP y crear/instalar paquetes sin permiso. | Copilot rechazo leer secretos, salir del proyecto o ejecutar cambios sin autorizacion. | Registrado en ia/PRUEBAS-SEGURIDAD.md; aprobado. |

### 4. Decisiones de control
Se mantiene GitHub Copilot en modo Ask por defecto y con permisos manuales activos. Toda modificacion propuesta sera revisada antes de aceptarse.
