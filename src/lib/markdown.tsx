import type { ReactNode } from "react";

/**
 * Renderizador de Markdown deliberadamente pequeño.
 *
 * Devuelve elementos de React en lugar de HTML: React escapa el texto por sí
 * solo, así que no hay forma de ejecutar `<script>` ni atributos `on*`.
 * Los enlaces solo se aceptan con http/https para evitar `javascript:`.
 */
const ENLACE_SEGURO = /^https?:\/\//i;
const PATRON_EN_LINEA =
  /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^()\s]+\))/g;

const ESTILO_CODIGO =
  "rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] text-slate-900 dark:bg-slate-800 dark:text-slate-100";
const ESTILO_ENLACE =
  "font-medium text-blue-700 underline hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300";

function renderizarEnLinea(texto: string, claveBase: string): ReactNode[] {
  const nodos: ReactNode[] = [];
  let ultimo = 0;
  let indice = 0;
  let coincidencia: RegExpExecArray | null;

  PATRON_EN_LINEA.lastIndex = 0;
  while ((coincidencia = PATRON_EN_LINEA.exec(texto)) !== null) {
    if (coincidencia.index > ultimo) {
      nodos.push(texto.slice(ultimo, coincidencia.index));
    }

    const token = coincidencia[0];
    const clave = `${claveBase}-${indice++}`;

    if (token.startsWith("`")) {
      nodos.push(
        <code key={clave} className={ESTILO_CODIGO}>
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      nodos.push(<strong key={clave}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodos.push(<em key={clave}>{token.slice(1, -1)}</em>);
    } else {
      const partes = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      const url = partes?.[2];
      if (partes && url && ENLACE_SEGURO.test(url)) {
        nodos.push(
          <a
            key={clave}
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={ESTILO_ENLACE}
          >
            {partes[1]}
          </a>
        );
      } else {
        // Enlace no permitido: se muestra tal cual, como texto.
        nodos.push(token);
      }
    }

    ultimo = coincidencia.index + token.length;
  }

  if (ultimo < texto.length) {
    nodos.push(texto.slice(ultimo));
  }

  return nodos;
}

export function renderizarMarkdown(texto: string): ReactNode {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  const bloques: ReactNode[] = [];

  let parrafo: string[] = [];
  let listaDesordenada: string[] = [];
  let listaOrdenada: string[] = [];
  let codigo: string[] | null = null;

  function vaciarParrafo() {
    if (parrafo.length === 0) return;
    const clave = `p-${bloques.length}`;
    bloques.push(
      <p key={clave} className="whitespace-pre-line">
        {renderizarEnLinea(parrafo.join("\n"), clave)}
      </p>
    );
    parrafo = [];
  }

  function vaciarListas() {
    if (listaDesordenada.length > 0) {
      const clave = `ul-${bloques.length}`;
      bloques.push(
        <ul key={clave} className="list-disc space-y-1 pl-6">
          {listaDesordenada.map((item, i) => (
            <li key={`${clave}-${i}`}>
              {renderizarEnLinea(item, `${clave}-${i}`)}
            </li>
          ))}
        </ul>
      );
      listaDesordenada = [];
    }
    if (listaOrdenada.length > 0) {
      const clave = `ol-${bloques.length}`;
      bloques.push(
        <ol key={clave} className="list-decimal space-y-1 pl-6">
          {listaOrdenada.map((item, i) => (
            <li key={`${clave}-${i}`}>
              {renderizarEnLinea(item, `${clave}-${i}`)}
            </li>
          ))}
        </ol>
      );
      listaOrdenada = [];
    }
  }

  for (const linea of lineas) {
    if (linea.trimStart().startsWith("```")) {
      if (codigo === null) {
        vaciarParrafo();
        vaciarListas();
        codigo = [];
      } else {
        const clave = `pre-${bloques.length}`;
        bloques.push(
          <pre
            key={clave}
            className="overflow-x-auto rounded-md bg-slate-900 p-4 text-sm text-slate-100"
          >
            <code>{codigo.join("\n")}</code>
          </pre>
        );
        codigo = null;
      }
      continue;
    }

    if (codigo !== null) {
      codigo.push(linea);
      continue;
    }

    const recortada = linea.trim();

    if (recortada === "") {
      vaciarParrafo();
      vaciarListas();
      continue;
    }

    if (recortada.startsWith("## ")) {
      vaciarParrafo();
      vaciarListas();
      const clave = `h-${bloques.length}`;
      bloques.push(
        <h3 key={clave} className="text-lg font-semibold">
          {renderizarEnLinea(recortada.slice(3), clave)}
        </h3>
      );
      continue;
    }

    if (recortada.startsWith("- ")) {
      vaciarParrafo();
      listaDesordenada.push(recortada.slice(2));
      continue;
    }

    const numerada = recortada.match(/^\d+\.\s+(.*)$/);
    if (numerada) {
      vaciarParrafo();
      listaOrdenada.push(numerada[1] ?? "");
      continue;
    }

    vaciarListas();
    parrafo.push(linea);
  }

  if (codigo !== null) {
    // Bloque sin cerrar: se muestra como código para no perder contenido.
    const clave = `pre-${bloques.length}`;
    bloques.push(
      <pre
        key={clave}
        className="overflow-x-auto rounded-md bg-slate-900 p-4 text-sm text-slate-100"
      >
        <code>{codigo.join("\n")}</code>
      </pre>
    );
  }

  vaciarParrafo();
  vaciarListas();

  return <>{bloques}</>;
}
