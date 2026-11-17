/**
 * Oculta o restaura una pregunta directamente en Firestore (modo admin).
 *
 * Uso:
 *   node --env-file=.env.local scripts/moderar-pregunta.mjs demo-preg-1 ocultar
 *   node --env-file=.env.local scripts/moderar-pregunta.mjs demo-preg-1 mostrar
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const [preguntaId, accion] = process.argv.slice(2);
if (!preguntaId || !["ocultar", "mostrar"].includes(accion)) {
  console.error(
    "Uso: node --env-file=.env.local scripts/moderar-pregunta.mjs <id> <ocultar|mostrar>"
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

const app =
  getApps()[0] ??
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const referencia = getFirestore(app).collection("preguntas").doc(preguntaId);
const documento = await referencia.get();

if (!documento.exists) {
  console.error(`La pregunta ${preguntaId} no existe.`);
  process.exit(1);
}

const oculta = accion === "ocultar";
await referencia.set({ oculta }, { merge: true });

console.log(
  `Pregunta ${preguntaId}: ${oculta ? "oculta" : "visible de nuevo"}.`
);
