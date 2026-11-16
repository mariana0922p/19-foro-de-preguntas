"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearPreguntaSchema } from "@/schemas/pregunta.schema";

export default function NuevaPreguntaPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [etiquetasTexto, setEtiquetasTexto] = useState("");
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setErroresCampo({});
    setErrorGeneral(null);

    const etiquetas = etiquetasTexto
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const validacion = crearPreguntaSchema.safeParse({
      titulo,
      cuerpo,
      etiquetas,
    });

    if (!validacion.success) {
      const mapa: Record<string, string> = {};
      for (const issue of validacion.error.issues) {
        const campo = String(issue.path[0] ?? "general");
        if (!mapa[campo]) mapa[campo] = issue.message;
      }
      setErroresCampo(mapa);
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/preguntas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validacion.data),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorGeneral(data.error || "No se pudo publicar la pregunta.");
        return;
      }

      router.push(`/preguntas/${data.pregunta.id}`);
    } catch {
      setErrorGeneral("Error de conexión al guardar la pregunta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section aria-labelledby="titulo-nueva-pregunta" className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          ← Volver al listado
        </Link>
        <h1
          id="titulo-nueva-pregunta"
          className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Publicar una nueva pregunta
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Describe tu duda con claridad para que otros estudiantes puedan ayudarte.
        </p>
      </div>

      {errorGeneral && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
        >
          {errorGeneral}
        </div>
      )}

      <form
        onSubmit={manejarEnvio}
        noValidate
        className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <label
            htmlFor="input-titulo"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Título de la pregunta (10 a 150 caracteres)
          </label>
          <input
            id="input-titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            aria-invalid={Boolean(erroresCampo.titulo)}
            aria-describedby={erroresCampo.titulo ? "error-titulo" : undefined}
            placeholder="Ej. ¿Cómo manejar transacciones en Firestore con Admin SDK?"
            className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
          {erroresCampo.titulo && (
            <p id="error-titulo" role="alert" className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-400">
              {erroresCampo.titulo}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="input-cuerpo"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Detalle de la duda (mínimo 20 caracteres)
          </label>
          <textarea
            id="input-cuerpo"
            rows={6}
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            aria-invalid={Boolean(erroresCampo.cuerpo)}
            aria-describedby={erroresCampo.cuerpo ? "error-cuerpo" : undefined}
            placeholder="Explica qué intentaste, qué error obtuviste y qué resultado esperas..."
            className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
          {erroresCampo.cuerpo && (
            <p id="error-cuerpo" role="alert" className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-400">
              {erroresCampo.cuerpo}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="input-etiquetas"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Etiquetas (separadas por coma, entre 1 y 5)
          </label>
          <input
            id="input-etiquetas"
            type="text"
            value={etiquetasTexto}
            onChange={(e) => setEtiquetasTexto(e.target.value)}
            aria-invalid={Boolean(erroresCampo.etiquetas)}
            aria-describedby={erroresCampo.etiquetas ? "error-etiquetas" : undefined}
            placeholder="Ej. nextjs, typescript, firebase"
            className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
          {erroresCampo.etiquetas && (
            <p id="error-etiquetas" role="alert" className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-400">
              {erroresCampo.etiquetas}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={enviando}
            className="min-h-11 rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {enviando ? "Publicando..." : "Publicar pregunta"}
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
