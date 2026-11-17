import { ErrorApi } from "@/lib/errores";
import type { UsuarioSesion } from "@/lib/http";
import {
  obtenerRepositorioPreguntas,
  type PreguntasRepository,
} from "@/repositories/preguntas.repository";
import {
  ajustarReputacion,
  asegurarPerfilUsuario,
} from "@/repositories/usuarios.repository";
import type {
  CrearComentarioInput,
  CrearPreguntaInput,
  CrearRespuestaInput,
  FiltroPreguntasInput,
} from "@/schemas/pregunta.schema";
import {
  PUNTOS_POR_RESPUESTA_ACEPTADA,
  variacionPorVotos,
} from "@/services/reputacion.service";

export const LIMITE_POR_DEFECTO = 20;

export function crearServicioPreguntas(
  repo: PreguntasRepository = obtenerRepositorioPreguntas()
) {
  return {
    async listar(filtros: FiltroPreguntasInput) {
      let items = await repo.listar();

      if (filtros.q) {
        const termino = filtros.q.toLowerCase();
        items = items.filter(
          (p) =>
            p.titulo.toLowerCase().includes(termino) ||
            p.cuerpo.toLowerCase().includes(termino)
        );
      }

      if (filtros.etiqueta) {
        const tag = filtros.etiqueta.toLowerCase();
        items = items.filter((p) =>
          p.etiquetas.some((e) => e.toLowerCase() === tag)
        );
      }

      items = [...items].sort((a, b) => {
        if (filtros.orden === "populares") return b.votos - a.votos;
        return new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime();
      });

      const limite = filtros.limite ?? LIMITE_POR_DEFECTO;
      const indiceCursor = filtros.cursor
        ? items.findIndex((p) => p.id === filtros.cursor)
        : -1;
      const inicio = indiceCursor >= 0 ? indiceCursor + 1 : 0;
      const pagina = items.slice(inicio, inicio + limite);
      const hayMas = inicio + limite < items.length;
      const siguienteCursor = hayMas ? (pagina[pagina.length - 1]?.id ?? null) : null;

      return { items: pagina, siguienteCursor };
    },

    async listarPorAutor(autorUid: string) {
      return repo.listarPorAutor(autorUid);
    },

    async obtenerDetalle(id: string) {
      const pregunta = await repo.obtenerPorId(id);
      if (!pregunta) {
        throw new ErrorApi(404, "Pregunta no encontrada");
      }
      return pregunta;
    },

    async crearPregunta(usuario: UsuarioSesion, input: CrearPreguntaInput) {
      await asegurarPerfilUsuario(usuario.uid, usuario.nombre);
      return repo.crear({
        autorUid: usuario.uid,
        autorNombre: usuario.nombre,
        titulo: input.titulo,
        cuerpo: input.cuerpo,
        etiquetas: input.etiquetas,
      });
    },

    async responderPregunta(
      usuario: UsuarioSesion,
      preguntaId: string,
      input: CrearRespuestaInput
    ) {
      await asegurarPerfilUsuario(usuario.uid, usuario.nombre);
      const respuesta = await repo.agregarRespuesta(preguntaId, {
        autorUid: usuario.uid,
        autorNombre: usuario.nombre,
        cuerpo: input.cuerpo,
      });

      if (!respuesta) {
        throw new ErrorApi(404, "Pregunta no encontrada");
      }
      return respuesta;
    },

    async votarPregunta(
      usuario: UsuarioSesion,
      preguntaId: string,
      valor: 1 | -1
    ) {
      const resultado = await repo.votar(preguntaId, usuario.uid, valor);
      if (!resultado.ok) {
        throw new ErrorApi(resultado.status, resultado.error);
      }

      await ajustarReputacion(
        resultado.autorUid,
        variacionPorVotos(resultado.variacion)
      );

      return { votos: resultado.votos, votoUsuario: resultado.votoUsuario };
    },

    async votarRespuesta(
      usuario: UsuarioSesion,
      preguntaId: string,
      respuestaId: string,
      valor: 1 | -1
    ) {
      const resultado = await repo.votarRespuesta(
        preguntaId,
        respuestaId,
        usuario.uid,
        valor
      );
      if (!resultado.ok) {
        throw new ErrorApi(resultado.status, resultado.error);
      }

      await ajustarReputacion(
        resultado.autorUid,
        variacionPorVotos(resultado.variacion)
      );

      return { votos: resultado.votos, votoUsuario: resultado.votoUsuario };
    },

    async aceptarRespuesta(
      usuario: UsuarioSesion,
      preguntaId: string,
      respuestaId: string
    ) {
      const resultado = await repo.aceptarRespuesta(
        preguntaId,
        usuario.uid,
        respuestaId
      );
      if (!resultado.ok) {
        throw new ErrorApi(resultado.status, resultado.error);
      }

      const mismoAutor =
        resultado.aceptadaPreviaUid !== null &&
        resultado.aceptadaPreviaUid === resultado.autorRespuestaUid;

      if (!mismoAutor) {
        if (resultado.aceptadaPreviaUid) {
          await ajustarReputacion(
            resultado.aceptadaPreviaUid,
            -PUNTOS_POR_RESPUESTA_ACEPTADA
          );
        }
        if (resultado.autorRespuestaUid) {
          await ajustarReputacion(
            resultado.autorRespuestaUid,
            PUNTOS_POR_RESPUESTA_ACEPTADA
          );
        }
      }

      return { aceptadaId: resultado.aceptadaId };
    },

    async moderarPregunta(
      usuario: UsuarioSesion,
      preguntaId: string,
      oculta: boolean
    ) {
      if (usuario.rol !== "admin") {
        throw new ErrorApi(
          403,
          "Solo los moderadores pueden ocultar o restaurar preguntas"
        );
      }
      const actualizada = await repo.moderar(preguntaId, oculta);
      if (!actualizada) {
        throw new ErrorApi(404, "Pregunta no encontrada");
      }
      return { id: preguntaId, oculta };
    },

    async listarComentarios(preguntaId: string) {
      const pregunta = await repo.obtenerPorId(preguntaId);
      if (!pregunta) {
        throw new ErrorApi(404, "Pregunta no encontrada");
      }
      return repo.listarComentarios(preguntaId);
    },

    async agregarComentario(
      usuario: UsuarioSesion,
      preguntaId: string,
      input: CrearComentarioInput
    ) {
      const comentario = await repo.agregarComentario(preguntaId, {
        autorUid: usuario.uid,
        autorNombre: usuario.nombre,
        cuerpo: input.cuerpo,
      });

      if (!comentario) {
        throw new ErrorApi(404, "Pregunta no encontrada");
      }
      return comentario;
    },
  };
}
