# 19 · Foro de preguntas y respuestas

Aplicación web desarrollada con Next.js 16 (App Router), React, TypeScript y Zod para que estudiantes publiquen preguntas, compartan respuestas, voten y consulten soluciones aceptadas[cite: 1].

## Requisitos y ejecución local

1. Instalar dependencias: `npm install`[cite: 1]
2. Iniciar servidor local: `npm run dev`[cite: 1]
3. Abrir en el navegador:
   - Listado principal: `http://localhost:3000`[cite: 4]
   - Detalle de pregunta: `http://localhost:3000/preguntas/preg-1`
   - API REST: `http://localhost:3000/api/preguntas`

## Scripts disponibles

- `npm run dev`: inicia el servidor de desarrollo[cite: 8].
- `npm run build`: compila la aplicación para producción[cite: 8].
- `npm run lint`: ejecuta ESLint y reglas de accesibilidad[cite: 1, 8].
- `npx tsc --noEmit`: verifica los tipos de TypeScript.

## Estructura principal

- `src/app/`: páginas (`page.tsx`, `preguntas/[id]/page.tsx`) y Route Handlers (`api/preguntas/`)[cite: 1].
- `src/components/`: componentes reutilizables (`QuestionCard.tsx`)[cite: 1].
- `src/repositories/`: datos de ejemplo (`preguntas.mock.ts`).
- `src/schemas/`: esquemas de validación Zod (`pregunta.schema.ts`)[cite: 1].
- `ia/`: bitácora (`BITACORA.md`) y evidencias de seguridad (`PRUEBAS-SEGURIDAD.md`)[cite: 1].
