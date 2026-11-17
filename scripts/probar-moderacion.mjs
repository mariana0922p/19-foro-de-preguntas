/**
 * Verifica en producción que un administrador ve el panel de moderación,
 * que puede ocultar una pregunta y que luego se restaura.
 * Crea un usuario temporal y lo elimina al terminar.
 *
 * Uso:
 *   node --env-file=.env.local scripts/probar-moderacion.mjs [url] [preguntaId]
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const base = (process.argv[2] ?? "https://19-foro-de-preguntas.vercel.app").replace(/\/$/, "");
const preguntaId = process.argv[3] ?? "demo-preg-1";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const app =
  getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);
const db = getFirestore(app);

const correo = `prueba-admin-${Date.now()}@example.com`;
const contrasena = `Prueba-${Math.random().toString(36).slice(2)}-2026`;
let uid = null;

function revisar(condicion, mensaje) {
  console.log(`${condicion ? "OK " : "FALLO"}  ${mensaje}`);
  if (!condicion) process.exitCode = 1;
}

try {
  const creado = await auth.createUser({ email: correo, password: contrasena });
  uid = creado.uid;
  await auth.setCustomUserClaims(uid, { rol: "admin" });

  const acceso = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: correo, password: contrasena, returnSecureToken: true }),
    }
  );
  const datosAcceso = await acceso.json();
  if (!acceso.ok) throw new Error(datosAcceso?.error?.message ?? "sin detalle");

  const sesion = await fetch(`${base}/api/auth/sesion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: datosAcceso.idToken }),
  });
  const cookie = sesion.headers.get("set-cookie") ?? "";

  const detalle = await fetch(`${base}/preguntas/${preguntaId}`, { headers: { cookie } });
  const html = await detalle.text();

  revisar(detalle.status === 200, "El administrador abre el detalle de la pregunta");
  revisar(
    html.includes("Moderación (solo administradores)"),
    "La página muestra el recuadro de moderación"
  );
  revisar(
    html.includes("Ocultar esta pregunta"),
    "La página muestra el botón «Ocultar esta pregunta»"
  );

  const ocultar = await fetch(`${base}/api/admin/preguntas/${preguntaId}/ocultar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ oculta: true }),
  });
  revisar(ocultar.status === 200, `Ocultar responde 200 (obtuvo ${ocultar.status})`);

  const listado = await (await fetch(`${base}/api/preguntas`)).json();
  const sigueVisible = listado.items.some((p) => p.id === preguntaId);
  revisar(!sigueVisible, "La pregunta oculta ya no aparece en el listado");

  const detalleOculto = await fetch(`${base}/preguntas/${preguntaId}`);
  const htmlOculto = await detalleOculto.text();
  revisar(
    !htmlOculto.includes("lista enlazada"),
    "El enlace directo ya no expone el contenido de la pregunta oculta"
  );

  const apiOculta = await fetch(`${base}/api/preguntas/${preguntaId}`);
  revisar(apiOculta.status === 404, `La API responde 404 para la pregunta oculta (obtuvo ${apiOculta.status})`);

  console.log(`\nResultado: ${process.exitCode ? "HAY FALLOS" : "MODERACIÓN FUNCIONA"}`);
} catch (error) {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (uid) {
    try {
      await db.collection("preguntas").doc(preguntaId).set({ oculta: false }, { merge: true });
      console.log("Limpieza: pregunta restaurada.");
      await auth.deleteUser(uid);
      console.log("Limpieza: usuario administrador temporal eliminado.");
    } catch (error) {
      console.error("Error en la limpieza:", error instanceof Error ? error.message : error);
    }
  }
}
