import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuestionCard } from "@/components/QuestionCard";
import {
  obtenerNombreDeAuth,
  obtenerPerfilUsuario,
} from "@/repositories/usuarios.repository";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ uid: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uid } = await params;
  const perfil = await obtenerPerfilUsuario(uid);
  return {
    title: `${perfil?.nombre ?? "Perfil"} · Foro Académico`,
    description: "Perfil y reputación de un estudiante del foro.",
  };
}

export default async function UsuarioPage({ params }: Props) {
  const { uid } = await params;

  const [perfil, nombreAuth, preguntas] = await Promise.all([
    obtenerPerfilUsuario(uid),
    obtenerNombreDeAuth(uid),
    crearServicioPreguntas().listarPorAutor(uid),
  ]);

  if (!perfil && !nombreAuth && preguntas.length === 0) {
    notFound();
  }

  const nombre = perfil?.nombre ?? nombreAuth ?? "Estudiante";
  const reputacion = perfil?.reputacion ?? 0;
  const respuestasAceptadas = preguntas.filter((p) => p.aceptadaId).length;

  return (
    <section aria-labelledby="titulo-perfil" className="space-y-6">
      <nav aria-label="Ruta de navegación">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          ← Todas las preguntas
        </Link>
      </nav>

      <header className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h1
          id="titulo-perfil"
          className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          {nombre}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Perfil público de la comunidad
        </p>

        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 p-4 dark:border-slate-700">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Reputación
            </dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {reputacion}
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 p-4 dark:border-slate-700">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Preguntas
            </dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {preguntas.length}
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 p-4 dark:border-slate-700">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Preguntas resueltas
            </dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {respuestasAceptadas}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-slate-600 dark:text-slate-400">
          La reputación suma 5 puntos por cada voto recibido y 15 por cada
          respuesta aceptada. La calcula el servidor.
        </p>
      </header>

      <section aria-labelledby="titulo-preguntas-autor" className="space-y-4">
        <h2
          id="titulo-preguntas-autor"
          className="text-xl font-bold text-slate-900 dark:text-slate-100"
        >
          Preguntas publicadas
        </h2>

        {preguntas.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Este usuario todavía no ha publicado preguntas.
          </p>
        ) : (
          preguntas.map((pregunta) => (
            <QuestionCard key={pregunta.id} pregunta={pregunta} />
          ))
        )}
      </section>
    </section>
  );
}
