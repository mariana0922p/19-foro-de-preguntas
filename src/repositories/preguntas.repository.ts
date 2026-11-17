import { FieldValue } from "firebase-admin/firestore";
import {
  obtenerFirestoreAdmin,
  tieneCredencialesFirebaseAdmin,
} from "@/lib/firebase-admin";
import {
  aceptarRespuestaEnAlmacen,
  agregarComentarioEnAlmacen,
  agregarRespuestaEnAlmacen,
  crearPreguntaEnAlmacen,
  listarComentariosDePregunta,
  listarPreguntas,
  listarPreguntasPorAutor,
  moderarPreguntaEnAlmacen,
  obtenerPreguntaPorId,
  votarPreguntaEnAlmacen,
  votarRespuestaEnAlmacen,
  type ComentarioItem,
  type PreguntaItem,
  type RespuestaItem,
} from "@/repositories/preguntas.mock";
import { calcularNuevoEstadoVoto } from "@/services/foro.service";

export type ResultadoVoto =
  | {
      ok: true;
      votos: number;
      votoUsuario: 1 | -1 | null;
      autorUid: string;
      variacion: number;
    }
  | { ok: false; status: 403 | 404; error: string };

export interface ResultadoAceptar {
  ok: true;
  aceptadaId: string;
  autorRespuestaUid: string;
  aceptadaPreviaUid: string | null;
}
export interface ResultadoAceptarError {
  ok: false;
  status: 403 | 404;
  error: string;
}

export interface PreguntasRepository {
  listar(): Promise<PreguntaItem[]>;
  listarPorAutor(autorUid: string): Promise<PreguntaItem[]>;
  obtenerPorId(id: string): Promise<PreguntaItem | null>;
  crear(datos: {
    autorUid: string;
    autorNombre: string;
    titulo: string;
    cuerpo: string;
    etiquetas: string[];
  }): Promise<PreguntaItem>;
  agregarRespuesta(
    preguntaId: string,
    datos: { autorUid: string; autorNombre: string; cuerpo: string }
  ): Promise<RespuestaItem | null>;
  votar(
    preguntaId: string,
    usuarioUid: string,
    valor: 1 | -1
  ): Promise<ResultadoVoto>;
  votarRespuesta(
    preguntaId: string,
    respuestaId: string,
    usuarioUid: string,
    valor: 1 | -1
  ): Promise<ResultadoVoto>;
  aceptarRespuesta(
    preguntaId: string,
    usuarioUid: string,
    respuestaId: string
  ): Promise<ResultadoAceptar | ResultadoAceptarError>;
  moderar(preguntaId: string, oculta: boolean): Promise<boolean>;
  listarComentarios(preguntaId: string): Promise<ComentarioItem[]>;
  agregarComentario(
    preguntaId: string,
    datos: { autorUid: string; autorNombre: string; cuerpo: string }
  ): Promise<ComentarioItem | null>;
}

const repositorioMemoria: PreguntasRepository = {
  async listar() {
    return listarPreguntas();
  },
  async listarPorAutor(autorUid) {
    return listarPreguntasPorAutor(autorUid);
  },
  async obtenerPorId(id) {
    return obtenerPreguntaPorId(id) ?? null;
  },
  async crear(datos) {
    return crearPreguntaEnAlmacen(datos);
  },
  async agregarRespuesta(preguntaId, datos) {
    return agregarRespuestaEnAlmacen(preguntaId, datos);
  },
  async votar(preguntaId, usuarioUid, valor) {
    return votarPreguntaEnAlmacen(preguntaId, usuarioUid, valor);
  },
  async votarRespuesta(preguntaId, respuestaId, usuarioUid, valor) {
    return votarRespuestaEnAlmacen(
      preguntaId,
      respuestaId,
      usuarioUid,
      valor
    );
  },
  async aceptarRespuesta(preguntaId, usuarioUid, respuestaId) {
    return aceptarRespuestaEnAlmacen(preguntaId, usuarioUid, respuestaId);
  },
  async moderar(preguntaId, oculta) {
    return moderarPreguntaEnAlmacen(preguntaId, oculta);
  },
  async listarComentarios(preguntaId) {
    return listarComentariosDePregunta(preguntaId);
  },
  async agregarComentario(preguntaId, datos) {
    return agregarComentarioEnAlmacen(preguntaId, datos);
  },
};

