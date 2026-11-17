export const PUNTOS_POR_VOTO = 5;
export const PUNTOS_POR_RESPUESTA_ACEPTADA = 15;

export interface EventosReputacion {
  votosRecibidos: number;
  respuestasAceptadas: number;
}

/**
 * Regla de negocio pura: la reputación se calcula a partir de eventos
 * (votos recibidos y respuestas aceptadas), nunca la decide el cliente.
 */
export function calcularReputacion({
  votosRecibidos,
  respuestasAceptadas,
}: EventosReputacion): number {
  const votos = Number.isFinite(votosRecibidos) ? Math.trunc(votosRecibidos) : 0;
  const aceptadas = Number.isFinite(respuestasAceptadas)
    ? Math.trunc(respuestasAceptadas)
    : 0;

  return Math.max(
    0,
    votos * PUNTOS_POR_VOTO + aceptadas * PUNTOS_POR_RESPUESTA_ACEPTADA
  );
}

/** Variación de reputación al cambiar los votos recibidos de una publicación. */
export function variacionPorVotos(variacionVotos: number): number {
  if (!Number.isFinite(variacionVotos)) return 0;
  return Math.trunc(variacionVotos) * PUNTOS_POR_VOTO;
}
