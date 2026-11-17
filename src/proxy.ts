import { NextResponse, type NextRequest } from "next/server";

const COOKIE_SESION = "sesion";

/**
 * Atajo de experiencia de usuario: si no hay cookie de sesión, manda a
 * /login. NO es la frontera de seguridad: cada Route Handler y cada
 * Server Component vuelve a verificar la sesión con el Admin SDK.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(COOKIE_SESION)) {
    return NextResponse.next();
  }

  const destino = new URL("/login", request.url);
  destino.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/preguntas/nueva"],
};
