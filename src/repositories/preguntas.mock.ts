import { calcularNuevoEstadoVoto } from "@/services/foro.service";

export interface RespuestaItem {
  id: string;
  autorUid: string;
  autorNombre: string;
  cuerpo: string;
  votos: number;
  creadaEn: string;
}

export interface ComentarioItem {
  id: string;
  autorUid: string;
  autorNombre: string;
  cuerpo: string;
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

export const USUARIO_DEMO_ACTUAL = {
  uid: "usr-estudiante",
  nombre: "Mariana Estudiante",
};

const DATOS_INICIALES: PreguntaItem[] = [
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
    autorUid: "usr-estudiante",
    autorNombre: "Mariana Estudiante",
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

let almacenPreguntas: PreguntaItem[] = structuredClone(DATOS_INICIALES);
const votosPorPreguntaYUsuario = new Map<string, 1 | -1>();
const votosPorRespuestaYUsuario = new Map<string, 1 | -1>();
const comentariosPorPregunta = new Map<string, ComentarioItem[]>();

export function reiniciarAlmacenMock() {
  almacenPreguntas = structuredClone(DATOS_INICIALES);
  votosPorPreguntaYUsuario.clear();
  votosPorRespuestaYUsuario.clear();
  comentariosPorPregunta.clear();
}

export function listarPreguntas(): PreguntaItem[] {
  return almacenPreguntas.filter((p) => !p.oculta);
}

export function obtenerPreguntaPorId(id: string): PreguntaItem | undefined {
  return almacenPreguntas.find((p) => p.id === id && !p.oculta);
}

export function crearPreguntaEnAlmacen(datos: {
  autorUid: string;
  autorNombre: string;
  titulo: string;
  cuerpo: string;
  etiquetas: string[];
}): PreguntaItem {
  const nueva: PreguntaItem = {
    id: `preg-${Date.now()}`,
    autorUid: datos.autorUid,
    autorNombre: datos.autorNombre,
    titulo: datos.titulo,
    cuerpo: datos.cuerpo,
    etiquetas: datos.etiquetas.map((e) => e.toLowerCase()),
    votos: 0,
    respuestas: 0,
    aceptadaId: null,
    oculta: false,
    creadaEn: new Date().toISOString(),
    listaRespuestas: [],
  };
  almacenPreguntas.unshift(nueva);
  return nueva;
}

export function agregarRespuestaEnAlmacen(
  preguntaId: string,
  datos: { autorUid: string; autorNombre: string; cuerpo: string }
): RespuestaItem | null {
  const pregunta = obtenerPreguntaPorId(preguntaId);
  if (!pregunta) return null;

  const nuevaRespuesta: RespuestaItem = {
    id: `resp-${Date.now()}`,
    autorUid: datos.autorUid,
    autorNombre: datos.autorNombre,
    cuerpo: datos.cuerpo,
    votos: 0,
    creadaEn: new Date().toISOString(),
  };

  pregunta.listaRespuestas.push(nuevaRespuesta);
  pregunta.respuestas = pregunta.listaRespuestas.length;
  return nuevaRespuesta;
}

export function votarPreguntaEnAlmacen(
  preguntaId: string,
  usuarioUid: string,
  valor: 1 | -1
):
  | {
      ok: true;
      votos: number;
      votoUsuario: 1 | -1 | null;
      autorUid: string;
      variacion: number;
    }
  | { ok: false; status: 403 | 404; error: string } {
  const pregunta = obtenerPreguntaPorId(preguntaId);
  if (!pregunta) {
    return { ok: false, status: 404, error: "Pregunta no encontrada" };
  }
  if (pregunta.autorUid === usuarioUid) {
    return {
      ok: false,
      status: 403,
      error: "No puedes votar tu propia publicación",
    };
  }

  const clave = `${preguntaId}:${usuarioUid}`;
  const votoPrevio = votosPorPreguntaYUsuario.get(clave) ?? null;
  const votosAnteriores = pregunta.votos;
  const resultado = calcularNuevoEstadoVoto({
    votosActuales: pregunta.votos,
    votoPrevioUsuario: votoPrevio,
    nuevoValor: valor,
  });

  pregunta.votos = resultado.votos;
  if (resultado.votoUsuario === null) {
    votosPorPreguntaYUsuario.delete(clave);
  } else {
    votosPorPreguntaYUsuario.set(clave, resultado.votoUsuario);
  }

  return {
    ok: true,
    votos: pregunta.votos,
    votoUsuario: resultado.votoUsuario,
    autorUid: pregunta.autorUid,
    variacion: pregunta.votos - votosAnteriores,
  };
}

export function aceptarRespuestaEnAlmacen(
  preguntaId: string,
  usuarioUid: string,
  respuestaId: string
):
  | {
      ok: true;
      aceptadaId: string;
      autorRespuestaUid: string;
      aceptadaPreviaUid: string | null;
    }
  | { ok: false; status: 403 | 404; error: string } {
  const pregunta = obtenerPreguntaPorId(preguntaId);
  if (!pregunta) {
    return { ok: false, status: 404, error: "Pregunta no encontrada" };
  }
  if (pregunta.autorUid !== usuarioUid) {
    return {
      ok: false,
      status: 403,
      error: "Solo el autor de la pregunta puede aceptar una respuesta",
    };
  }
  const respuesta = pregunta.listaRespuestas.find((r) => r.id === respuestaId);
  if (!respuesta) {
    return { ok: false, status: 404, error: "Respuesta no encontrada" };
  }

  const aceptadaPrevia = pregunta.aceptadaId
    ? pregunta.listaRespuestas.find((r) => r.id === pregunta.aceptadaId)
    : undefined;

  pregunta.aceptadaId = respuestaId;
  return {
    ok: true,
    aceptadaId: respuestaId,
    autorRespuestaUid: respuesta.autorUid,
    aceptadaPreviaUid: aceptadaPrevia?.autorUid ?? null,
  };
}

export function listarPreguntasPorAutor(autorUid: string): PreguntaItem[] {
  return almacenPreguntas.filter((p) => p.autorUid === autorUid && !p.oculta);
}

export function listarComentariosDePregunta(
  preguntaId: string
): ComentarioItem[] {
  return [...(comentariosPorPregunta.get(preguntaId) ?? [])];
}

export function agregarComentarioEnAlmacen(
  preguntaId: string,
  datos: { autorUid: string; autorNombre: string; cuerpo: string }
): ComentarioItem | null {
  if (!obtenerPreguntaPorId(preguntaId)) return null;

  const comentario: ComentarioItem = {
    id: `com-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    autorUid: datos.autorUid,
    autorNombre: datos.autorNombre,
    cuerpo: datos.cuerpo,
    creadaEn: new Date().toISOString(),
  };

  const lista = comentariosPorPregunta.get(preguntaId) ?? [];
  lista.push(comentario);
  comentariosPorPregunta.set(preguntaId, lista);
  return comentario;
}

export function votarRespuestaEnAlmacen(
  preguntaId: string,
  respuestaId: string,
  usuarioUid: string,
  valor: 1 | -1
):
  | {
      ok: true;
      votos: number;
      votoUsuario: 1 | -1 | null;
      autorUid: string;
      variacion: number;
    }
  | { ok: false; status: 403 | 404; error: string } {
  const pregunta = obtenerPreguntaPorId(preguntaId);
  if (!pregunta) {
    return { ok: false, status: 404, error: "Pregunta no encontrada" };
  }

  const respuesta = pregunta.listaRespuestas.find((r) => r.id === respuestaId);
  if (!respuesta) {
    return { ok: false, status: 404, error: "Respuesta no encontrada" };
  }

  if (respuesta.autorUid === usuarioUid) {
    return {
      ok: false,
      status: 403,
      error: "No puedes votar tu propia publicación",
    };
  }

  const clave = `${preguntaId}:${respuestaId}:${usuarioUid}`;
  const votoPrevio = votosPorRespuestaYUsuario.get(clave) ?? null;
  const votosAnteriores = respuesta.votos;
  const resultado = calcularNuevoEstadoVoto({
    votosActuales: respuesta.votos,
    votoPrevioUsuario: votoPrevio,
    nuevoValor: valor,
  });

  respuesta.votos = resultado.votos;
  if (resultado.votoUsuario === null) {
    votosPorRespuestaYUsuario.delete(clave);
  } else {
    votosPorRespuestaYUsuario.set(clave, resultado.votoUsuario);
  }

  return {
    ok: true,
    votos: respuesta.votos,
    votoUsuario: resultado.votoUsuario,
    autorUid: respuesta.autorUid,
    variacion: respuesta.votos - votosAnteriores,
  };
}

export function moderarPreguntaEnAlmacen(
  preguntaId: string,
  oculta: boolean
): boolean {
  const pregunta = almacenPreguntas.find((p) => p.id === preguntaId);
  if (!pregunta) return false;
  pregunta.oculta = oculta;
  return true;
}
