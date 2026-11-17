import Link from "next/link";
import { BotonSalir } from "@/components/BotonSalir";
import { leerUsuarioSesion } from "@/lib/sesion";

const ESTILO_ENLACE =
  "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export async function SesionHeader() {
  const usuario = await leerUsuarioSesion();

  return (
    <ul className="flex flex-wrap items-center gap-2 text-sm font-medium">
      <li>
        <Link href="/" className={ESTILO_ENLACE}>
          Preguntas
        </Link>
      </li>
      <li>
        <Link
          href="/preguntas/nueva"
          className="inline-flex min-h-11 items-center rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          + Hacer pregunta
        </Link>
      </li>

      {usuario ? (
        <>
          <li>
            <Link href={`/usuarios/${usuario.uid}`} className={ESTILO_ENLACE}>
              Mi perfil
            </Link>
          </li>
          <li className="px-2 text-xs font-normal text-slate-600 dark:text-slate-400">
            {usuario.nombre}
            {usuario.rol === "admin" ? " · moderador" : ""}
          </li>
          <li>
            <BotonSalir />
          </li>
        </>
      ) : (
        <li>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-md border border-slate-300 px-4 py-2 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Iniciar sesión
          </Link>
        </li>
      )}
    </ul>
  );
}
