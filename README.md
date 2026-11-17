# 19 · Foro de preguntas y respuestas

Aplicación web para una comunidad académica: publicar preguntas, responder,
comentar, votar, aceptar la mejor respuesta y consultar la reputación de cada
estudiante. Construida con **Next.js 16 (App Router)**, **React 19**,
**TypeScript**, **Zod**, **Tailwind CSS** y **Firebase** (Auth + Firestore).

## Funcionalidades

- **Sesión segura con Firebase Auth**: el cliente obtiene un ID token y lo
  canjea en `POST /api/auth/sesion` por una cookie **HttpOnly** (`sesion`).
  El servidor la verifica con el Admin SDK en cada petición.
- **Roles**: `estudiante` y `admin` (moderador). Solo el admin puede ocultar o
  restaurar preguntas.
- **Preguntas y respuestas** con validación Zod en el servidor y Markdown
  seguro (sin HTML crudo ni enlaces `javascript:`).
- **Comentarios** dentro del detalle de cada pregunta, cargados con
  `Suspense` y `<details>`.
- **Votos** a preguntas **y a respuestas**, con voto optimista en la interfaz.
- **Respuesta aceptada** por el autor de la pregunta.
- **Reputación** calculada por el servidor: **+5 puntos** por voto recibido y
  **+15** por respuesta aceptada (nunca baja de 0).
- **Búsqueda, filtro por etiqueta, orden y paginación por cursor** en el
  listado, sincronizados con la URL (`q`, `etiqueta`, `orden`).
- **Buenas prácticas de UI/UX**: `loading.tsx`, `error.tsx` con reintento,
  `not-found.tsx`, `aria-live`, foco visible y áreas táctiles de 44 px.
- **Seguridad**: verificación de `Origin` en escrituras, rate limit por
  cliente, cabeceras CSP y de endurecimiento del navegador, y reglas de
  Firestore que bloquean el acceso directo desde el cliente.

## Requisitos

- Node.js 20 o superior.
- Un proyecto de Firebase con **Authentication (correo/contraseña)** y
  **Firestore** habilitados.
- Una cuenta de servicio de Firebase (para el Admin SDK).

## Puesta en marcha

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea `.env.local` a partir de `.env.example` y completa los valores:

   ```env
   # SDK web (públicas)
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...

   # Admin SDK (privadas, nunca en Git)
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. Inicia el servidor:

   ```bash
   npm run dev
   ```

4. Abre <http://localhost:3000>.

> **Modo demostración**: si faltan las variables del Admin SDK, la app usa un
> almacén en memoria con datos de ejemplo y acepta las cabeceras
> `x-demo-uid`, `x-demo-nombre` y `x-demo-rol`. Es útil para pruebas y para
> Bruno, pero **no debe usarse en producción**.

## Rutas de la aplicación

| Ruta | Descripción |
| --- | --- |
| `/` | Listado con búsqueda, etiqueta, orden y scroll infinito |
| `/preguntas/nueva` | Crear pregunta (requiere sesión) |
| `/preguntas/[id]` | Detalle, respuestas, comentarios y votos |
| `/etiquetas/[etiqueta]` | Preguntas de una etiqueta |
| `/usuarios/[uid]` | Perfil público y reputación |
| `/login` | Ingresar o crear cuenta con Firebase Auth |

## API REST

La especificación completa está en [`openapi.yaml`](./openapi.yaml).

| Método | Ruta | Quién |
| --- | --- | --- |
| `GET` | `/api/preguntas?q=&etiqueta=&orden=&limite=&cursor=` | Público |
| `POST` | `/api/preguntas` | Autenticado |
| `GET` | `/api/preguntas/[id]` | Público |
| `POST` | `/api/preguntas/[id]/respuestas` | Autenticado |
| `POST` | `/api/preguntas/[id]/votos` | Autenticado (no el autor) |
| `POST` | `/api/preguntas/[id]/respuestas/[rid]/votos` | Autenticado (no el autor) |
| `POST` | `/api/preguntas/[id]/aceptar` | Autor de la pregunta |
| `GET`/`POST` | `/api/preguntas/[id]/comentarios` | Público / Autenticado |
| `POST`/`DELETE` | `/api/auth/sesion` | Público |
| `GET` | `/api/auth/yo` | Autenticado |
| `PATCH` | `/api/admin/preguntas/[id]/ocultar` | Solo `admin` |

Las peticiones autenticadas aceptan la cookie `sesion` o la cabecera
`Authorization: Bearer <idToken>`. Las escrituras también comprueban que el
`Origin` coincida con el servidor cuando el navegador lo envía.

## Reglas de negocio

- Nadie puede votar su propia pregunta ni su propia respuesta.
- Solo el autor de la pregunta puede marcar una respuesta como aceptada.
- Al cambiar la respuesta aceptada, la reputación se ajusta automáticamente
  (se restan 15 al autor anterior y se suman 15 al nuevo).
- La reputación se guarda en Firestore (`usuarios/{uid}/perfil/actual`) o en
  memoria en modo demostración.

## Seguridad y calidad

- **Límite de peticiones**: 30 escrituras y 120 lecturas por minuto y cliente;
  10 intentos de login por minuto. Responde `429` con `Retry-After`.
- **Cabeceras** (`next.config.ts`): `Content-Security-Policy`,
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Strict-Transport-Security` y
  `Cross-Origin-Opener-Policy`.
- **Markdown propio** (`src/lib/markdown.tsx`): devuelve elementos React, así
  que React escapa el texto; solo permite enlaces `http(s)`.
- **Firestore**: `firestore.rules` niega todo acceso directo del cliente; solo
  el Admin SDK escribe desde el servidor.

### Pruebas y verificaciones

```bash
npm test          # Vitest: API, Markdown/XSS, reputación y componentes
npm run lint      # ESLint
npx tsc --noEmit  # Tipos
npm run build     # Build de producción
```

### OpenAPI y Bruno

- [`openapi.yaml`](./openapi.yaml): contrato de todos los endpoints, esquemas,
  códigos de error y seguridad.
- [`bruno/`](./bruno): colección lista para probar los flujos principales
  (listar, crear, validar, 401, votos, comentarios, moderación).

## Estructura del proyecto

```text
src/
  app/                 Páginas y Route Handlers
    api/               Endpoints REST
    etiquetas/[etiqueta]/
    usuarios/[uid]/
    preguntas/[id]/    Detalle con Suspense y comentarios
  components/          UI reutilizable (QuestionCard, VoteControls, ...)
  hooks/               useDebounce
  lib/                 sesión, Firebase, rate limit, Markdown, http
  repositories/        Firestore y almacén en memoria
  schemas/             Validación Zod
  services/            Reglas de negocio y reputación
  proxy.ts             Redirección a /login para rutas privadas
tests/                 Pruebas Vitest
ia/                    Bitácora y evidencias de seguridad
```

## Evidencias

- [`ia/BITACORA.md`](./ia/BITACORA.md): decisiones y avances del proyecto.
- [`ia/PRUEBAS-SEGURIDAD.md`](./ia/PRUEBAS-SEGURIDAD.md): pruebas de
  autenticación, validación y endurecimiento.
