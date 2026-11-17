/**
 * Publica firestore.rules en Firestore usando la API de reglas de Firebase.
 * Evita depender del login del CLI de Firebase: usa la cuenta de servicio.
 *
 * Uso:
 *   node --env-file=.env.local scripts/desplegar-reglas.mjs
 */
import { readFile } from "node:fs/promises";
import { GoogleAuth } from "google-auth-library";

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

const base = `https://firebaserules.googleapis.com/v1/projects/${projectId}`;
const nombreRelease = `projects/${projectId}/releases/cloud.firestore`;

try {
  const contenido = (
    await readFile(new URL("../firestore.rules", import.meta.url), "utf8")
  ).replace(/^\uFEFF/, "");
  const cliente = await googleAuth.getClient();
  const { token } = await cliente.getAccessToken();

  const cabeceras = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const creacion = await fetch(`${base}/rulesets`, {
    method: "POST",
    headers: cabeceras,
    body: JSON.stringify({
      source: { files: [{ name: "firestore.rules", content: contenido }] },
    }),
  });

  if (!creacion.ok) {
    throw new Error(
      `No se pudo crear el conjunto de reglas (HTTP ${creacion.status}): ${await creacion.text()}`
    );
  }

  const { name: rulesetName } = await creacion.json();
  console.log(`Conjunto de reglas creado: ${rulesetName}`);

  const consulta = await fetch(`${base}/releases/cloud.firestore`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`Release cloud.firestore: HTTP ${consulta.status}`);

  const publicacion =
    consulta.status === 404
      ? await fetch(`${base}/releases`, {
          method: "POST",
          headers: cabeceras,
          body: JSON.stringify({ name: nombreRelease, rulesetName }),
        })
      : await fetch(`${base}/releases/cloud.firestore?updateMask=rulesetName`, {
          method: "PATCH",
          headers: cabeceras,
          body: JSON.stringify({ release: { name: nombreRelease, rulesetName } }),
        });

  if (!publicacion.ok) {
    throw new Error(
      `No se pudo publicar el release (HTTP ${publicacion.status}): ${await publicacion.text()}`
    );
  }

  console.log("Reglas de Firestore publicadas correctamente.");
} catch (error) {
  console.error(
    "Error al desplegar las reglas:",
    error instanceof Error ? error.message : error,
    error instanceof Error && error.cause ? `\nCausa: ${error.cause}` : ""
  );
  process.exit(1);
}
