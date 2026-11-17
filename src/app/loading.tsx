export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p className="sr-only">Cargando contenido...</p>
      <div className="h-9 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
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
  );
}
