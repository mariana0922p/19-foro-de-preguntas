import { NextResponse } from "next/server";
import { crearRespuestaSchema } from "@/schemas/pregunta.schema";
import {
  agregarRespuestaEnAlmacen,
  USUARIO_DEMO_ACTUAL,
} from "@/repositories/preguntas.mock";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = crearRespuestaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos de respuesta inválidos",
        detalles: parsed.error.issues.map((i) => ({
          campo: i.path.join("."),
          mensaje: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const respuesta = agregarRespuestaEnAlmacen(id, {
    autorUid: USUARIO_DEMO_ACTUAL.uid,
    autorNombre: USUARIO_DEMO_ACTUAL.nombre,
    cuerpo: parsed.data.cuerpo,
  });

  if (!respuesta) {
    return NextResponse.json(
      { error: "Pregunta no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({ respuesta }, { status: 201 });
}
