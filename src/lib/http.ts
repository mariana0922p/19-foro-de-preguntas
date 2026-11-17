import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ErrorApi } from "@/lib/errores";
import {
  obtenerAuthAdmin,
  tieneCredencialesFirebaseAdmin,
} from "@/lib/firebase-admin";
import { consumirLimite, identificarCliente } from "@/lib/rate-limit";
import {
  leerUsuarioSesion,
  mapearUsuario,
  type UsuarioSesion,
} from "@/lib/sesion";
import { USUARIO_DEMO_ACTUAL } from "@/repositories/preguntas.mock";

export type { UsuarioSesion };

/**
 * Comprueba que una petición que modifica datos venga del mismo origen.
 * Los clientes que no son navegadores (curl, pruebas, Bruno) no envían
 * `Origin` y se permiten; la sesión se sigue exigiendo igualmente.
 */
export function origenPermitido(request: Request): boolean {
  const origen = request.headers.get("origin");
  if (!origen) return true;
  try {
    return new URL(origen).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function obtenerUsuarioOpcional(
  request: Request
): Promise<UsuarioSesion | null> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    if (!tieneCredencialesFirebaseAdmin()) {
      throw new ErrorApi(401, "Firebase no está configurado en el servidor");
    }
    const token = authHeader.slice("Bearer ".length).trim();
    try {
      const decodificado = await obtenerAuthAdmin().verifyIdToken(token, true);
      return mapearUsuario(decodificado);
    } catch {
      throw new ErrorApi(401, "Token de autenticación inválido o expirado");
    }
  }

  if (tieneCredencialesFirebaseAdmin()) {
    return leerUsuarioSesion();
  }

  // Modo demostración: solo se activa cuando NO hay credenciales de Firebase.
  const demoUid = request.headers.get("x-demo-uid");
  if (demoUid === "anonimo") return null;

  if (demoUid) {
    return {
      uid: demoUid,
      nombre: request.headers.get("x-demo-nombre") || demoUid,
      correo: null,
      rol: request.headers.get("x-demo-rol") === "admin" ? "admin" : "estudiante",
    };
  }

  return {
    uid: USUARIO_DEMO_ACTUAL.uid,
    nombre: USUARIO_DEMO_ACTUAL.nombre,
    correo: null,
    rol: "estudiante",
  };
}

export async function requerirUsuario(
  request: Request
): Promise<UsuarioSesion> {
  const usuario = await obtenerUsuarioOpcional(request);
  if (!usuario) {
    throw new ErrorApi(401, "Debes iniciar sesión para realizar esta acción");
  }
  return usuario;
}

export async function requerirAdmin(
  request: Request
): Promise<UsuarioSesion> {
  const usuario = await requerirUsuario(request);
  if (usuario.rol !== "admin") {
    throw new ErrorApi(403, "Solo los moderadores pueden realizar esta acción");
  }
  return usuario;
}

interface OpcionesManejador {
  limite?: number;
  ventanaMs?: number;
}

export function manejar<TContext = unknown>(
  handler: (request: Request, context: TContext) => Promise<NextResponse>,
  opciones: OpcionesManejador = {}
) {
  return async (
    request: Request,
    context?: TContext
  ): Promise<NextResponse> => {
    const metodo = request.method.toUpperCase();
    const modifica = !["GET", "HEAD", "OPTIONS"].includes(metodo);

    if (modifica && !origenPermitido(request)) {
      return NextResponse.json(
        { error: "Origen no permitido para modificar datos" },
        { status: 403 }
      );
    }

    const limite = consumirLimite(
      `${identificarCliente(request)}:${metodo}:${new URL(request.url).pathname}`,
      opciones.limite ?? (modifica ? 30 : 120),
      opciones.ventanaMs ?? 60_000
    );

    if (!limite.permitido) {
      return NextResponse.json(
        {
          error:
            "Demasiadas solicitudes. Espera unos segundos e inténtalo de nuevo.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(limite.reinicioEnSegundos) },
        }
      );
    }

    try {
      const respuesta = await handler(request, context as TContext);
      if (modifica) {
        respuesta.headers.set("Cache-Control", "no-store");
      }
      return respuesta;
    } catch (error) {
      if (error instanceof ErrorApi) {
        return NextResponse.json(
          {
            error: error.message,
            ...(error.detalles ? { detalles: error.detalles } : {}),
          },
          { status: error.status }
        );
      }

      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Datos de entrada inválidos",
            detalles: error.issues.map((i) => ({
              campo: i.path.join("."),
              mensaje: i.message,
            })),
          },
          { status: 400 }
        );
      }

      console.error(
        "[API_ERROR]",
        error instanceof Error ? error.message : "Error interno"
      );
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  };
}
