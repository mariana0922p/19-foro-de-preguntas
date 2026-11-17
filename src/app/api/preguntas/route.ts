import { NextResponse } from "next/server";
import { manejar, requerirUsuario } from "@/lib/http";
import {
  crearPreguntaSchema,
  filtroPreguntasSchema,
} from "@/schemas/pregunta.schema";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const runtime = "nodejs";

export const GET = manejar(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const filtros = filtroPreguntasSchema.parse({
    q: searchParams.get("q") ?? undefined,
    etiqueta: searchParams.get("etiqueta") ?? undefined,
    orden: searchParams.get("orden") ?? "recientes",
    limite: searchParams.get("limite") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
  });

  const servicio = crearServicioPreguntas();
  const resultado = await servicio.listar(filtros);

  const respuesta = NextResponse.json(resultado, { status: 200 });
  respuesta.headers.set(
    "Cache-Control",
    "public, s-maxage=30, stale-while-revalidate=60"
  );
  return respuesta;
});

export const POST = manejar(async (request: Request) => {
  const usuario = await requerirUsuario(request);
  const body = await request.json().catch(() => null);
  const input = crearPreguntaSchema.parse(body);

  const servicio = crearServicioPreguntas();
  const creada = await servicio.crearPregunta(usuario, input);

  const respuesta = NextResponse.json({ pregunta: creada }, { status: 201 });
  respuesta.headers.set(
    "Location",
    `/api/preguntas/${encodeURIComponent(creada.id)}`
  );
  return respuesta;
});
