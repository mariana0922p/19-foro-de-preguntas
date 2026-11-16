import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ErrorApi } from "@/lib/errores";
import {
  obtenerAuthAdmin,
  tieneCredencialesFirebaseAdmin,
} from "@/lib/firebase-admin";
import { USUARIO_DEMO_ACTUAL } from "@/repositories/preguntas.mock";

export interface UsuarioSesion {
  uid: string;
  nombre: string;
  rol: "estudiante" | "admin";
}

export async function obtenerUsuarioOpcional(
  request: Request
): Promise<UsuarioSesion | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ") && tieneCredencialesFirebaseAdmin()) {
    const token = authHeader.slice("Bearer ".length).trim();
    try {
      const decoded = await obtenerAuthAdmin().verifyIdToken(token);
      return {
        uid: decoded.uid,
        nombre: String(decoded.name || decoded.email || decoded.uid),
        rol: decoded.rol === "admin" ? "admin" : "estudiante",
      };
    } catch {
      throw new ErrorApi(401, "Token de autenticación inválido o expirado");
    }
  }

  const demoUid = request.headers.get("x-demo-uid");
  if (demoUid === "anonimo") return null;

  if (demoUid) {
    const rolHeader = request.headers.get("x-demo-rol");
    return {
      uid: demoUid,
      nombre: request.headers.get("x-demo-nombre") || demoUid,
      rol: rolHeader === "admin" ? "admin" : "estudiante",
    };
  }

  return {
    uid: USUARIO_DEMO_ACTUAL.uid,
    nombre: USUARIO_DEMO_ACTUAL.nombre,
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

export function manejar<TContext = unknown>(
  handler: (request: Request, context: TContext) => Promise<NextResponse>
) {
  return async (
    request: Request,
    context?: TContext
  ): Promise<NextResponse> => {
    try {
      return await handler(request, context as TContext);
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
