import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

function obtenerAppAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export function obtenerFirestoreAdmin(): Firestore {
  return getFirestore(obtenerAppAdmin());
}

export function obtenerAuthAdmin(): Auth {
  return getAuth(obtenerAppAdmin());
}