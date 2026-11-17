import Link from "next/link";
import { FormularioComentario } from "./FormularioComentario";
import type { UsuarioSesion } from "@/lib/sesion";
import { crearServicioPreguntas } from "@/services/preguntas.service";

interface Props {
  preguntaId: string;
  usuario: UsuarioSesion | null;
}

export async function ComentariosPregunta({ preguntaId, usuario }: Props) {
  const comentarios = await crearServicioPreguntas().listarComentarios(
    preguntaId
  );

  return (
    <section aria-labelledby="titulo-comentarios" className="mt-8">
      <details className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <summary
          id="titulo-comentarios"
          className="cursor-pointer text-lg font-semibold text-slate-900 marker:text-blue-700 dark:text-slate-100"
        >
          Comentarios ({comentarios.length})
        </summary>

        <div className="mt-4 space-y-5">
          {comentarios.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Todavía no hay comentarios. Puedes aportar contexto o pedir
              aclaraciones.
            </p>
          ) : (
            <ul className="space-y-3">
              {comentarios.map((comentario) => (
                <li
                  key={comentario.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <p className="whitespace-pre-line text-slate-800 dark:text-slate-200">
                    {comentario.cuerpo}
                  </p>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Por{" "}
                    <Link
                      href={`/usuarios/${comentario.autorUid}`}
                      className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
                    >
                      {comentario.autorNombre}
                    </Link>{" "}
                    ·{" "}
                    <time dateTime={comentario.creadaEn}>
                      {new Date(comentario.creadaEn).toLocaleString("es-CO")}
                    </time>
                  </p>
                </li>
              ))}
            </ul>
          )}

          {usuario ? (
            <FormularioComentario preguntaId={preguntaId} />
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <Link
                href={`/login?next=/preguntas/${encodeURIComponent(
                  preguntaId
                )}`}
                className="font-semibold text-blue-700 underline dark:text-blue-400"
              >
                Inicia sesión
              </Link>{" "}
              para comentar.
            </p>
          )}
        </div>
      </details>
    </section>
  );
}
