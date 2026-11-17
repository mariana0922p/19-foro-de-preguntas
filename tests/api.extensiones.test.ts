import { beforeEach, describe, expect, it } from "vitest";
import {
  GET as listarComentariosGET,
  POST as crearComentarioPOST,
} from "@/app/api/preguntas/[id]/comentarios/route";
import { GET as detallePreguntaGET } from "@/app/api/preguntas/[id]/route";
import { POST as votarRespuestaPOST } from "@/app/api/preguntas/[id]/respuestas/[rid]/votos/route";
import { GET as listarPreguntasGET } from "@/app/api/preguntas/route";
import { PATCH as moderarPATCH } from "@/app/api/admin/preguntas/[id]/ocultar/route";
import { reiniciarAlmacenMock } from "@/repositories/preguntas.mock";

const contexto = (id: string) => ({ params: Promise.resolve({ id }) });

describe("Comentarios de preguntas", () => {
  beforeEach(() => {
    reiniciarAlmacenMock();
  });

  it("devuelve 401 si un anónimo intenta comentar", async () => {
    const res = await crearComentarioPOST(
      new Request("http://localhost:3000/api/preguntas/preg-1/comentarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-uid": "anonimo",
        },
        body: JSON.stringify({ cuerpo: "Comentario de prueba" }),
      }),
      contexto("preg-1")
    );

    expect(res.status).toBe(401);
  });

  it("crea un comentario y lo devuelve en el listado", async () => {
    const crear = await crearComentarioPOST(
      new Request("http://localhost:3000/api/preguntas/preg-1/comentarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-uid": "usr-estudiante",
          "x-demo-nombre": "Mariana Estudiante",
        },
        body: JSON.stringify({ cuerpo: "¿Podrías ampliar el ejemplo?" }),
      }),
      contexto("preg-1")
    );

    expect(crear.status).toBe(201);

    const listar = await listarComentariosGET(
      new Request("http://localhost:3000/api/preguntas/preg-1/comentarios"),
      contexto("preg-1")
    );
    expect(listar.status).toBe(200);
    const { items } = await listar.json();
    expect(items).toHaveLength(1);
    expect(items[0].autorNombre).toBe("Mariana Estudiante");
  });

  it("devuelve 404 al comentar una pregunta inexistente", async () => {
    const res = await crearComentarioPOST(
      new Request("http://localhost:3000/api/preguntas/no-existe/comentarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-uid": "usr-estudiante",
        },
        body: JSON.stringify({ cuerpo: "Comentario huérfano" }),
      }),
      contexto("no-existe")
    );

    expect(res.status).toBe(404);
  });
});

describe("Votos a respuestas", () => {
  beforeEach(() => {
    reiniciarAlmacenMock();
  });

  it("suma un voto a una respuesta ajena", async () => {
    const res = await votarRespuestaPOST(
      new Request(
        "http://localhost:3000/api/preguntas/preg-1/respuestas/resp-101/votos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-demo-uid": "usr-estudiante",
          },
          body: JSON.stringify({ valor: 1 }),
        }
      ),
      { params: Promise.resolve({ id: "preg-1", rid: "resp-101" }) }
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ votos: 10, votoUsuario: 1 });
  });

  it("impide votar la propia respuesta", async () => {
    const res = await votarRespuestaPOST(
      new Request(
        "http://localhost:3000/api/preguntas/preg-1/respuestas/resp-101/votos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-demo-uid": "usr-carlos",
          },
          body: JSON.stringify({ valor: 1 }),
        }
      ),
      { params: Promise.resolve({ id: "preg-1", rid: "resp-101" }) }
    );

    expect(res.status).toBe(403);
  });
});

describe("Moderación de preguntas", () => {
  beforeEach(() => {
    reiniciarAlmacenMock();
  });

  it("devuelve 403 si un estudiante intenta ocultar una pregunta", async () => {
    const res = await moderarPATCH(
      new Request("http://localhost:3000/api/admin/preguntas/preg-1/ocultar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-uid": "usr-estudiante",
        },
        body: JSON.stringify({ oculta: true }),
      }),
      contexto("preg-1")
    );

    expect(res.status).toBe(403);
  });

  it("un moderador oculta la pregunta y deja de aparecer en el detalle", async () => {
    const res = await moderarPATCH(
      new Request("http://localhost:3000/api/admin/preguntas/preg-1/ocultar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-uid": "usr-admin",
          "x-demo-rol": "admin",
        },
        body: JSON.stringify({ oculta: true }),
      }),
      contexto("preg-1")
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "preg-1", oculta: true });

    const detalle = await detallePreguntaGET(
      new Request("http://localhost:3000/api/preguntas/preg-1"),
      contexto("preg-1")
    );
    expect(detalle.status).toBe(404);
  });
});

describe("Paginación por cursor", () => {
  beforeEach(() => {
    reiniciarAlmacenMock();
  });

  it("entrega páginas sin repetir preguntas", async () => {
    const primera = await listarPreguntasGET(
      new Request("http://localhost:3000/api/preguntas?limite=2&orden=recientes")
    );
    expect(primera.status).toBe(200);
    const pagina1 = await primera.json();
    expect(pagina1.items).toHaveLength(2);
    expect(pagina1.siguienteCursor).toBeTruthy();

    const segunda = await listarPreguntasGET(
      new Request(
        `http://localhost:3000/api/preguntas?limite=2&orden=recientes&cursor=${encodeURIComponent(
          pagina1.siguienteCursor
        )}`
      )
    );
    expect(segunda.status).toBe(200);
    const pagina2 = await segunda.json();

    const ids = new Set(pagina1.items.map((p: { id: string }) => p.id));
    expect(pagina2.items.length).toBeGreaterThan(0);
    expect(
      pagina2.items.some((p: { id: string }) => ids.has(p.id))
    ).toBe(false);
  });

  it("rechaza límites fuera de rango", async () => {
    const res = await listarPreguntasGET(
      new Request("http://localhost:3000/api/preguntas?limite=500")
    );
    expect(res.status).toBe(400);
  });
});
