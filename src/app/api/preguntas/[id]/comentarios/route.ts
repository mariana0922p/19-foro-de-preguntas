import { NextResponse } from "next/server";
import { manejar, requerirUsuario } from "@/lib/http";
import { crearComentarioSchema } from "@/schemas/pregunta.schema";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const runtime = "nodejs";

export const GET = manejar(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const servicio = crearServicioPreguntas();
    const items = await servicio.listarComentarios(id);

    const respuesta = NextResponse.json({ items }, { status: 200 });
    respuesta.headers.set(
      "Cache-Control",
      "public, s-maxage=15, stale-while-revalidate=30"
    );
    return respuesta;
  }
);

export const POST = manejar(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const usuario = await requerirUsuario(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const input = crearComentarioSchema.parse(body);

    const servicio = crearServicioPreguntas();
    const comentario = await servicio.agregarComentario(usuario, id, input);
    return NextResponse.json({ comentario }, { status: 201 });
  }
);
