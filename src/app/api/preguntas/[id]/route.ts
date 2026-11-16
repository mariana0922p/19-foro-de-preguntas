import { NextResponse } from "next/server";
import { PREGUNTAS_MOCK } from "@/repositories/preguntas.mock";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pregunta = PREGUNTAS_MOCK.find((p) => p.id === id && !p.oculta);

  if (!pregunta) {
    return NextResponse.json(
      { error: "Pregunta no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({ pregunta }, { status: 200 });
}
