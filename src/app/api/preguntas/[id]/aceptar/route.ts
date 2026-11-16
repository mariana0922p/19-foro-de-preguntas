import { NextResponse } from "next/server";
import { manejar, requerirUsuario } from "@/lib/http";
import { aceptarRespuestaSchema } from "@/schemas/pregunta.schema";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const runtime = "nodejs";

export const POST = manejar(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const usuario = await requerirUsuario(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const input = aceptarRespuestaSchema.parse(body);

    const servicio = crearServicioPreguntas();
    const resultado = await servicio.aceptarRespuesta(
      usuario,
      id,
      input.respuestaId
    );
    return NextResponse.json(resultado, { status: 200 });
  }
);
