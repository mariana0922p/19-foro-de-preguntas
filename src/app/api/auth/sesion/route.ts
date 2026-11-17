import { NextResponse } from "next/server";
import { z } from "zod";
import { ErrorApi } from "@/lib/errores";
import {
  obtenerAuthAdmin,
  tieneCredencialesFirebaseAdmin,
} from "@/lib/firebase-admin";
import { manejar } from "@/lib/http";
import { consumirLimite, identificarCliente } from "@/lib/rate-limit";
import {
  COOKIE_SESION,
  DURACION_SESION_MS,
  crearCookieSesion,
  leerUsuarioSesion,
} from "@/lib/sesion";

export const runtime = "nodejs";

const esquemaSesion = z
  .object({ idToken: z.string().trim().min(20, "Falta el token de sesión") })
  .strict();

export const POST = manejar(
  async (request) => {
    if (!tieneCredencialesFirebaseAdmin()) {
      throw new ErrorApi(500, "Firebase no está configurado en el servidor");
    }

    const limite = consumirLimite(
      `sesion:${identificarCliente(request)}`,
      10,
      60_000
    );
    if (!limite.permitido) {
      throw new ErrorApi(
        429,
        "Demasiados intentos de inicio de sesión. Espera un minuto."
      );
    }

    const cuerpo = await request.json().catch(() => null);
    const { idToken } = esquemaSesion.parse(cuerpo);
    const { cookie } = await crearCookieSesion(idToken);

    const respuesta = new NextResponse(null, { status: 204 });
    respuesta.cookies.set({
      name: COOKIE_SESION,
      value: cookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(DURACION_SESION_MS / 1000),
    });
    respuesta.headers.set("Cache-Control", "no-store");
    return respuesta;
  },
  { limite: 20 }
);

export const DELETE = manejar(async () => {
  const usuario = await leerUsuarioSesion();

  if (usuario && tieneCredencialesFirebaseAdmin()) {
    try {
      await obtenerAuthAdmin().revokeRefreshTokens(usuario.uid);
    } catch {
      // Si la revocación falla, igualmente se borra la cookie local.
    }
  }

  const respuesta = new NextResponse(null, { status: 204 });
  respuesta.cookies.set({
    name: COOKIE_SESION,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  respuesta.headers.set("Cache-Control", "no-store");
  return respuesta;
});
