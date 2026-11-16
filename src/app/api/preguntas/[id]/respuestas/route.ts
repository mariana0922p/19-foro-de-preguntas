import { NextResponse } from "next/server";
import { manejar, requerirUsuario } from "@/lib/http";
import { crearRespuestaSchema } from "@/schemas/pregunta.schema";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const runtime = "nodejs";

export const POST = manejar(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const usuario = await requerirUsuario(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const input = crearRespuestaSchema.parse(body);

    const servicio = crearServicioPreguntas();
    const respuesta = await servicio.responderPregunta(usuario, id, input);
    return NextResponse.json({ respuesta }, { status: 201 });
  }
);
