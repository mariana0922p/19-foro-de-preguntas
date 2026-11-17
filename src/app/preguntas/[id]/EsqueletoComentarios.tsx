export function EsqueletoComentarios() {
  return (
    <section aria-labelledby="titulo-comentarios-cargando" className="mt-8">
      <p id="titulo-comentarios-cargando" className="sr-only">
        Cargando comentarios de la pregunta
      </p>
      <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-2 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </section>
  );
}
