/**
 * Lista los usuarios registrados en Firebase Authentication (correo y rol).
 *
 * Uso:
 *   node --env-file=.env.local scripts/listar-usuarios.mjs
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Faltan las variables FIREBASE_* en .env.local.");
  process.exit(1);
}

const app =
  getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const listado = await getAuth(app).listUsers(100);

if (listado.users.length === 0) {
  console.log("No hay usuarios registrados todavía.");
} else {
  console.log(`Usuarios registrados (${listado.users.length}):`);
  for (const usuario of listado.users) {
    const rol = usuario.customClaims?.rol ?? "estudiante";
    console.log(`- ${usuario.email ?? "(sin correo)"} | uid: ${usuario.uid} | rol: ${rol}`);
  }
}
