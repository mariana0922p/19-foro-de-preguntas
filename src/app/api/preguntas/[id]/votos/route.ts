import { NextResponse } from "next/server";
import { manejar, requerirUsuario } from "@/lib/http";
import { votarSchema } from "@/schemas/pregunta.schema";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const POST = manejar(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const usuario = await requerirUsuario(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const input = votarSchema.parse(body);

    const servicio = crearServicioPreguntas();
    const resultado = await servicio.votarPregunta(usuario, id, input.valor);
    return NextResponse.json(resultado, { status: 200 });
  }
);
