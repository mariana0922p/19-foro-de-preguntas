/**
 * Carga datos de ejemplo en Firestore para que el foro no aparezca vacío.
 * Es idempotente: usa IDs fijos, así que puedes ejecutarlo varias veces.
 *
 * Uso:
 *   node --env-file=.env.local scripts/sembrar-firestore.mjs
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY en .env.local."
  );
  process.exit(1);
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

const db = getFirestore(app);

const perfiles = [
  { uid: "usr-ana", nombre: "Ana Morales", reputacion: 70 },
  { uid: "usr-diego", nombre: "Diego Salazar", reputacion: 105 },
  { uid: "usr-estudiante", nombre: "Mariana Estudiante", reputacion: 40 },
  { uid: "usr-carlos", nombre: "Carlos Gómez", reputacion: 60 },
  { uid: "usr-laura", nombre: "Laura Ríos", reputacion: 20 },
  { uid: "usr-sofia", nombre: "Sofía Restrepo", reputacion: 90 },
];

const preguntas = [
  {
    id: "demo-preg-1",
    autorUid: "usr-ana",
    autorNombre: "Ana Morales",
    titulo:
      "¿Cómo implementar una lista enlazada simple en Java sin usar LinkedList?",
    cuerpo:
      "En la materia de Estructura de Datos nos pidieron crear una lista enlazada manual con nodos genéricos `<T>` y métodos para insertar al inicio, eliminar por valor e imprimir.\n\nTengo dudas sobre cómo manejar el puntero `cabeza` cuando se elimina el primer nodo sin perder la referencia al resto de la lista.",
    etiquetas: ["java", "estructuras-de-datos", "poo"],
    votos: 14,
    respuestas: 2,
    aceptadaId: "demo-resp-101",
    creadaEn: "2026-11-14T15:30:00.000Z",
    respuestasLista: [
      {
        id: "demo-resp-101",
        autorUid: "usr-carlos",
        autorNombre: "Carlos Gómez",
        cuerpo:
          "Si el nodo a eliminar es `cabeza`, simplemente reasigna `cabeza = cabeza.siguiente`. Para nodos intermedios, mantén dos referencias (`actual` y `anterior`) y enlaza `anterior.siguiente = actual.siguiente`.",
        votos: 9,
        creadaEn: "2026-11-14T16:10:00.000Z",
      },
      {
        id: "demo-resp-102",
        autorUid: "usr-laura",
        autorNombre: "Laura Ríos",
        cuerpo:
          "Recuerda validar primero `if (cabeza == null) return;` para evitar un `NullPointerException` cuando la lista está vacía.",
        votos: 4,
        creadaEn: "2026-11-14T17:05:00.000Z",
      },
    ],
  },
  {
    id: "demo-preg-2",
    autorUid: "usr-diego",
    autorNombre: "Diego Salazar",
    titulo:
      "Diferencia entre Server Components y Client Components en Next.js App Router",
    cuerpo:
      "Estoy migrando una aplicación a Next.js 16 y me genera error al usar `useState` dentro de `page.tsx`. ¿Cuándo debo agregar exactamente la directiva `'use client'` y cómo afecta el consumo de datos con `fetch`?",
    etiquetas: ["nextjs", "react", "typescript"],
    votos: 21,
    respuestas: 1,
    aceptadaId: "demo-resp-201",
    creadaEn: "2026-11-15T10:15:00.000Z",
    respuestasLista: [
      {
        id: "demo-resp-201",
        autorUid: "usr-sofia",
        autorNombre: "Sofía Restrepo",
        cuerpo:
          "En App Router todos los componentes son Server Components por defecto. Solo agrega `'use client'` en componentes pequeños e interactivos que usen hooks (`useState`, `useEffect`) o eventos (`onClick`, `onChange`).",
        votos: 15,
        creadaEn: "2026-11-15T11:00:00.000Z",
      },
    ],
  },
  {
    id: "demo-preg-3",
    autorUid: "usr-estudiante",
    autorNombre: "Mariana Estudiante",
    titulo:
      "¿Cómo validar esquemas anidados y arreglos con Zod en una API REST?",
    cuerpo:
      "Necesito validar en el servidor que un arreglo de etiquetas tenga mínimo 1 elemento, máximo 5, y que no vengan campos extra no declarados en el JSON de entrada.",
    etiquetas: ["zod", "typescript", "api-rest"],
    votos: 8,
    respuestas: 0,
    aceptadaId: null,
    creadaEn: "2026-11-16T09:00:00.000Z",
    respuestasLista: [],
  },
  {
    id: "demo-preg-4",
    autorUid: "usr-diego",
    autorNombre: "Diego Salazar",
    titulo:
      "¿Cómo desplegar Next.js con Firebase en Vercel sin exponer credenciales?",
    cuerpo:
      "Ya tengo la app funcionando en local con Firebase Admin. ¿Qué variables debo configurar en Vercel y cómo evito subir la clave privada al repositorio?",
    etiquetas: ["vercel", "firebase", "seguridad"],
    votos: 6,
    respuestas: 0,
    aceptadaId: null,
    creadaEn: "2026-11-16T10:30:00.000Z",
    respuestasLista: [],
  },
];

async function sembrar() {
  const lote = db.batch();

  for (const perfil of perfiles) {
    lote.set(
      db
        .collection("usuarios")
        .doc(perfil.uid)
        .collection("perfil")
        .doc("actual"),
      {
        uid: perfil.uid,
        nombre: perfil.nombre,
        reputacion: perfil.reputacion,
        creadoEn: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  for (const pregunta of preguntas) {
    const { respuestasLista, ...datos } = pregunta;
    lote.set(
      db.collection("preguntas").doc(pregunta.id),
      { ...datos, oculta: false },
      { merge: true }
    );

    for (const respuesta of respuestasLista) {
      lote.set(
        db
          .collection("preguntas")
          .doc(pregunta.id)
          .collection("respuestas")
          .doc(respuesta.id),
        respuesta,
        { merge: true }
      );
    }
  }

  lote.set(
    db
      .collection("preguntas")
      .doc("demo-preg-1")
      .collection("comentarios")
      .doc("demo-com-1"),
    {
      autorUid: "usr-laura",
      autorNombre: "Laura Ríos",
      cuerpo: "¿El ejemplo también funciona con listas doblemente enlazadas?",
      creadaEn: "2026-11-14T18:00:00.000Z",
    },
    { merge: true }
  );

  await lote.commit();

  console.log(
    `Datos sembrados: ${preguntas.length} preguntas, ${perfiles.length} perfiles y sus respuestas/comentarios.`
  );
  console.log("Ya puedes recargar el foro o volver a ejecutar el diagnóstico.");
}

sembrar().catch((error) => {
  console.error(
    "No se pudieron sembrar los datos:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
