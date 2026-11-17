"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import { useDebounce } from "@/hooks/useDebounce";
import type { PreguntaItem } from "@/repositories/preguntas.mock";

type Orden = "recientes" | "populares";

export interface FiltrosIniciales {
  q: string;
  etiqueta: string;
  orden: Orden;
}

interface ListadoPreguntasProps {
  filtrosIniciales: FiltrosIniciales;
}

const LIMITE = 10;

interface RespuestaListado {
  items: PreguntaItem[];
  siguienteCursor: string | null;
}

function construirParametros(
  consulta: string,
  etiqueta: string,
  orden: Orden
): URLSearchParams {
  const parametros = new URLSearchParams();
  if (consulta.trim()) parametros.set("q", consulta.trim());
  if (etiqueta.trim()) parametros.set("etiqueta", etiqueta.trim());
  parametros.set("orden", orden);
  parametros.set("limite", String(LIMITE));
  return parametros;
}

export function ListadoPreguntas({ filtrosIniciales }: ListadoPreguntasProps) {
  const [preguntas, setPreguntas] = useState<PreguntaItem[]>([]);
  const [busqueda, setBusqueda] = useState(filtrosIniciales.q);
  const busquedaRetrasada = useDebounce(busqueda, 300);
  const [etiqueta, setEtiqueta] = useState(filtrosIniciales.etiqueta);
  const [orden, setOrden] = useState<Orden>(filtrosIniciales.orden);
  const [siguienteCursor, setSiguienteCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  /** Clave de la última consulta completada; sirve para derivar "cargando". */
  const [consultaCompletada, setConsultaCompletada] = useState<string | null>(
    null
  );
  const [cargandoMas, setCargandoMas] = useState(false);
  const centinelaRef = useRef<HTMLDivElement | null>(null);

  const claveConsulta = `${busquedaRetrasada.trim()}|${etiqueta.trim()}|${orden}`;
  const cargando = claveConsulta !== consultaCompletada;

  // Mantener la URL sincronizada con los filtros activos sin recargar.
  useEffect(() => {
    const parametros = construirParametros(
      busquedaRetrasada,
      etiqueta,
      orden
    );
    const cadena = parametros.toString();
    window.history.replaceState(null, "", cadena ? `/?${cadena}` : "/");
  }, [busquedaRetrasada, etiqueta, orden]);

  // Cargar la primera página cada vez que cambia la consulta.
  useEffect(() => {
    const controlador = new AbortController();
    const parametros = construirParametros(
      busquedaRetrasada,
      etiqueta,
      orden
    );

    fetch(`/api/preguntas?${parametros.toString()}`, {
      signal: controlador.signal,
    })
      .then(async (respuesta) => {
        if (!respuesta.ok) {
          const datos = await respuesta.json().catch(() => ({}));
          throw new Error(datos.error || "No se pudieron cargar las preguntas.");
        }
        return respuesta.json() as Promise<RespuestaListado>;
      })
      .then((datos) => {
        setPreguntas(datos.items);
        setSiguienteCursor(datos.siguienteCursor);
        setError(null);
      })
      .catch((excepcion: unknown) => {
        if (
          excepcion instanceof DOMException &&
          excepcion.name === "AbortError"
        ) {
          return;
        }
        setError(
          excepcion instanceof Error
            ? excepcion.message
            : "Ocurrió un error inesperado al consultar el foro."
        );
      })
      .finally(() => {
        if (!controlador.signal.aborted) {
          setConsultaCompletada(claveConsulta);
        }
      });

    return () => controlador.abort();
  }, [claveConsulta, busquedaRetrasada, etiqueta, orden, intento]);

  const cargarMas = useCallback(async () => {
    if (!siguienteCursor || cargandoMas) return;
    setCargandoMas(true);

    try {
      const parametros = construirParametros(
        busquedaRetrasada,
        etiqueta,
        orden
      );
      parametros.set("cursor", siguienteCursor);

      const respuesta = await fetch(`/api/preguntas?${parametros.toString()}`);
      if (!respuesta.ok) {
        throw new Error("No se pudieron cargar más preguntas.");
      }

      const datos = (await respuesta.json()) as RespuestaListado;

      setPreguntas((anteriores) => {
        const ids = new Set(anteriores.map((pregunta) => pregunta.id));
        return [
          ...anteriores,
          ...datos.items.filter((pregunta) => !ids.has(pregunta.id)),
        ];
      });
      setSiguienteCursor(datos.siguienteCursor);
    } catch (excepcion: unknown) {
      setError(
        excepcion instanceof Error
          ? excepcion.message
          : "No se pudieron cargar más preguntas."
      );
    } finally {
      setCargandoMas(false);
    }
  }, [siguienteCursor, cargandoMas, busquedaRetrasada, etiqueta, orden]);

  // Paginación automática al acercarse al final del listado.
  useEffect(() => {
    const nodo = centinelaRef.current;
    if (!nodo || !siguienteCursor) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          void cargarMas();
        }
      },
      { rootMargin: "200px" }
    );

    observador.observe(nodo);
    return () => observador.disconnect();
  }, [siguienteCursor, cargarMas]);

  function reintentar() {
    setIntento((numero) => numero + 1);
  }

  function limpiarFiltros() {
    setBusqueda("");
    setEtiqueta("");
  }

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
            Resuelve dudas académicas, vota las mejores explicaciones y consulta
            soluciones aceptadas.
          </p>
        </div>
      </div>

      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          reintentar();
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
            onChange={(evento) => setBusqueda(evento.target.value)}
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
            onChange={(evento) => setOrden(evento.target.value as Orden)}
            className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <option value="recientes">Más recientes</option>
            <option value="populares">Más votadas</option>
          </select>
        </div>

        {etiqueta && (
          <div className="flex items-center gap-2 sm:col-span-3">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Filtro activo:
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200">
              #{etiqueta}
              <button
                type="button"
                onClick={() => setEtiqueta("")}
                aria-label={`Quitar filtro de etiqueta ${etiqueta}`}
                className="ml-1 inline-flex min-h-6 min-w-6 items-center justify-center font-bold hover:text-red-700 dark:hover:text-red-300"
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
            onClick={reintentar}
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
          {(busqueda || etiqueta) && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-4 min-h-11 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {preguntas.map((pregunta) => (
              <QuestionCard
                key={pregunta.id}
                pregunta={pregunta}
                onSeleccionarEtiqueta={setEtiqueta}
              />
            ))}
          </div>

          {siguienteCursor && (
            <div ref={centinelaRef} className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => void cargarMas()}
                disabled={cargandoMas}
                className="min-h-11 rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {cargandoMas ? "Cargando más..." : "Cargar más preguntas"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
