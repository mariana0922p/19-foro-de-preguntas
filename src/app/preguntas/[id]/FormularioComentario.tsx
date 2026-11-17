"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearComentarioSchema } from "@/schemas/pregunta.schema";

interface Props {
  preguntaId: string;
}

export function FormularioComentario({ preguntaId }: Props) {
  const router = useRouter();
  const [cuerpo, setCuerpo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    const validacion = crearComentarioSchema.safeParse({ cuerpo });
    if (!validacion.success) {
      setError(validacion.error.issues[0]?.message ?? "Comentario inválido");
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await fetch(
        `/api/preguntas/${encodeURIComponent(preguntaId)}/comentarios`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validacion.data),
        }
      );

      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(datos.error || "No se pudo publicar el comentario.");
        return;
      }

      setCuerpo("");
      router.refresh();
    } catch {
      setError("Error de conexión al publicar el comentario.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="space-y-3">
      <div>
        <label
          htmlFor="campo-comentario"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Añadir un comentario (máximo 500 caracteres)
        </label>
        <textarea
          id="campo-comentario"
          rows={2}
          value={cuerpo}
          onChange={(evento) => setCuerpo(evento.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "error-comentario" : undefined}
          className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        />
        {error && (
          <p
            id="error-comentario"
            role="alert"
            className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="min-h-11 rounded-md border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-60 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {enviando ? "Publicando..." : "Comentar"}
      </button>
    </form>
  );
}
