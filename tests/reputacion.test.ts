import { describe, expect, it } from "vitest";
import {
  PUNTOS_POR_RESPUESTA_ACEPTADA,
  PUNTOS_POR_VOTO,
  calcularReputacion,
  variacionPorVotos,
} from "@/services/reputacion.service";

describe("calcularReputacion (tabla de decisión)", () => {
  it.each([
    { votos: 0, aceptadas: 0, esperado: 0 },
    { votos: 3, aceptadas: 0, esperado: 3 * PUNTOS_POR_VOTO },
    { votos: 0, aceptadas: 2, esperado: 2 * PUNTOS_POR_RESPUESTA_ACEPTADA },
    { votos: 4, aceptadas: 1, esperado: 35 },
    { votos: -5, aceptadas: 0, esperado: 0 },
    { votos: 1, aceptadas: -3, esperado: 0 },
    { votos: Number.NaN, aceptadas: 1, esperado: 15 },
  ])(
    "con $votos votos y $aceptadas aceptadas devuelve $esperado",
    ({ votos, aceptadas, esperado }) => {
      expect(
        calcularReputacion({
          votosRecibidos: votos,
          respuestasAceptadas: aceptadas,
        })
      ).toBe(esperado);
    }
  );
});

describe("variacionPorVotos", () => {
  it("convierte la variación de votos en puntos", () => {
    expect(variacionPorVotos(1)).toBe(PUNTOS_POR_VOTO);
    expect(variacionPorVotos(-1)).toBe(-PUNTOS_POR_VOTO);
    expect(variacionPorVotos(3)).toBe(3 * PUNTOS_POR_VOTO);
  });

  it("ignora valores no finitos", () => {
    expect(variacionPorVotos(Number.NaN)).toBe(0);
    expect(variacionPorVotos(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
