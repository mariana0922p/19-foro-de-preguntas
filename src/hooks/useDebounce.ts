import { useEffect, useState } from "react";

/** Devuelve el valor después de que pase el tiempo indicado sin cambios. */
export function useDebounce<T>(valor: T, retrasoMs = 300): T {
  const [valorRetrasado, setValorRetrasado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setValorRetrasado(valor), retrasoMs);
    return () => clearTimeout(temporizador);
  }, [valor, retrasoMs]);

  return valorRetrasado;
}
