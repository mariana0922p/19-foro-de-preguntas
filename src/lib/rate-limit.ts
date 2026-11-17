/**
 * Limitador de frecuencia en memoria. Suficiente para una instancia de
 * desarrollo o un despliegue pequeño; en producción con varias instancias
 * conviene complementarlo con el Firewall de Vercel o un almacén compartido.
 */
const registros = new Map<string, number[]>();

export interface ResultadoLimite {
  permitido: boolean;
  restantes: number;
  reinicioEnSegundos: number;
}

export function consumirLimite(
  clave: string,
  maximo = 30,
  ventanaMs = 60_000
): ResultadoLimite {
  const ahora = Date.now();
  const previos = (registros.get(clave) ?? []).filter(
    (marca) => ahora - marca < ventanaMs
  );

  if (previos.length >= maximo) {
    registros.set(clave, previos);
    const masAntiguo = previos[0] ?? ahora;
    return {
      permitido: false,
      restantes: 0,
      reinicioEnSegundos: Math.max(
        1,
        Math.ceil((ventanaMs - (ahora - masAntiguo)) / 1000)
      ),
    };
  }

  previos.push(ahora);
  registros.set(clave, previos);

  if (registros.size > 5000) {
    for (const [claveGuardada, marcas] of registros) {
      if (marcas.every((marca) => ahora - marca >= ventanaMs)) {
        registros.delete(claveGuardada);
      }
    }
  }

  return {
    permitido: true,
    restantes: Math.max(0, maximo - previos.length),
    reinicioEnSegundos: Math.ceil(ventanaMs / 1000),
  };
}

export function identificarCliente(request: Request): string {
  const reenviada = request.headers.get("x-forwarded-for");
  if (reenviada) {
    const primera = reenviada.split(",")[0]?.trim();
    if (primera) return primera;
  }
  return request.headers.get("x-real-ip") || "local";
}
