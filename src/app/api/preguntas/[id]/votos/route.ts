import { NextResponse } from "next/server";
import { votarSchema } from "@/schemas/pregunta.schema";
import {
  USUARIO_DEMO_ACTUAL,
  votarPreguntaEnAlmacen,
} from "@/repositories/preguntas.mock";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = votarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Voto inválido",
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

  const resultado = votarPreguntaEnAlmacen(id, usuarioUid, parsed.data.valor);
  if (!resultado.ok) {
    return NextResponse.json(
      { error: resultado.error },
      { status: resultado.status }
    );
  }

  return NextResponse.json(
    { votos: resultado.votos, votoUsuario: resultado.votoUsuario },
    { status: 200 }
  );
}