function mapearPregunta(id: string, datos: Record<string, unknown>): PreguntaItem {
  return {
    id,
    autorUid: String(datos.autorUid ?? ""),
    autorNombre: String(datos.autorNombre ?? "Estudiante"),
    titulo: String(datos.titulo ?? ""),
    cuerpo: String(datos.cuerpo ?? ""),
    etiquetas: Array.isArray(datos.etiquetas) ? datos.etiquetas : [],
    votos: Number(datos.votos ?? 0),
    respuestas: Number(datos.respuestas ?? 0),
    aceptadaId: datos.aceptadaId ? String(datos.aceptadaId) : null,
    oculta: Boolean(datos.oculta),
    creadaEn: String(datos.creadaEn ?? new Date().toISOString()),
    listaRespuestas: [],
  };
}

const repositorioFirestore: PreguntasRepository = {
  async listar() {
    const db = obtenerFirestoreAdmin();
    const snap = await db
      .collection("preguntas")
      .where("oculta", "==", false)
      .limit(100)
      .get();

    return snap.docs.map((doc) => mapearPregunta(doc.id, doc.data()));
  },

  async listarPorAutor(autorUid) {
    const db = obtenerFirestoreAdmin();
    const snap = await db
      .collection("preguntas")
      .where("autorUid", "==", autorUid)
      .limit(100)
      .get();

    return snap.docs
      .map((doc) => mapearPregunta(doc.id, doc.data()))
      .filter((pregunta) => !pregunta.oculta)
      .sort(
        (a, b) =>
          new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime()
      );
  },

  async obtenerPorId(id) {
    const db = obtenerFirestoreAdmin();
    const docRef = db.collection("preguntas").doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.oculta) return null;

    const respSnap = await docRef
      .collection("respuestas")
      .orderBy("creadaEn", "asc")
      .get();

    const listaRespuestas: RespuestaItem[] = respSnap.docs.map((r) => {
      const rd = r.data();
      return {
        id: r.id,
        autorUid: String(rd.autorUid ?? ""),
        autorNombre: String(rd.autorNombre ?? "Estudiante"),
        cuerpo: String(rd.cuerpo ?? ""),
        votos: Number(rd.votos ?? 0),
        creadaEn: String(rd.creadaEn ?? new Date().toISOString()),
      };
    });

    return {
      ...mapearPregunta(doc.id, doc.data() ?? {}),
      respuestas: listaRespuestas.length,
      listaRespuestas,
    };
  },

  async crear(datos) {
    const db = obtenerFirestoreAdmin();
    const creadaEn = new Date().toISOString();
    const etiquetasNormalizadas = datos.etiquetas.map((e) => e.toLowerCase());
    const docRef = await db.collection("preguntas").add({
      autorUid: datos.autorUid,
      autorNombre: datos.autorNombre,
      titulo: datos.titulo,
      cuerpo: datos.cuerpo,
      etiquetas: etiquetasNormalizadas,
      votos: 0,
      respuestas: 0,
      aceptadaId: null,
      oculta: false,
      creadaEn,
    });

    return {
      id: docRef.id,
      autorUid: datos.autorUid,
      autorNombre: datos.autorNombre,
      titulo: datos.titulo,
      cuerpo: datos.cuerpo,
      etiquetas: etiquetasNormalizadas,
      votos: 0,
      respuestas: 0,
      aceptadaId: null,
      oculta: false,
      creadaEn,
      listaRespuestas: [],
    };
  },

  async agregarRespuesta(preguntaId, datos) {
    const db = obtenerFirestoreAdmin();
    const pregRef = db.collection("preguntas").doc(preguntaId);
    const pregDoc = await pregRef.get();
    if (!pregDoc.exists || pregDoc.data()?.oculta) return null;

    const creadaEn = new Date().toISOString();
    const respRef = await pregRef.collection("respuestas").add({
      autorUid: datos.autorUid,
      autorNombre: datos.autorNombre,
      cuerpo: datos.cuerpo,
      votos: 0,
      creadaEn,
    });

    await pregRef.update({ respuestas: FieldValue.increment(1) });

    return {
      id: respRef.id,
      autorUid: datos.autorUid,
      autorNombre: datos.autorNombre,
      cuerpo: datos.cuerpo,
      votos: 0,
      creadaEn,
    };
  },

  async votar(preguntaId, usuarioUid, valor) {
    const db = obtenerFirestoreAdmin();
    const pregRef = db.collection("preguntas").doc(preguntaId);
    const votoRef = pregRef.collection("votos").doc(usuarioUid);

    return db.runTransaction(async (tx) => {
      const [pregDoc, votoDoc] = await Promise.all([
        tx.get(pregRef),
        tx.get(votoRef),
      ]);

      if (!pregDoc.exists || pregDoc.data()?.oculta) {
        return {
          ok: false as const,
          status: 404 as const,
          error: "Pregunta no encontrada",
        };
      }

      const data = pregDoc.data()!;
      if (data.autorUid === usuarioUid) {
        return {
          ok: false as const,
          status: 403 as const,
          error: "No puedes votar tu propia publicación",
        };
      }

      const votoPrevio = votoDoc.exists
        ? (votoDoc.data()?.valor as 1 | -1)
        : null;
      const votosAnteriores = Number(data.votos ?? 0);
      const resultado = calcularNuevoEstadoVoto({
        votosActuales: votosAnteriores,
        votoPrevioUsuario: votoPrevio,
        nuevoValor: valor,
      });

      tx.update(pregRef, { votos: resultado.votos });
      if (resultado.votoUsuario === null) {
        tx.delete(votoRef);
      } else {
        tx.set(votoRef, { valor: resultado.votoUsuario });
      }

      return {
        ok: true as const,
        votos: resultado.votos,
        votoUsuario: resultado.votoUsuario,
        autorUid: String(data.autorUid ?? ""),
        variacion: resultado.votos - votosAnteriores,
      };
    });
  },

  async votarRespuesta(preguntaId, respuestaId, usuarioUid, valor) {
    const db = obtenerFirestoreAdmin();
    const pregRef = db.collection("preguntas").doc(preguntaId);
    const respRef = pregRef.collection("respuestas").doc(respuestaId);
    const votoRef = respRef.collection("votos").doc(usuarioUid);

    return db.runTransaction(async (tx) => {
      const [pregDoc, respDoc, votoDoc] = await Promise.all([
        tx.get(pregRef),
        tx.get(respRef),
        tx.get(votoRef),
      ]);

      if (!pregDoc.exists || pregDoc.data()?.oculta) {
        return {
          ok: false as const,
          status: 404 as const,
          error: "Pregunta no encontrada",
        };
      }
      if (!respDoc.exists) {
        return {
          ok: false as const,
          status: 404 as const,
          error: "Respuesta no encontrada",
        };
      }

      const datosRespuesta = respDoc.data()!;
      if (datosRespuesta.autorUid === usuarioUid) {
        return {
          ok: false as const,
          status: 403 as const,
          error: "No puedes votar tu propia publicación",
        };
      }

      const votoPrevio = votoDoc.exists
        ? (votoDoc.data()?.valor as 1 | -1)
        : null;
      const votosAnteriores = Number(datosRespuesta.votos ?? 0);
      const resultado = calcularNuevoEstadoVoto({
        votosActuales: votosAnteriores,
        votoPrevioUsuario: votoPrevio,
        nuevoValor: valor,
      });

      tx.update(respRef, { votos: resultado.votos });
      if (resultado.votoUsuario === null) {
        tx.delete(votoRef);
      } else {
        tx.set(votoRef, { valor: resultado.votoUsuario });
      }

      return {
        ok: true as const,
        votos: resultado.votos,
        votoUsuario: resultado.votoUsuario,
        autorUid: String(datosRespuesta.autorUid ?? ""),
        variacion: resultado.votos - votosAnteriores,
      };
    });
  },

  async aceptarRespuesta(preguntaId, usuarioUid, respuestaId) {
    const db = obtenerFirestoreAdmin();
    const pregRef = db.collection("preguntas").doc(preguntaId);

    return db.runTransaction(async (tx) => {
      const pregDoc = await tx.get(pregRef);

      if (!pregDoc.exists || pregDoc.data()?.oculta) {
        return {
          ok: false as const,
          status: 404 as const,
          error: "Pregunta no encontrada",
        };
      }

      const datos = pregDoc.data()!;
      if (datos.autorUid !== usuarioUid) {
        return {
          ok: false as const,
          status: 403 as const,
          error: "Solo el autor de la pregunta puede aceptar una respuesta",
        };
      }

      const respDoc = await tx.get(pregRef.collection("respuestas").doc(respuestaId));
      if (!respDoc.exists) {
        return {
          ok: false as const,
          status: 404 as const,
          error: "Respuesta no encontrada",
        };
      }

      let aceptadaPreviaUid: string | null = null;
      if (datos.aceptadaId) {
        const previaDoc = await tx.get(
          pregRef.collection("respuestas").doc(String(datos.aceptadaId))
        );
        if (previaDoc.exists) {
          aceptadaPreviaUid = String(previaDoc.data()?.autorUid ?? "") || null;
        }
      }

      tx.update(pregRef, { aceptadaId: respuestaId });

      return {
        ok: true as const,
        aceptadaId: respuestaId,
        autorRespuestaUid: String(respDoc.data()?.autorUid ?? ""),
        aceptadaPreviaUid,
      };
    });
  },

  async moderar(preguntaId, oculta) {
    const db = obtenerFirestoreAdmin();
    const pregRef = db.collection("preguntas").doc(preguntaId);
    const pregDoc = await pregRef.get();
    if (!pregDoc.exists) return false;
    await pregRef.update({ oculta });
    return true;
  },

  async listarComentarios(preguntaId) {
    const db = obtenerFirestoreAdmin();
    const snap = await db
      .collection("preguntas")
      .doc(preguntaId)
      .collection("comentarios")
      .orderBy("creadaEn", "asc")
      .get();

    return snap.docs.map((doc) => {
      const datos = doc.data();
      return {
        id: doc.id,
        autorUid: String(datos.autorUid ?? ""),
        autorNombre: String(datos.autorNombre ?? "Estudiante"),
        cuerpo: String(datos.cuerpo ?? ""),
        creadaEn: String(datos.creadaEn ?? new Date().toISOString()),
      };
    });
  },

  async agregarComentario(preguntaId, datos) {
    const db = obtenerFirestoreAdmin();
    const pregRef = db.collection("preguntas").doc(preguntaId);
    const pregDoc = await pregRef.get();
    if (!pregDoc.exists || pregDoc.data()?.oculta) return null;

    const creadaEn = new Date().toISOString();
    const ref = await pregRef.collection("comentarios").add({
      autorUid: datos.autorUid,
      autorNombre: datos.autorNombre,
      cuerpo: datos.cuerpo,
      creadaEn,
    });

    return {
      id: ref.id,
      autorUid: datos.autorUid,
      autorNombre: datos.autorNombre,
      cuerpo: datos.cuerpo,
      creadaEn,
    };
  },
};

export function obtenerRepositorioPreguntas(): PreguntasRepository {
  return tieneCredencialesFirebaseAdmin()
    ? repositorioFirestore
    : repositorioMemoria;
}
