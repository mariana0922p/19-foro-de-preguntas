import { ErrorApi } from "@/lib/errores";
import type { UsuarioSesion } from "@/lib/http";
import {
  obtenerRepositorioPreguntas,
  type PreguntasRepository,
} from "@/repositories/preguntas.repository";
import type {
  CrearPreguntaInput,
  CrearRespuestaInput,
  FiltroPreguntasInput,
} from "@/schemas/pregunta.schema";

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

      return { items, siguienteCursor: null };
    },

    async obtenerDetalle(id: string) {
      const pregunta = await repo.obtenerPorId(id);
      if (!pregunta) {
        throw new ErrorApi(404, "Pregunta no encontrada");
      }
      return pregunta;
    },

    async crearPregunta(usuario: UsuarioSesion, input: CrearPreguntaInput) {
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
  };
}
