/**
 * Prueba de extremo a extremo del registro de una persona nueva:
 * 1. Crea una cuenta real con la API pública de Firebase Auth.
 * 2. Canjea el ID token por la cookie de sesión de la app.
 * 3. Consulta /api/auth/yo con esa cookie.
 * 4. Elimina el usuario de prueba (limpieza).
 *
 * Uso:
 *   node --env-file=.env.local scripts/probar-registro.mjs [https://tu-app.vercel.app]
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const base = (process.argv[2] ?? "https://19-foro-de-preguntas.vercel.app").replace(/\/$/, "");
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!apiKey || !projectId || !clientEmail || !privateKey) {
  console.error("Faltan variables de Firebase en .env.local.");
  process.exit(1);
}

const correo = `prueba-foro-${Date.now()}@example.com`;
const contrasena = `Prueba-${Math.random().toString(36).slice(2)}-2026`;

function revisar(condicion, mensaje) {
  console.log(`${condicion ? "OK " : "FALLO"}  ${mensaje}`);
  if (!condicion) process.exitCode = 1;
}

let uid = null;

try {
  console.log(`Probando registro en ${base} con ${correo}`);

  const registro = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: correo, password: contrasena, returnSecureToken: true }),
    }
  );
  const datosRegistro = await registro.json();

  if (!registro.ok) {
    throw new Error(
      `Firebase rechazó el registro (HTTP ${registro.status}): ${
        datosRegistro?.error?.message ?? "sin detalle"
      }`
    );
  }

  uid = datosRegistro.localId;
  revisar(Boolean(datosRegistro.idToken), "Firebase crea la cuenta y devuelve un ID token");

  const sesion = await fetch(`${base}/api/auth/sesion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: datosRegistro.idToken }),
  });
  const cookie = sesion.headers.get("set-cookie") ?? "";

  revisar(sesion.status === 204, `POST /api/auth/sesion responde 204 (obtuvo ${sesion.status})`);
  revisar(/sesion=/.test(cookie) && /HttpOnly/i.test(cookie), "La cookie de sesión es HttpOnly");

  const yo = await fetch(`${base}/api/auth/yo`, { headers: { cookie } });
  const datosYo = await yo.json().catch(() => ({}));

  revisar(yo.status === 200, `GET /api/auth/yo responde 200 (obtuvo ${yo.status})`);
  revisar(datosYo?.usuario?.uid === uid, "La sesión identifica al usuario recién creado");
  revisar(datosYo?.usuario?.rol === "estudiante", "El rol inicial es estudiante");

  console.log(`\nResultado: ${process.exitCode ? "HAY FALLOS" : "REGISTRO FUNCIONA CORRECTAMENTE"}`);
} catch (error) {
  console.error("Error en la prueba:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (uid) {
    try {
      const app =
        getApps()[0] ??
        initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
      await getAuth(app).deleteUser(uid);
      console.log("Limpieza: usuario de prueba eliminado.");
    } catch (error) {
      console.error(
        "No se pudo borrar el usuario de prueba:",
        error instanceof Error ? error.message : error
      );
    }
  }
}
