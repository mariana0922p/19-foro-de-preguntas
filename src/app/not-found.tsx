import Link from "next/link";

export default function NotFound() {
  return (
    <section
      aria-labelledby="titulo-404"
      className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
        Error 404
      </p>
      <h1
        id="titulo-404"
        className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100"
      >
        No encontramos esa página
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        La pregunta, etiqueta o perfil que buscas no existe o fue ocultado por
        moderación.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex min-h-11 items-center rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        Volver al foro
      </Link>
    </section>
  );
}
