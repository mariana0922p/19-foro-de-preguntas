import { beforeEach, describe, expect, it } from "vitest";
import { POST as crearPreguntaPOST } from "@/app/api/preguntas/route";
import { POST as votarPOST } from "@/app/api/preguntas/[id]/votos/route";
import { POST as aceptarPOST } from "@/app/api/preguntas/[id]/aceptar/route";
import {
  reiniciarAlmacenMock,
  USUARIO_DEMO_ACTUAL,
} from "@/repositories/preguntas.mock";

describe("API de Preguntas - Reglas de validación y autorización", () => {
  beforeEach(() => {
    reiniciarAlmacenMock();
  });

  it("devuelve 400 cuando se crea una pregunta con título demasiado corto", async () => {
    const req = new Request("http://localhost:3000/api/preguntas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: "Corto",
        cuerpo: "Cuerpo válido con más de veinte caracteres.",
        etiquetas: ["nextjs"],
      }),
    });

    const res = await crearPreguntaPOST(req);
    expect(res.status).toBe(400);
  });

  it("devuelve 403 al intentar votar la propia pregunta", async () => {
    // preg-3 pertenece a USUARIO_DEMO_ACTUAL ("usr-estudiante")
    const req = new Request("http://localhost:3000/api/preguntas/preg-3/votos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-demo-uid": USUARIO_DEMO_ACTUAL.uid,
      },
      body: JSON.stringify({ valor: 1 }),
    });

    const res = await votarPOST(req, {
      params: Promise.resolve({ id: "preg-3" }),
    });
    expect(res.status).toBe(403);
  });

  it("devuelve 403 cuando un usuario que no es el autor intenta aceptar una respuesta", async () => {
    // preg-1 pertenece a usr-ana, no a usr-estudiante
    const req = new Request("http://localhost:3000/api/preguntas/preg-1/aceptar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-demo-uid": USUARIO_DEMO_ACTUAL.uid,
      },
      body: JSON.stringify({ respuestaId: "resp-102" }),
    });

    const res = await aceptarPOST(req, {
      params: Promise.resolve({ id: "preg-1" }),
    });
    expect(res.status).toBe(403);
  });
});
