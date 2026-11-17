import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderizarMarkdown } from "@/lib/markdown";

function html(texto: string): string {
  return renderToStaticMarkup(<>{renderizarMarkdown(texto)}</>);
}

describe("renderizarMarkdown (seguridad)", () => {
  it("escapa etiquetas HTML en lugar de interpretarlas", () => {
    const resultado = html(
      'Hola <script>alert("xss")</script> <img src=x onerror="alert(1)">'
    );

    expect(resultado).toContain("&lt;script&gt;");
    expect(resultado).not.toContain("<script>");
    expect(resultado).not.toContain("<img");
    expect(resultado).toContain("&lt;img");
    expect(resultado).toContain("onerror=&quot;");
  });

  it("no convierte en enlace una URL con javascript:", () => {
    const resultado = html("[haz clic](javascript:alert(1))");

    expect(resultado).not.toContain('href="javascript:');
    expect(resultado).not.toContain("<a ");
    expect(resultado).toContain("javascript:alert(1)");
  });

  it("crea enlaces seguros con rel de protección", () => {
    const resultado = html("[OpenAI](https://openai.com)");

    expect(resultado).toContain('href="https://openai.com"');
    expect(resultado).toContain('target="_blank"');
    expect(resultado).toContain("noopener");
    expect(resultado).toContain("noreferrer");
    expect(resultado).toContain("nofollow");
  });

  it("muestra el código sin ejecutar su contenido", () => {
    const resultado = html("```\n<script>alert(1)</script>\n```");

    expect(resultado).toContain("<pre");
    expect(resultado).toContain("&lt;script&gt;");
    expect(resultado).not.toContain("<script>");
  });

  it("renderiza listas, encabezados y formato en línea", () => {
    const resultado = html(
      "## Título\n\n- uno\n- dos\n\n1. primero\n\n**negrita** y `codigo`"
    );

    expect(resultado).toContain("<h3");
    expect(resultado).toContain("<ul");
    expect(resultado).toContain("<ol");
    expect(resultado).toContain("<strong>negrita</strong>");
    expect(resultado).toContain("<code");
  });
});
