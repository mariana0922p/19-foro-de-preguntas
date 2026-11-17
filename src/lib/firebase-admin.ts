import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export function tieneCredencialesFirebaseAdmin(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

/**
 * Inicializa el Admin SDK una sola vez y de forma perezosa: en modo
 * demostración (sin credenciales) este módulo se importa sin lanzar errores.
 */
function obtenerAppAdmin(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }

  if (!tieneCredencialesFirebaseAdmin()) {
    throw new Error(
      "Firebase Admin SDK no está configurado: revisa FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

export function obtenerAuthAdmin(): Auth {
  return getAuth(obtenerAppAdmin());
}

export function obtenerFirestoreAdmin(): Firestore {
  return getFirestore(obtenerAppAdmin());
}
