import { NextResponse } from "next/server";
import {
  crearPreguntaSchema,
  filtroPreguntasSchema,
} from "@/schemas/pregunta.schema";
import {
  crearPreguntaEnAlmacen,
  listarPreguntas,
  USUARIO_DEMO_ACTUAL,
} from "@/repositories/preguntas.mock";

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
  let items = listarPreguntas();

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

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = crearPreguntaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos de pregunta inválidos",
        detalles: parsed.error.issues.map((i) => ({
          campo: i.path.join("."),
          mensaje: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const nueva = crearPreguntaEnAlmacen({
    autorUid: USUARIO_DEMO_ACTUAL.uid,
    autorNombre: USUARIO_DEMO_ACTUAL.nombre,
    ...parsed.data,
  });

  return NextResponse.json({ pregunta: nueva }, { status: 201 });
}
