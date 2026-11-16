import { NextResponse } from "next/server";
import { manejar, requerirUsuario } from "@/lib/http";
import {
  crearPreguntaSchema,
  filtroPreguntasSchema,
} from "@/schemas/pregunta.schema";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const GET = manejar(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const filtros = filtroPreguntasSchema.parse({
    q: searchParams.get("q") ?? undefined,
    etiqueta: searchParams.get("etiqueta") ?? undefined,
    orden: searchParams.get("orden") ?? "recientes",
  });

  const servicio = crearServicioPreguntas();
  const resultado = await servicio.listar(filtros);
  return NextResponse.json(resultado, { status: 200 });
});

export const POST = manejar(async (request: Request) => {
  const usuario = await requerirUsuario(request);
  const body = await request.json().catch(() => null);
  const input = crearPreguntaSchema.parse(body);

  const servicio = crearServicioPreguntas();
  const pregunta = await servicio.crearPregunta(usuario, input);
  return NextResponse.json({ pregunta }, { status: 201 });
});

