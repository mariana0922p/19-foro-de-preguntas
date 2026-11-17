import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const configuracion = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * La configuración web de Firebase es pública por diseño: identifica el
 * proyecto, pero no permite leer Firestore (las reglas lo niegan).
 */
export function firebaseClienteConfigurado(): boolean {
  return Boolean(
    configuracion.apiKey &&
      configuracion.authDomain &&
      configuracion.projectId &&
      configuracion.appId
  );
}

export function obtenerAppCliente(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(configuracion);
}

export function obtenerAuthCliente(): Auth {
  return getAuth(obtenerAppCliente());
}
