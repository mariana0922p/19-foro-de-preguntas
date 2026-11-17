import { Suspense, cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComentariosPregunta } from "./ComentariosPregunta";
import { DetallePregunta } from "./DetallePregunta";
import { EsqueletoComentarios } from "./EsqueletoComentarios";
import { leerUsuarioSesion } from "@/lib/sesion";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const cargarPregunta = cache(async (id: string) => {
  try {
    return await crearServicioPreguntas().obtenerDetalle(id);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pregunta = await cargarPregunta(id);

  if (!pregunta) {
    return { title: "Pregunta no encontrada · Foro Académico" };
  }

  return {
    title: `${pregunta.titulo} · Foro Académico`,
    description: pregunta.cuerpo.slice(0, 150),
  };
}

export default async function PreguntaPage({ params }: Props) {
  const { id } = await params;
  const pregunta = await cargarPregunta(id);

  if (!pregunta) {
    notFound();
  }

  const usuario = await leerUsuarioSesion();

  return (
    <>
      <DetallePregunta pregunta={pregunta} usuario={usuario} />

      <Suspense fallback={<EsqueletoComentarios />}>
        <ComentariosPregunta preguntaId={pregunta.id} usuario={usuario} />
      </Suspense>
    </>
  );
}
