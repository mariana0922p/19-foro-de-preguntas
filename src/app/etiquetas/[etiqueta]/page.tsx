import type { Metadata } from "next";
import Link from "next/link";
import { QuestionCard } from "@/components/QuestionCard";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ etiqueta: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { etiqueta } = await params;
  return {
    title: `#${etiqueta} · Preguntas del foro`,
    description: `Preguntas etiquetadas con ${etiqueta} en el foro académico.`,
  };
}

export default async function EtiquetaPage({ params }: Props) {
  const { etiqueta } = await params;
  const etiquetaDecodificada = decodeURIComponent(etiqueta);

  const { items } = await crearServicioPreguntas().listar({
    etiqueta: etiquetaDecodificada,
    orden: "recientes",
    limite: 50,
  });

  return (
    <section aria-labelledby="titulo-etiqueta" className="space-y-6">
      <nav aria-label="Ruta de navegación">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          ← Todas las preguntas
        </Link>
      </nav>

      <header>
        <h1
          id="titulo-etiqueta"
          className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl"
        >
          Preguntas con la etiqueta{" "}
          <span className="text-blue-700 dark:text-blue-400">
            #{etiquetaDecodificada}
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {items.length}{" "}
          {items.length === 1
            ? "pregunta encontrada"
            : "preguntas encontradas"}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Aún no hay preguntas con esta etiqueta
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Sé el primero en plantear una duda con #{etiquetaDecodificada}.
          </p>
          <Link
            href="/preguntas/nueva"
            className="mt-4 inline-flex min-h-11 items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Hacer una pregunta
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((pregunta) => (
            <QuestionCard key={pregunta.id} pregunta={pregunta} />
          ))}
        </div>
      )}
    </section>
  );
}
