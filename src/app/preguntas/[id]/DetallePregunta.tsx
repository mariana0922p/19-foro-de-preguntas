"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VoteControls } from "@/components/VoteControls";
import { renderizarMarkdown } from "@/lib/markdown";
import type { UsuarioSesion } from "@/lib/sesion";
import { crearRespuestaSchema } from "@/schemas/pregunta.schema";
import type { PreguntaItem } from "@/repositories/preguntas.mock";

interface DetallePreguntaProps {
  pregunta: PreguntaItem;
  usuario: UsuarioSesion | null;
}

export function DetallePregunta({ pregunta, usuario }: DetallePreguntaProps) {
  const router = useRouter();

  const [nuevaRespuesta, setNuevaRespuesta] = useState("");
  const [errorRespuesta, setErrorRespuesta] = useState<string | null>(null);
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState<string | null>(null);
  const [requiereSesion, setRequiereSesion] = useState(false);

  const esAutorPregunta = Boolean(
    usuario && usuario.uid === pregunta.autorUid
  );

  async function manejarEnviarRespuesta(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorRespuesta(null);
    setMensajeAccion(null);

    const validacion = crearRespuestaSchema.safeParse({
      cuerpo: nuevaRespuesta,
    });
    if (!validacion.success) {
      setErrorRespuesta(
        validacion.error.issues[0]?.message ?? "Respuesta inválida"
      );
      return;
    }

    setEnviandoRespuesta(true);
    try {
      const respuesta = await fetch(
        `/api/preguntas/${encodeURIComponent(pregunta.id)}/respuestas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validacion.data),
        }
      );

      const datos = await respuesta.json().catch(() => ({}));

      if (respuesta.status === 401) {
        setRequiereSesion(true);
        setErrorRespuesta("Debes iniciar sesión para publicar una respuesta.");
        return;
      }
      if (!respuesta.ok) {
        setErrorRespuesta(datos.error || "No se pudo publicar la respuesta.");
        return;
      }

      setNuevaRespuesta("");
      setMensajeAccion("Respuesta publicada correctamente.");
      router.refresh();
    } catch {
      setErrorRespuesta("Error de conexión al publicar la respuesta.");
    } finally {
      setEnviandoRespuesta(false);
    }
  }

  async function manejarAceptarRespuesta(respuestaId: string) {
    setMensajeAccion(null);
    setRequiereSesion(false);

    try {
      const respuesta = await fetch(
        `/api/preguntas/${encodeURIComponent(pregunta.id)}/aceptar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ respuestaId }),
        }
      );
      const datos = await respuesta.json().catch(() => ({}));

      if (respuesta.status === 401) {
        setRequiereSesion(true);
        setMensajeAccion("Debes iniciar sesión para aceptar una respuesta.");
        return;
      }
      if (!respuesta.ok) {
        setMensajeAccion(datos.error || "No se pudo aceptar la respuesta.");
        return;
      }

      setMensajeAccion("Respuesta marcada como aceptada.");
      router.refresh();
    } catch {
      setMensajeAccion("Error de conexión al aceptar la respuesta.");
    }
  }

  return (
    <div className="space-y-8">
      <nav aria-label="Ruta de navegación">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          ← Volver a todas las preguntas
        </Link>
      </nav>

      <article className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <header className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <h1 className="text-2xl font-bold leading-snug text-slate-900 dark:text-slate-100">
            {pregunta.titulo}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <span>
              Publicado por{" "}
              <Link
                href={`/usuarios/${pregunta.autorUid}`}
                className="font-bold text-blue-700 hover:underline dark:text-blue-400"
              >
                {pregunta.autorNombre}
              </Link>
            </span>
            <time dateTime={pregunta.creadaEn}>
              {new Date(pregunta.creadaEn).toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        </header>

        <div className="mt-5 space-y-3 text-base leading-relaxed text-slate-800 dark:text-slate-200 max-w-[70ch]">
          {renderizarMarkdown(pregunta.cuerpo)}
        </div>

        <ul
          className="mt-6 flex flex-wrap gap-2"
          aria-label="Etiquetas de la pregunta"
        >
          {pregunta.etiquetas.map((etiqueta) => (
            <li key={etiqueta}>
              <Link
                href={`/etiquetas/${encodeURIComponent(etiqueta)}`}
                className="inline-flex min-h-8 items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
              >
                #{etiqueta}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
          <VoteControls
            preguntaId={pregunta.id}
            votosIniciales={pregunta.votos}
            esAutorPropio={esAutorPregunta}
          />
        </div>
      </article>

      {mensajeAccion && (
        <div
          aria-live="polite"
          className="rounded-md border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200"
        >
          {mensajeAccion}
          {requiereSesion && (
            <>
              {" "}
              <Link href="/login" className="font-semibold underline">
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      )}

      <section aria-labelledby="titulo-respuestas" className="space-y-4">
        <h2
          id="titulo-respuestas"
          className="text-xl font-bold text-slate-900 dark:text-slate-100"
        >
          {pregunta.listaRespuestas.length}{" "}
          {pregunta.listaRespuestas.length === 1 ? "Respuesta" : "Respuestas"}
        </h2>

        {pregunta.listaRespuestas.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Aún no hay respuestas para esta pregunta. ¡Sé el primero en
            responder!
          </p>
        ) : (
          <div className="space-y-4">
            {pregunta.listaRespuestas.map((respuesta) => {
              const esAceptada = pregunta.aceptadaId === respuesta.id;
              return (
                <article
                  key={respuesta.id}
                  className={`rounded-lg border p-5 ${
                    esAceptada
                      ? "border-emerald-600 bg-emerald-50/40 dark:border-emerald-500 dark:bg-emerald-950/30"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    {esAceptada ? (
                      <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                        ✓ Respuesta aceptada por el autor
                      </p>
                    ) : (
                      <span />
                    )}

                    {esAutorPregunta && !esAceptada && (
                      <button
                        type="button"
                        onClick={() => manejarAceptarRespuesta(respuesta.id)}
                        className="min-h-11 rounded-md border border-emerald-700 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                      >
                        Marcar como aceptada
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 text-base leading-relaxed text-slate-800 dark:text-slate-200 max-w-[70ch]">
                    {renderizarMarkdown(respuesta.cuerpo)}
                  </div>

                  <div className="mt-4 border-t border-slate-200/70 pt-3 dark:border-slate-800">
                    <VoteControls
                      preguntaId={pregunta.id}
                      votosIniciales={respuesta.votos}
                      endpoint={`/api/preguntas/${encodeURIComponent(
                        pregunta.id
                      )}/respuestas/${encodeURIComponent(respuesta.id)}/votos`}
                      descripcion="Votar esta respuesta"
                      esAutorPropio={usuario?.uid === respuesta.autorUid}
                    />
                  </div>

                  <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span>
                      Respondido por{" "}
                      <Link
                        href={`/usuarios/${respuesta.autorUid}`}
                        className="font-bold text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {respuesta.autorNombre}
                      </Link>{" "}
                      ·{" "}
                      <time dateTime={respuesta.creadaEn}>
                        {new Date(respuesta.creadaEn).toLocaleDateString(
                          "es-CO"
                        )}
                      </time>
                    </span>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section
        aria-labelledby="titulo-nueva-respuesta"
        className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <h2
          id="titulo-nueva-respuesta"
          className="text-lg font-bold text-slate-900 dark:text-slate-100"
        >
          Tu respuesta
        </h2>

        {usuario ? (
          <form
            onSubmit={manejarEnviarRespuesta}
            noValidate
            className="mt-4 space-y-4"
          >
            <div>
              <label
                htmlFor="textarea-respuesta"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Escribe tu explicación (mínimo 20 caracteres). Puedes usar
                Markdown.
              </label>
              <textarea
                id="textarea-respuesta"
                rows={5}
                value={nuevaRespuesta}
                onChange={(evento) => setNuevaRespuesta(evento.target.value)}
                aria-invalid={Boolean(errorRespuesta)}
                aria-describedby={errorRespuesta ? "error-respuesta" : undefined}
                placeholder="Comparte una solución clara y bien fundamentada..."
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              />
              {errorRespuesta && (
                <p
                  id="error-respuesta"
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-400"
                >
                  {errorRespuesta}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={enviandoRespuesta}
              className="min-h-11 rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              {enviandoRespuesta
                ? "Publicando respuesta..."
                : "Publicar respuesta"}
            </button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            <Link
              href={`/login?next=/preguntas/${encodeURIComponent(pregunta.id)}`}
              className="font-semibold text-blue-700 underline dark:text-blue-400"
            >
              Inicia sesión
            </Link>{" "}
            para responder esta pregunta.
          </p>
        )}
      </section>
    </div>
  );
}
