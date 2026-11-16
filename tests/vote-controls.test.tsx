import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VoteControls } from "@/components/VoteControls";

describe("VoteControls", () => {
  it("actualiza el contador en la región aria-live al votar a favor", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ votos: 15, votoUsuario: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(<VoteControls preguntaId="preg-1" votosIniciales={14} />);

    const botonFavor = screen.getByRole("button", { name: /votar a favor/i });
    await user.click(botonFavor);

    const contador = screen.getByText(/15 votos/i);
    expect(contador).toHaveAttribute("aria-live", "polite");
  });
});
