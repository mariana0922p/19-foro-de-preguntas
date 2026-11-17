import { cookies } from "next/headers";
import { ErrorApi } from "@/lib/errores";
import {
  obtenerAuthAdmin,
  tieneCredencialesFirebaseAdmin,
} from "@/lib/firebase-admin";

export interface UsuarioSesion {
  uid: string;
  nombre: string;
  correo: string | null;
  rol: "estudiante" | "admin";
}

export const COOKIE_SESION = "sesion";

/** Cinco días, dentro del rango permitido por Firebase (5 min a 2 semanas). */
export const DURACION_SESION_MS = 5 * 24 * 60 * 60 * 1000;

/** Un inicio de sesión más antiguo que esto obliga a autenticarse de nuevo. */
export const ANTIGUEDAD_MAXIMA_LOGIN_MS = 10 * 60 * 1000;

interface TokenDecodificado {
  uid: string;
  name?: string;
  email?: string;
  rol?: unknown;
}

export function mapearUsuario(decodificado: TokenDecodificado): UsuarioSesion {
  const correo = decodificado.email ?? null;
  return {
    uid: decodificado.uid,
    nombre: String(decodificado.name || correo || decodificado.uid),
    correo,
    rol: decodificado.rol === "admin" ? "admin" : "estudiante",
  };
}

/**
 * Cambia un idToken recién emitido por una cookie de sesión HttpOnly.
 * Exige que el inicio de sesión sea reciente (auth_time) para evitar
 * reutilizar tokens viejos.
 */
export async function crearCookieSesion(idToken: string) {
  const auth = obtenerAuthAdmin();
  const decodificado = await auth.verifyIdToken(idToken, true);

  const inicioSesionMs = (decodificado.auth_time ?? 0) * 1000;
  if (
    !inicioSesionMs ||
    Date.now() - inicioSesionMs > ANTIGUEDAD_MAXIMA_LOGIN_MS
  ) {
    throw new ErrorApi(
      401,
      "El inicio de sesión es demasiado antiguo. Vuelve a ingresar."
    );
  }

  const cookie = await auth.createSessionCookie(idToken, {
    expiresIn: DURACION_SESION_MS,
  });

  return { cookie, usuario: mapearUsuario(decodificado) };
}

/**
 * Lee la sesión desde la cookie. Devuelve null si no hay cookie, si Firebase
 * no está configurado o si la cookie ya no es válida.
 */
export async function leerUsuarioSesion(): Promise<UsuarioSesion | null> {
  if (!tieneCredencialesFirebaseAdmin()) return null;

  try {
    const valor = (await cookies()).get(COOKIE_SESION)?.value;
    if (!valor) return null;

    const decodificado = await obtenerAuthAdmin().verifySessionCookie(
      valor,
      true
    );
    return mapearUsuario(decodificado);
  } catch {
    return null;
  }
}
