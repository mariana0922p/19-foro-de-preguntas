import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foro Estudiantil · Preguntas y Respuestas",
  description:
    "Comunidad de estudiantes que se ayudan entre sí con dudas de clase, votos y respuestas aceptadas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased">
        <a
          href="#contenido-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-blue-700 focus:px-4 focus:py-2 focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-blue-400"
        >
          Saltar al contenido
        </a>

        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-blue-700 dark:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Foro Académico Q&amp;A
            </Link>

            <nav aria-label="Navegación principal">
              <ul className="flex flex-wrap items-center gap-4 text-sm font-medium">
                <li>
                  <Link
                    href="/"
                    className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Preguntas
                  </Link>
                </li>
                <li>
                  <span
                    aria-disabled="true"
                    className="inline-block rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"
                    title="Disponible en el Hito 2"
                  >
                    + Hacer pregunta (Hito 2)
                  </span>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main
          id="contenido-principal"
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-8"
        >
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <div className="mx-auto max-w-5xl px-4">
            Proyecto 19 · Foro de Preguntas y Respuestas · Next.js 16 &amp; TypeScript
          </div>
        </footer>
      </body>
    </html>
  );
}
