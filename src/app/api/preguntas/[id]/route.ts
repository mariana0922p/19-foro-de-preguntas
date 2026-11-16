import { NextResponse } from "next/server";
import { manejar } from "@/lib/http";
import { crearServicioPreguntas } from "@/services/preguntas.service";

export const GET = manejar(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const servicio = crearServicioPreguntas();
    const pregunta = await servicio.obtenerDetalle(id);
    return NextResponse.json({ pregunta }, { status: 200 });
  }
);
