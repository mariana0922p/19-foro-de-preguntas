import { FieldValue } from "firebase-admin/firestore";
import {
  obtenerFirestoreAdmin,
  tieneCredencialesFirebaseAdmin,
} from "@/lib/firebase-admin";
import {
  aceptarRespuestaEnAlmacen,
  agregarRespuestaEnAlmacen,
  crearPreguntaEnAlmacen,
  listarPreguntas,
  obtenerPreguntaPorId,
  type PreguntaItem,
  type RespuestaItem,
  votarPreguntaEnAlmacen,
} from "@/repositories/preguntas.mock";
import { calcularNuevoEstadoVoto } from "@/services/foro.service";

export interface PreguntasRepository {
  listar(): Promise<PreguntaItem[]>;
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
  ): Promise<
    | { ok: true; votos: number; votoUsuario: 1 | -1 | null }
    | { ok: false; status: 403 | 404; error: string }
  >;
  aceptarRespuesta(
    preguntaId: string,
    usuarioUid: string,
    respuestaId: string
  ): Promise<
    | { ok: true; aceptadaId: string }
    | { ok: false; status: 403 | 404; error: string }
  >;
}

const repositorioMemoria: PreguntasRepository = {
  async listar() {
    return listarPreguntas();
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
  async aceptarRespuesta(preguntaId, usuarioUid, respuestaId) {
    return aceptarRespuestaEnAlmacen(preguntaId, usuarioUid, respuestaId);
  },
};

const repositorioFirestore: PreguntasRepository = {
  async listar() {
    const db = obtenerFirestoreAdmin();
    const snap = await db
      .collection("preguntas")
      .where("oculta", "==", false)
      .limit(100)
      .get();

    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        autorUid: String(d.autorUid ?? ""),
        autorNombre: String(d.autorNombre ?? "Estudiante"),
        titulo: String(d.titulo ?? ""),
        cuerpo: String(d.cuerpo ?? ""),
        etiquetas: Array.isArray(d.etiquetas) ? d.etiquetas : [],
        votos: Number(d.votos ?? 0),
        respuestas: Number(d.respuestas ?? 0),
        aceptadaId: d.aceptadaId ? String(d.aceptadaId) : null,
        oculta: Boolean(d.oculta),
        creadaEn: String(d.creadaEn ?? new Date().toISOString()),
        listaRespuestas: [],
      };
    });
  },

  async obtenerPorId(id) {
    const db = obtenerFirestoreAdmin();
    const docRef = db.collection("preguntas").doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.oculta) return null;

    const d = doc.data()!;
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
      id: doc.id,
      autorUid: String(d.autorUid ?? ""),
      autorNombre: String(d.autorNombre ?? "Estudiante"),
      titulo: String(d.titulo ?? ""),
      cuerpo: String(d.cuerpo ?? ""),
      etiquetas: Array.isArray(d.etiquetas) ? d.etiquetas : [],
      votos: Number(d.votos ?? 0),
      respuestas: listaRespuestas.length,
      aceptadaId: d.aceptadaId ? String(d.aceptadaId) : null,
      oculta: Boolean(d.oculta),
      creadaEn: String(d.creadaEn ?? new Date().toISOString()),
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
        return { ok: false as const, status: 404 as const, error: "Pregunta no encontrada" };
      }

      const data = pregDoc.data()!;
      if (data.autorUid === usuarioUid) {
        return {
          ok: false as const,
          status: 403 as const,
          error: "No puedes votar tu propia publicación",
        };
      }

      const votoPrevio = votoDoc.exists ? (votoDoc.data()?.valor as 1 | -1) : null;
      const resultado = calcularNuevoEstadoVoto({
        votosActuales: Number(data.votos ?? 0),
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
      };
    });
  },

  async aceptarRespuesta(preguntaId, usuarioUid, respuestaId) {
    const db = obtenerFirestoreAdmin();
    const pregRef = db.collection("preguntas").doc(preguntaId);
    const respRef = pregRef.collection("respuestas").doc(respuestaId);

    const [pregDoc, respDoc] = await Promise.all([pregRef.get(), respRef.get()]);
    if (!pregDoc.exists || pregDoc.data()?.oculta) {
      return { ok: false, status: 404, error: "Pregunta no encontrada" };
    }
    if (pregDoc.data()?.autorUid !== usuarioUid) {
      return {
        ok: false,
        status: 403,
        error: "Solo el autor de la pregunta puede aceptar una respuesta",
      };
    }
    if (!respDoc.exists) {
      return { ok: false, status: 404, error: "Respuesta no encontrada" };
    }

    await pregRef.update({ aceptadaId: respuestaId });
    return { ok: true, aceptadaId: respuestaId };
  },
};

export function obtenerRepositorioPreguntas(): PreguntasRepository {
  return tieneCredencialesFirebaseAdmin()
    ? repositorioFirestore
    : repositorioMemoria;
}
