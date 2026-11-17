import { NextResponse } from "next/server";
import { ErrorApi } from "@/lib/errores";
import { manejar, obtenerUsuarioOpcional } from "@/lib/http";

export const runtime = "nodejs";

export const GET = manejar(async (request) => {
  const usuario = await obtenerUsuarioOpcional(request);
  if (!usuario) {
    throw new ErrorApi(401, "No hay una sesión activa");
  }

  const respuesta = NextResponse.json({ usuario }, { status: 200 });
  respuesta.headers.set("Cache-Control", "no-store");
  return respuesta;
});
