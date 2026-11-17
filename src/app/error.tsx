"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[UI_ERROR]", error.message);
  }, [error]);

  return (
    <section
      role="alert"
      className="mx-auto max-w-xl rounded-lg border border-red-300 bg-red-50 p-6 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
    >
      <h1 className="text-xl font-bold">Algo salió mal</h1>
      <p className="mt-2 text-sm">
        No pudimos mostrar esta página. Puedes reintentar o volver al listado
        de preguntas.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
