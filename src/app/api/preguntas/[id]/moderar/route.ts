import { NextResponse } from "next/server";
import { manejar, requerirUsuario } from "@/lib/http";
import { moderarPreguntaSchema } from "@/schemas/pregunta.schema";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const PATCH = manejar(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const usuario = await requerirUsuario(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const input = moderarPreguntaSchema.parse(body);

    const servicio = crearServicioPreguntas();
    const resultado = await servicio.moderarPregunta(usuario, id, input.oculta);
    return NextResponse.json(resultado, { status: 200 });
  }
);
