/**
 * Diagnóstico de Firebase: Firestore, proveedor de correo/contraseña y
 * cantidad de usuarios de Authentication.
 *
 * Uso:
 *   node --env-file=.env.local scripts/verificar-firebase.mjs
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleAuth } from "google-auth-library";

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

console.log(`Proyecto: ${projectId}`);
console.log(`Cuenta de servicio: ${clientEmail}`);

// 1. Firestore
try {
  const db = getFirestore(app);
  const colecciones = await db.listCollections();

  if (colecciones.length === 0) {
    console.log("\nFirestore: responde, pero no hay colecciones todavía.");
  } else {
    console.log("\nFirestore:");
    for (const coleccion of colecciones) {
      const conteo = await coleccion.count().get();
      console.log(`- ${coleccion.id}: ${conteo.data().count} documento(s)`);
    }
  }
} catch (error) {
  console.error(
    "\nFirestore: error ->",
    error instanceof Error ? error.message : error
  );
}

// 2. Authentication (usuarios)
try {
  const listado = await getAuth(app).listUsers(1);
  console.log(
    `\nAuthentication: ${listado.users.length > 0 ? "tiene al menos 1 usuario" : "no tiene usuarios todavía"}.`
  );
} catch (error) {
  console.error(
    "Authentication: error ->",
    error instanceof Error ? error.message : error
  );
}

// 3. Proveedor de correo/contraseña (Identity Toolkit Admin API)
try {
  const googleAuth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const cliente = await googleAuth.getClient();
  const token = await cliente.getAccessToken();

  const respuesta = await fetch(
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`,
    { headers: { Authorization: `Bearer ${token.token}` } }
  );

  if (!respuesta.ok) {
    throw new Error(`HTTP ${respuesta.status}`);
  }

  const configuracion = await respuesta.json();
  const correo = configuracion?.signIn?.email;
  console.log(
    `\nProveedor correo/contraseña: ${
      correo?.enabled ? "HABILITADO" : "DESHABILITADO"
    }`
  );
  if (correo) {
    console.log(
      `- Registro de nuevos usuarios: ${
        correo?.hashConfig ? "configurado" : "sin hash adicional"
      }`
    );
  }
  const dominios = configuracion?.authorizedDomains ?? [];
  console.log(
    `- Dominios autorizados: ${dominios.length > 0 ? dominios.join(", ") : "ninguno"}`
  );
} catch (error) {
  console.log(
    "\nProveedor correo/contraseña: no se pudo consultar ->",
    error instanceof Error ? error.message : error
  );
}
