import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const apps = getApps();
let adminApp: App | undefined;

if (!apps.length) {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
} else {
  adminApp = apps[0];
}

export function tieneCredencialesFirebaseAdmin(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

export function obtenerAuthAdmin() {
  if (!adminApp) return null;
  return getAuth(adminApp);
}

export function obtenerFirestoreAdmin() {
  if (!adminApp) return null;
  return getFirestore(adminApp);
}

export const adminAuth = obtenerAuthAdmin();
export const adminDb = obtenerFirestoreAdmin();