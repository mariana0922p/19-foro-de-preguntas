/**
 * Convierte un usuario de Firebase Authentication en moderador (rol admin).
 * El usuario debe volver a iniciar sesión para que el nuevo claim llegue al
 * token y la app lo reconozca.
 *
 * Uso:
 *   node --env-file=.env.local scripts/hacer-admin.mjs correo@ejemplo.com
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const correo = process.argv[2];
if (!correo) {
  console.error(
    "Uso: node --env-file=.env.local scripts/hacer-admin.mjs correo@ejemplo.com"
  );
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY en .env.local."
  );
  process.exit(1);
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

try {
  const auth = getAuth(app);
  const usuario = await auth.getUserByEmail(correo);
  await auth.setCustomUserClaims(usuario.uid, { rol: "admin" });
  console.log(
    `Listo: ${correo} (uid ${usuario.uid}) ahora tiene el rol admin. Cierra sesión y vuelve a entrar.`
  );
} catch (error) {
  console.error(
    "No se pudo asignar el rol admin:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
}
