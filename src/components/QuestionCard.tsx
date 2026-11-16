import Link from "next/link";
import type { PreguntaItem } from "@/repositories/preguntas.mock";

interface QuestionCardProps {
  pregunta: PreguntaItem;
  onSeleccionarEtiqueta?: (etiqueta: string) => void;
}

export function QuestionCard({
  pregunta,
  onSeleccionarEtiqueta,
}: QuestionCardProps) {
  const tieneAceptada = Boolean(pregunta.aceptadaId);
  const fechaFormateada = new Date(pregunta.creadaEn).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className="flex shrink-0 gap-3 text-xs sm:w-28 sm:flex-col sm:gap-2"
          aria-label="Estadísticas de la pregunta"
        >
          <div className="rounded-md border border-slate-200 px-2.5 py-1.5 text-center dark:border-slate-700">
            <span className="block text-base font-semibold text-slate-900 dark:text-slate-100">
              {pregunta.votos}
            </span>
            <span className="text-slate-600 dark:text-slate-400">votos</span>
          </div>

          <div
            className={`rounded-md border px-2.5 py-1.5 text-center ${
              tieneAceptada
                ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200"
                : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            <span className="block text-base font-semibold">
              {pregunta.respuestas}
            </span>
            <span>
              {tieneAceptada ? "✓ resuelta" : "respuestas"}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
            <Link
              href={`/preguntas/${pregunta.id}`}
              className="hover:text-blue-700 dark:hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {pregunta.titulo}
            </Link>
          </h2>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-[70ch]">
            {pregunta.cuerpo}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap gap-2" aria-label="Etiquetas">
              {pregunta.etiquetas.map((etiqueta) => (
                <li key={etiqueta}>
                  {onSeleccionarEtiqueta ? (
                    <button
                      type="button"
                      onClick={() => onSeleccionarEtiqueta(etiqueta)}
                      className="min-h-8 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      #{etiqueta}
                    </button>
                  ) : (
                    <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                      #{etiqueta}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Por <strong className="font-medium text-slate-700 dark:text-slate-200">{pregunta.autorNombre}</strong> ·{" "}
              <time dateTime={pregunta.creadaEn}>{fechaFormateada}</time>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
