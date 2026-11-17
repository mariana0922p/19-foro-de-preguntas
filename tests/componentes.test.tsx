import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EsqueletoComentarios } from "@/app/preguntas/[id]/EsqueletoComentarios";
import { FormularioComentario } from "@/app/preguntas/[id]/FormularioComentario";
import { QuestionCard } from "@/components/QuestionCard";
import type { PreguntaItem } from "@/repositories/preguntas.mock";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

const preguntaBase: PreguntaItem = {
  id: "preg-1",
  autorUid: "usr-ana",
  autorNombre: "Ana Morales",
  titulo: "¿Cómo funciona una lista enlazada?",
  cuerpo: "Necesito entender el manejo de punteros.",
  etiquetas: ["java", "estructuras-de-datos"],
  votos: 14,
  respuestas: 2,
  aceptadaId: null,
  oculta: false,
  creadaEn: "2026-11-14T15:30:00.000Z",
  listaRespuestas: [],
};

describe("QuestionCard", () => {
  it("enlaza al detalle y muestra las etiquetas", () => {
    render(<QuestionCard pregunta={preguntaBase} />);

    const enlace = screen.getByRole("link", {
      name: /cómo funciona una lista enlazada/i,
    });
    expect(enlace).toHaveAttribute("href", "/preguntas/preg-1");
    expect(screen.getByText("#java")).toBeInTheDocument();
    expect(screen.getByText("#estructuras-de-datos")).toBeInTheDocument();
  });

  it("indica cuando la pregunta está resuelta", () => {
    render(
      <QuestionCard
        pregunta={{ ...preguntaBase, aceptadaId: "resp-101" }}
      />
    );

    expect(screen.getByText(/✓ resuelta/i)).toBeInTheDocument();
  });

  it("permite seleccionar una etiqueta desde el listado", async () => {
    const user = userEvent.setup();
    const alSeleccionar = vi.fn();

    render(
      <QuestionCard
        pregunta={preguntaBase}
        onSeleccionarEtiqueta={alSeleccionar}
      />
    );

    await user.click(screen.getByRole("button", { name: "#java" }));
    expect(alSeleccionar).toHaveBeenCalledWith("java");
  });
});

describe("FormularioComentario", () => {
  it("valida en el cliente que el comentario no esté vacío", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<FormularioComentario preguntaId="preg-1" />);

    await user.type(screen.getByLabelText(/añadir un comentario/i), "x");
    await user.click(screen.getByRole("button", { name: /comentar/i }));

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(/al menos 2 caracteres/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("publica el comentario y limpia el campo", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            comentario: { id: "com-1", cuerpo: "Gracias por el aporte" },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        )
      );

    render(<FormularioComentario preguntaId="preg-1" />);

    const campo = screen.getByLabelText(/añadir un comentario/i);
    await user.type(campo, "Gracias por el aporte");
    await user.click(screen.getByRole("button", { name: /comentar/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/preguntas/preg-1/comentarios",
      expect.objectContaining({ method: "POST" })
    );
    await waitFor(() => expect(campo).toHaveValue(""));
  });
});

describe("EsqueletoComentarios", () => {
  it("anuncia la carga a lectores de pantalla", () => {
    render(<EsqueletoComentarios />);

    expect(
      screen.getByText(/cargando comentarios de la pregunta/i)
    ).toBeInTheDocument();
  });
});
