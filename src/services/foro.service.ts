export type EventoReputacion =
  | { tipo: "VOTO_POSITIVO_RECIBIDO" }
  | { tipo: "VOTO_NEGATIVO_RECIBIDO" }
  | { tipo: "RESPUESTA_ACEPTADA" }
  | { tipo: "ACEPTAR_RESPUESTA" };

export function calcularReputacion(
  reputacionInicial: number,
  eventos: EventoReputacion[]
): number {
  const puntosPorEvento: Record<EventoReputacion["tipo"], number> = {
    VOTO_POSITIVO_RECIBIDO: 10,
    VOTO_NEGATIVO_RECIBIDO: -2,
    RESPUESTA_ACEPTADA: 15,
    ACEPTAR_RESPUESTA: 2,
  };

  const total = eventos.reduce(
    (acc, ev) => acc + puntosPorEvento[ev.tipo],
    reputacionInicial
  );

  return Math.max(0, total);
}

export function calcularNuevoEstadoVoto(params: {
  votosActuales: number;
  votoPrevioUsuario: 1 | -1 | null;
  nuevoValor: 1 | -1;
}): { votos: number; votoUsuario: 1 | -1 | null } {
  const { votosActuales, votoPrevioUsuario, nuevoValor } = params;

  // Criterio de aceptacion 1: votar dos veces igual deshace el voto
  if (votoPrevioUsuario === nuevoValor) {
    return {
      votos: votosActuales - nuevoValor,
      votoUsuario: null,
    };
  }

  // Cambiar de voto (+1 a -1 o viceversa) o votar por primera vez
  const delta = votoPrevioUsuario === null ? nuevoValor : nuevoValor - votoPrevioUsuario;
  return {
    votos: votosActuales + delta,
    votoUsuario: nuevoValor,
  };
}
