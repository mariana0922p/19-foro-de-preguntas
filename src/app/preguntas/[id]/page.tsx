"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { PreguntaItem } from "@/repositories/preguntas.mock";

export default function DetallePreguntaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [pregunta, setPregunta] = useState<PreguntaItem | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/preguntas/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 404) {
          throw new Error("La pregunta solicitada no existe o fue ocultada.");
        }
        if (!res.ok) {
          throw new Error("Error al obtener el detalle de la pregunta.");
        }
        return res.json() as Promise<{ pregunta: PreguntaItem }>;
      })
      .then((data) => {
        setPregunta(data.pregunta);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPregunta(null);
        setError(
          err instanceof Error ? err.message : "Error inesperado de conexión."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });

    return () => controller.abort();
  }, [id, intento]);

  if (cargando) {
    return (
      <div className="space-y-4" aria-label="Cargando detalle de pregunta">
        <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (error || !pregunta) {
    return (
      <section
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
      >
        <h1 className="text-xl font-bold">No se pudo mostrar la pregunta</h1>
        <p className="mt-2 text-sm">{error}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setCargando(true);
              setIntento((n) => n + 1);
            }}
            className="min-h-11 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Volver al listado
          </Link>
        </div>
      </section>
    );
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
              Publicado por <strong>{pregunta.autorNombre}</strong>
            </span>
            <time dateTime={pregunta.creadaEn}>
              {new Date(pregunta.creadaEn).toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span>Votos: {pregunta.votos}</span>
          </div>
        </header>

        <div className="mt-5 whitespace-pre-line text-base leading-relaxed text-slate-800 dark:text-slate-200 max-w-[70ch]">
          {pregunta.cuerpo}
        </div>

        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Etiquetas de la pregunta">
          {pregunta.etiquetas.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200"
            >
              #{tag}
            </li>
          ))}
        </ul>
      </article>

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
            Aún no hay respuestas para esta pregunta.
          </p>
        ) : (
          <div className="space-y-4">
            {pregunta.listaRespuestas.map((resp) => {
              const esAceptada = pregunta.aceptadaId === resp.id;
              return (
                <article
                  key={resp.id}
                  className={`rounded-lg border p-5 ${
                    esAceptada
                      ? "border-emerald-600 bg-emerald-50/40 dark:border-emerald-500 dark:bg-emerald-950/30"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  {esAceptada && (
                    <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                      ✓ Respuesta aceptada por el autor
                    </p>
                  )}

                  <p className="whitespace-pre-line text-base leading-relaxed text-slate-800 dark:text-slate-200 max-w-[70ch]">
                    {resp.cuerpo}
                  </p>

                  <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                    <span>
                      Respondido por <strong>{resp.autorNombre}</strong> ·{" "}
                      <time dateTime={resp.creadaEn}>
                        {new Date(resp.creadaEn).toLocaleDateString("es-CO")}
                      </time>
                    </span>
                    <span className="font-medium">Votos: {resp.votos}</span>
                  </footer>

                  <details className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                    <summary className="cursor-pointer font-medium hover:text-slate-900 dark:hover:text-slate-200">
                      Ver metadatos de verificación
                    </summary>
                    <p className="mt-1.5 pl-4">
                      ID de respuesta: <code>{resp.id}</code> · Autor UID:{" "}
                      <code>{resp.autorUid}</code>
                    </p>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
