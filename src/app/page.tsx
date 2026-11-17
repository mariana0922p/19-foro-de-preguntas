import type { Metadata } from "next";
import {
  ListadoPreguntas,
  type FiltrosIniciales,
} from "@/components/ListadoPreguntas";

export const metadata: Metadata = {
  title: "Foro Académico · Preguntas de la comunidad",
  description:
    "Publica dudas académicas, responde, vota y consulta soluciones aceptadas.",
};

interface Props {
  searchParams: Promise<{
    q?: string | string[];
    etiqueta?: string | string[];
    orden?: string | string[];
  }>;
}

function primerValor(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? "";
  return valor ?? "";
}

export default async function HomePage({ searchParams }: Props) {
  const parametros = await searchParams;

  const filtrosIniciales: FiltrosIniciales = {
    q: primerValor(parametros.q),
    etiqueta: primerValor(parametros.etiqueta),
    orden: primerValor(parametros.orden) === "populares" ? "populares" : "recientes",
  };

  return <ListadoPreguntas filtrosIniciales={filtrosIniciales} />;
}
