"use client";

import { startTransition, useOptimistic, useState } from "react";
import { calcularNuevoEstadoVoto } from "@/services/foro.service";

interface VoteControlsProps {
  preguntaId: string;
  votosIniciales: number;
  esAutorPropio?: boolean;
  /** Ruta a la que se envía el voto. Por defecto, la de la pregunta. */
  endpoint?: string;
  descripcion?: string;
}

interface EstadoVoto {
  votos: number;
  votoUsuario: 1 | -1 | null;
}

export function VoteControls({
  preguntaId,
  votosIniciales,
  esAutorPropio = false,
  endpoint,
  descripcion,
}: VoteControlsProps) {
  const [estadoReal, setEstadoReal] = useState<EstadoVoto>({
    votos: votosIniciales,
    votoUsuario: null,
  });
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const [estadoOptimista, aplicarVotoOptimista] = useOptimistic(
    estadoReal,
    (actual, nuevoValor: 1 | -1) =>
      calcularNuevoEstadoVoto({
        votosActuales: actual.votos,
        votoPrevioUsuario: actual.votoUsuario,
        nuevoValor,
      })
  );

  function manejarVoto(valor: 1 | -1) {
    setMensajeError(null);

    startTransition(async () => {
      aplicarVotoOptimista(valor);

      try {
        const url =
          endpoint ??
          `/api/preguntas/${encodeURIComponent(preguntaId)}/votos`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valor }),
        });

        const data = await res.json();
        if (!res.ok) {
          setMensajeError(data.error || "No se pudo registrar el voto.");
          return;
        }

        setEstadoReal({
          votos: data.votos,
          votoUsuario: data.votoUsuario,
        });
      } catch {
        setMensajeError("Error de conexión al votar.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/60"
        role="group"
        aria-label={descripcion ?? "Votar esta pregunta"}
      >
        <button
          type="button"
          onClick={() => manejarVoto(1)}
          aria-pressed={estadoOptimista.votoUsuario === 1}
          aria-label="Votar a favor"
          className={`min-h-11 min-w-11 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
            estadoOptimista.votoUsuario === 1
              ? "bg-blue-700 text-white"
              : "bg-white text-slate-800 hover:bg-blue-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          ▲ A favor
        </button>

        <span
          aria-live="polite"
          aria-atomic="true"
          className="min-w-16 text-center text-sm font-bold text-slate-900 dark:text-slate-100"
        >
          {estadoOptimista.votos} votos
        </span>

        <button
          type="button"
          onClick={() => manejarVoto(-1)}
          aria-pressed={estadoOptimista.votoUsuario === -1}
          aria-label="Votar en contra"
          className={`min-h-11 min-w-11 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
            estadoOptimista.votoUsuario === -1
              ? "bg-amber-700 text-white"
              : "bg-white text-slate-800 hover:bg-amber-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          ▼ En contra
        </button>
      </div>

      {esAutorPropio && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Eres el autor de esta pregunta (el servidor bloqueará votos propios).
        </p>
      )}

      {mensajeError && (
        <p
          role="alert"
          className="text-xs font-medium text-red-700 dark:text-red-400"
        >
          {mensajeError}
        </p>
      )}
    </div>
  );
}
