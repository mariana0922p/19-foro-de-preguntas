"use client";

import { useEffect, useState } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import type { PreguntaItem } from "@/repositories/preguntas.mock";

export default function HomePage() {
  const [preguntas, setPreguntas] = useState<PreguntaItem[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [etiquetaActiva, setEtiquetaActiva] = useState("");
  const [orden, setOrden] = useState<"recientes" | "populares">("recientes");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams();
    if (busqueda.trim()) params.set("q", busqueda.trim());
    if (etiquetaActiva.trim()) params.set("etiqueta", etiquetaActiva.trim());
    params.set("orden", orden);

    fetch(`/api/preguntas?${params.toString()}`, { signal: controller.signal })
      .then(async (respuesta) => {
        if (!respuesta.ok) {
          const data = await respuesta.json().catch(() => ({}));
          throw new Error(data.error || "No se pudieron cargar las preguntas.");
        }
        return respuesta.json() as Promise<{ items: PreguntaItem[] }>;
      })
      .then((data) => {
        setPreguntas(data.items);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error inesperado al consultar el foro."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });

    return () => controller.abort();
  }, [busqueda, etiquetaActiva, orden, intento]);

  return (
    <section aria-labelledby="titulo-foro" className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            id="titulo-foro"
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl"
          >
            Preguntas de la comunidad
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Resuelve dudas académicas, vota las mejores explicaciones y consulta soluciones aceptadas.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setCargando(true);
          setIntento((n) => n + 1);
        }}
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3"
        aria-label="Filtrar preguntas"
      >
        <div className="sm:col-span-2">
          <label
            htmlFor="campo-busqueda"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300"
          >
            Buscar por título o contenido
          </label>
          <input
            id="campo-busqueda"
            type="search"
            value={busqueda}
            onChange={(e) => {
              setCargando(true);
              setBusqueda(e.target.value);
            }}
            placeholder="Ej. lista enlazada, Next.js, Zod..."
            className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>

        <div>
          <label
            htmlFor="selector-orden"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300"
          >
            Ordenar por
          </label>
          <select
            id="selector-orden"
            value={orden}
            onChange={(e) => {
              setCargando(true);
              setOrden(e.target.value as "recientes" | "populares");
            }}
            className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <option value="recientes">Más recientes</option>
            <option value="populares">Más votadas</option>
          </select>
        </div>

        {etiquetaActiva && (
          <div className="flex items-center gap-2 sm:col-span-3">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Filtro activo:
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200">
              #{etiquetaActiva}
              <button
                type="button"
                onClick={() => {
                  setCargando(true);
                  setEtiquetaActiva("");
                }}
                aria-label={`Quitar filtro de etiqueta ${etiquetaActiva}`}
                className="ml-1 font-bold hover:text-red-700 dark:hover:text-red-300"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </form>

      <div aria-live="polite" className="sr-only">
        {cargando
          ? "Cargando preguntas..."
          : error
          ? `Error: ${error}`
          : `Se encontraron ${preguntas.length} preguntas.`}
      </div>

      {cargando ? (
        <div className="space-y-4" aria-label="Cargando listado de preguntas">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-3 h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
        >
          <h2 className="text-base font-semibold">
            No pudimos cargar las preguntas
          </h2>
          <p className="mt-1 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => {
              setCargando(true);
              setIntento((n) => n + 1);
            }}
            className="mt-4 min-h-11 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            Reintentar
          </button>
        </div>
      ) : preguntas.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            No hay preguntas que coincidan con tu búsqueda
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Prueba con otras palabras clave o limpia los filtros aplicados.
          </p>
          {(busqueda || etiquetaActiva) && (
            <button
              type="button"
              onClick={() => {
                setCargando(true);
                setBusqueda("");
                setEtiquetaActiva("");
              }}
              className="mt-4 min-h-11 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {preguntas.map((pregunta) => (
            <QuestionCard
              key={pregunta.id}
              pregunta={pregunta}
              onSeleccionarEtiqueta={(tag) => {
                setCargando(true);
                setEtiquetaActiva(tag);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
