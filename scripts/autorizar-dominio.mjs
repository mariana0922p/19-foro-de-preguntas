/**
 * Añade un dominio a la lista de dominios autorizados de Firebase Auth.
 * Necesario para que el login funcione desde Vercel (o cualquier otro host).
 *
 * Uso:
 *   node --env-file=.env.local scripts/autorizar-dominio.mjs mi-app.vercel.app
 */
import { GoogleAuth } from "google-auth-library";

const dominio = process.argv[2]?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
if (!dominio) {
  console.error(
    "Uso: node --env-file=.env.local scripts/autorizar-dominio.mjs mi-app.vercel.app"
  );
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Faltan las variables FIREBASE_* en .env.local.");
  process.exit(1);
}

const googleAuth = new GoogleAuth({
  credentials: { client_email: clientEmail, private_key: privateKey },
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;

try {
  const cliente = await googleAuth.getClient();
  const { token } = await cliente.getAccessToken();

  const respuesta = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer la configuración (HTTP ${respuesta.status})`);
  }

  const configuracion = await respuesta.json();
  const dominios = new Set(configuracion.authorizedDomains ?? []);
  if (dominios.has(dominio)) {
    console.log(`El dominio ${dominio} ya estaba autorizado.`);
    process.exit(0);
  }

  dominios.add(dominio);
  const actualizacion = await fetch(`${url}?updateMask=authorizedDomains`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authorizedDomains: [...dominios] }),
  });

  if (!actualizacion.ok) {
    throw new Error(`No se pudo actualizar (HTTP ${actualizacion.status})`);
  }

  console.log(`Dominio autorizado: ${dominio}`);
  console.log(`Dominios actuales: ${[...dominios].join(", ")}`);
} catch (error) {
  console.error(
    "Error al autorizar el dominio:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
}
