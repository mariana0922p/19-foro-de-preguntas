import { describe, expect, it } from "vitest";
import {
  calcularNuevoEstadoVoto,
  calcularReputacion,
  type EventoReputacion,
} from "@/services/foro.service";

describe("calcularReputacion", () => {
  it.each<{
    nombre: string;
    inicial: number;
    eventos: EventoReputacion[];
    esperado: number;
  }>([
    {
      nombre: "suma puntos por votos positivos y respuesta aceptada",
      inicial: 10,
      eventos: [
        { tipo: "VOTO_POSITIVO_RECIBIDO" },
        { tipo: "RESPUESTA_ACEPTADA" },
        { tipo: "ACEPTAR_RESPUESTA" },
      ],
      esperado: 37,
    },
    {
      nombre: "resta puntos por voto negativo recibido",
      inicial: 20,
      eventos: [{ tipo: "VOTO_NEGATIVO_RECIBIDO" }],
      esperado: 18,
    },
    {
      nombre: "nunca baja de cero",
      inicial: 1,
      eventos: [{ tipo: "VOTO_NEGATIVO_RECIBIDO" }],
      esperado: 0,
    },
  ])("$nombre", ({ inicial, eventos, esperado }) => {
    expect(calcularReputacion(inicial, eventos)).toBe(esperado);
  });
});

describe("calcularNuevoEstadoVoto", () => {
  it("aplica voto a favor y lo deshace al pulsar dos veces", () => {
    const primero = calcularNuevoEstadoVoto({
      votosActuales: 10,
      votoPrevioUsuario: null,
      nuevoValor: 1,
    });
    expect(primero).toEqual({ votos: 11, votoUsuario: 1 });

    const segundo = calcularNuevoEstadoVoto({
      votosActuales: primero.votos,
      votoPrevioUsuario: primero.votoUsuario,
      nuevoValor: 1,
    });
    expect(segundo).toEqual({ votos: 10, votoUsuario: null });
  });
});
