import { beforeEach, describe, expect, it } from "vitest";
import {
  GET as listarPreguntasGET,
  POST as crearPreguntaPOST,
} from "@/app/api/preguntas/route";
import { GET as detallePreguntaGET } from "@/app/api/preguntas/[id]/route";
import { POST as responderPOST } from "@/app/api/preguntas/[id]/respuestas/route";
import { POST as votarPOST } from "@/app/api/preguntas/[id]/votos/route";
import { POST as aceptarPOST } from "@/app/api/preguntas/[id]/aceptar/route";
import {
  reiniciarAlmacenMock,
  USUARIO_DEMO_ACTUAL,
} from "@/repositories/preguntas.mock";

describe("API de Preguntas - Integración ruta -> servicio -> repositorio", () => {
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

  it("devuelve 401 cuando un usuario anónimo intenta publicar una pregunta", async () => {
    const req = new Request("http://localhost:3000/api/preguntas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-demo-uid": "anonimo",
      },
      body: JSON.stringify({
        titulo: "Pregunta válida sin sesión",
        cuerpo: "Cuerpo válido con más de veinte caracteres.",
        etiquetas: ["seguridad"],
      }),
    });

    const res = await crearPreguntaPOST(req);
    expect(res.status).toBe(401);
  });

  it("devuelve 403 al intentar votar la propia pregunta", async () => {
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

  it("recorre el flujo completo: crear pregunta, responder, votar y aceptar respuesta", async () => {
    const crearRes = await crearPreguntaPOST(
      new Request("http://localhost:3000/api/preguntas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-uid": "usr-estudiante",
        },
        body: JSON.stringify({
          titulo: "¿Cómo implementar transacciones seguras en Firestore?",
          cuerpo:
            "Necesito actualizar votos de forma atómica usando runTransaction en Admin SDK.",
          etiquetas: ["firebase", "firestore"],
        }),
      })
    );
    expect(crearRes.status).toBe(201);
    const { pregunta } = await crearRes.json();

    const respRes = await responderPOST(
      new Request(`http://localhost:3000/api/preguntas/${pregunta.id}/respuestas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-uid": "usr-carlos",
          "x-demo-nombre": "Carlos Gómez",
        },
        body: JSON.stringify({
          cuerpo:
            "Usa db.runTransaction(async (tx) => ...) para leer y actualizar el contador atómicamente.",
        }),
      }),
      { params: Promise.resolve({ id: pregunta.id }) }
    );
    expect(respRes.status).toBe(201);
    const { respuesta } = await respRes.json();

    const votoRes = await votarPOST(
      new Request(`http://localhost:3000/api/preguntas/${pregunta.id}/votos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-uid": "usr-carlos",
        },
        body: JSON.stringify({ valor: 1 }),
      }),
      { params: Promise.resolve({ id: pregunta.id }) }
    );
    expect(votoRes.status).toBe(200);
    expect(await votoRes.json()).toEqual({ votos: 1, votoUsuario: 1 });

    const aceptarRes = await aceptarPOST(
      new Request(`http://localhost:3000/api/preguntas/${pregunta.id}/aceptar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-uid": "usr-estudiante",
        },
        body: JSON.stringify({ respuestaId: respuesta.id }),
      }),
      { params: Promise.resolve({ id: pregunta.id }) }
    );
    expect(aceptarRes.status).toBe(200);

    const detalleRes = await detallePreguntaGET(
      new Request(`http://localhost:3000/api/preguntas/${pregunta.id}`),
      { params: Promise.resolve({ id: pregunta.id }) }
    );
    expect(detalleRes.status).toBe(200);
    const detalleJson = await detalleRes.json();
    expect(detalleJson.pregunta.aceptadaId).toBe(respuesta.id);
    expect(detalleJson.pregunta.votos).toBe(1);

    const listadoRes = await listarPreguntasGET(
      new Request("http://localhost:3000/api/preguntas?etiqueta=firestore")
    );
    expect(listadoRes.status).toBe(200);
    const listadoJson = await listadoRes.json();
    expect(listadoJson.items).toHaveLength(1);
  });
});
