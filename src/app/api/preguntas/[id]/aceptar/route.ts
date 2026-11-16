import { NextResponse } from "next/server";
import { aceptarRespuestaSchema } from "@/schemas/pregunta.schema";
import {
  aceptarRespuestaEnAlmacen,
  USUARIO_DEMO_ACTUAL,
} from "@/repositories/preguntas.mock";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = aceptarRespuestaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Solicitud inválida",
        detalles: parsed.error.issues.map((i) => ({
          campo: i.path.join("."),
          mensaje: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const usuarioUid =
    request.headers.get("x-demo-uid") || USUARIO_DEMO_ACTUAL.uid;

  const resultado = aceptarRespuestaEnAlmacen(
    id,
    usuarioUid,
    parsed.data.respuestaId
  );

  if (!resultado.ok) {
    return NextResponse.json(
      { error: resultado.error },
      { status: resultado.status }
    );
  }

  return NextResponse.json(
    { aceptadaId: resultado.aceptadaId },
    { status: 200 }
  );
}
