"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BotonSalir() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    setSaliendo(true);
    try {
      const [{ obtenerAuthCliente }, { signOut }] = await Promise.all([
        import("@/lib/firebase-client"),
        import("firebase/auth"),
      ]);
      await signOut(obtenerAuthCliente());
    } catch {
      // Si el SDK web no está disponible, igual borramos la cookie.
    }

    try {
      await fetch("/api/auth/sesion", { method: "DELETE" });
    } catch {
      // Sin red: la cookie se borrará al expirar.
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={cerrarSesion}
      disabled={saliendo}
      className="inline-flex min-h-11 items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {saliendo ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
