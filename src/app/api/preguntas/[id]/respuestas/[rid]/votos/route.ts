import { NextResponse } from "next/server";
import { manejar, requerirUsuario } from "@/lib/http";
import { votarSchema } from "@/schemas/pregunta.schema";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const runtime = "nodejs";

export const POST = manejar(
  async (
    request: Request,
    context: { params: Promise<{ id: string; rid: string }> }
  ) => {
    const usuario = await requerirUsuario(request);
    const { id, rid } = await context.params;
    const body = await request.json().catch(() => null);
    const input = votarSchema.parse(body);

    const servicio = crearServicioPreguntas();
    const resultado = await servicio.votarRespuesta(
      usuario,
      id,
      rid,
      input.valor
    );
    return NextResponse.json(resultado, { status: 200 });
  }
);
