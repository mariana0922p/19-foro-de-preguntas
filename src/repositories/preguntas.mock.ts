export interface RespuestaItem {
  id: string;
  autorUid: string;
  autorNombre: string;
  cuerpo: string;
  votos: number;
  creadaEn: string;
}

export interface PreguntaItem {
  id: string;
  autorUid: string;
  autorNombre: string;
  titulo: string;
  cuerpo: string;
  etiquetas: string[];
  votos: number;
  respuestas: number;
  aceptadaId: string | null;
  oculta: boolean;
  creadaEn: string;
  listaRespuestas: RespuestaItem[];
}

export const PREGUNTAS_MOCK: PreguntaItem[] = [
  {
    id: "preg-1",
    autorUid: "usr-ana",
    autorNombre: "Ana Morales",
    titulo: "¿Cómo implementar una lista enlazada simple en Java sin usar LinkedList?",
    cuerpo:
      "En la materia de Estructura de Datos nos pidieron crear una lista enlazada manual con nodos genéricos `<T>` y métodos para insertar al inicio, eliminar por valor e imprimir.\n\nTengo dudas sobre cómo manejar el puntero `cabeza` cuando se elimina el primer nodo sin perder la referencia al resto de la lista.",
    etiquetas: ["java", "estructuras-de-datos", "poo"],
    votos: 14,
    respuestas: 2,
    aceptadaId: "resp-101",
    oculta: false,
    creadaEn: "2026-11-14T15:30:00.000Z",
    listaRespuestas: [
      {
        id: "resp-101",
        autorUid: "usr-carlos",
        autorNombre: "Carlos Gómez",
        cuerpo:
          "Si el nodo a eliminar es `cabeza`, simplemente reasigna `cabeza = cabeza.siguiente`. Para nodos intermedios, mantén dos referencias (`actual` y `anterior`) y enlaza `anterior.siguiente = actual.siguiente`.",
        votos: 9,
        creadaEn: "2026-11-14T16:10:00.000Z",
      },
      {
        id: "resp-102",
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
    id: "preg-2",
    autorUid: "usr-diego",
    autorNombre: "Diego Salazar",
    titulo: "Diferencia entre Server Components y Client Components en Next.js App Router",
    cuerpo:
      "Estoy migrando una aplicación a Next.js 16 y me genera error al usar `useState` dentro de `page.tsx`. ¿Cuándo debo agregar exactamente la directiva `'use client'` y cómo afecta el consumo de datos con `fetch`?",
    etiquetas: ["nextjs", "react", "typescript"],
    votos: 21,
    respuestas: 1,
    aceptadaId: "resp-201",
    oculta: false,
    creadaEn: "2026-11-15T10:15:00.000Z",
    listaRespuestas: [
      {
        id: "resp-201",
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
    id: "preg-3",
    autorUid: "usr-mateo",
    autorNombre: "Mateo Valencia",
    titulo: "¿Cómo validar esquemas anidados y arreglos con Zod en una API REST?",
    cuerpo:
      "Necesito validar en el servidor que un arreglo de etiquetas tenga mínimo 1 elemento, máximo 5, y que no vengan campos extra no declarados en el JSON de entrada.",
    etiquetas: ["zod", "typescript", "api-rest"],
    votos: 8,
    respuestas: 0,
    aceptadaId: null,
    oculta: false,
    creadaEn: "2026-11-16T09:00:00.000Z",
    listaRespuestas: [],
  },
];
