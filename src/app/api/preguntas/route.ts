import { NextResponse } from "next/server";
import { filtroPreguntasSchema } from "@/schemas/pregunta.schema";
import { PREGUNTAS_MOCK } from "@/repositories/preguntas.mock";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = filtroPreguntasSchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    etiqueta: searchParams.get("etiqueta") ?? undefined,
    orden: searchParams.get("orden") ?? "recientes",
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Parámetros de consulta inválidos",
        detalles: parsed.error.issues.map((i) => ({
          campo: i.path.join("."),
          mensaje: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const { q, etiqueta, orden } = parsed.data;

  let items = PREGUNTAS_MOCK.filter((p) => !p.oculta);

  if (q) {
    const termino = q.toLowerCase();
    items = items.filter(
      (p) =>
        p.titulo.toLowerCase().includes(termino) ||
        p.cuerpo.toLowerCase().includes(termino)
    );
  }

  if (etiqueta) {
    const tag = etiqueta.toLowerCase();
    items = items.filter((p) => p.etiquetas.some((e) => e.toLowerCase() === tag));
  }

  items = [...items].sort((a, b) => {
    if (orden === "populares") return b.votos - a.votos;
    return new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime();
  });

  return NextResponse.json({ items, siguienteCursor: null }, { status: 200 });
}
