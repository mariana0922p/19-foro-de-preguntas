import { FieldValue } from "firebase-admin/firestore";
import {
  obtenerAuthAdmin,
  obtenerFirestoreAdmin,
  tieneCredencialesFirebaseAdmin,
} from "@/lib/firebase-admin";

export interface PerfilUsuarioItem {
  uid: string;
  nombre: string;
  reputacion: number;
  creadoEn: string;
}

const perfilesMock = new Map<string, PerfilUsuarioItem>();

export function reiniciarPerfilesMock() {
  perfilesMock.clear();
}

function referenciaPerfil(uid: string) {
  return obtenerFirestoreAdmin()
    .collection("usuarios")
    .doc(uid)
    .collection("perfil")
    .doc("actual");
}

export async function obtenerPerfilUsuario(
  uid: string
): Promise<PerfilUsuarioItem | null> {
  if (!tieneCredencialesFirebaseAdmin()) {
    return perfilesMock.get(uid) ?? null;
  }

  const documento = await referenciaPerfil(uid).get();
  if (!documento.exists) return null;

  const datos = documento.data() ?? {};
  return {
    uid,
    nombre: String(datos.nombre ?? "Estudiante"),
    reputacion: Number(datos.reputacion ?? 0),
    creadoEn: String(datos.creadoEn ?? new Date().toISOString()),
  };
}

export async function asegurarPerfilUsuario(
  uid: string,
  nombre: string
): Promise<PerfilUsuarioItem> {
  if (!tieneCredencialesFirebaseAdmin()) {
    const existente = perfilesMock.get(uid);
    if (existente) {
      existente.nombre = nombre;
      return existente;
    }
    const nuevo: PerfilUsuarioItem = {
      uid,
      nombre,
      reputacion: 0,
      creadoEn: new Date().toISOString(),
    };
    perfilesMock.set(uid, nuevo);
    return nuevo;
  }

  const referencia = referenciaPerfil(uid);
  const documento = await referencia.get();

  if (!documento.exists) {
    const nuevo: PerfilUsuarioItem = {
      uid,
      nombre,
      reputacion: 0,
      creadoEn: new Date().toISOString(),
    };
    await referencia.set(nuevo);
    return nuevo;
  }

  const datos = documento.data() ?? {};
  const actual: PerfilUsuarioItem = {
    uid,
    nombre: String(datos.nombre ?? nombre),
    reputacion: Number(datos.reputacion ?? 0),
    creadoEn: String(datos.creadoEn ?? new Date().toISOString()),
  };

  if (nombre && actual.nombre !== nombre) {
    await referencia.set({ nombre }, { merge: true });
    actual.nombre = nombre;
  }

  return actual;
}

export async function ajustarReputacion(
  uid: string,
  variacion: number
): Promise<void> {
  if (!uid || !Number.isFinite(variacion) || variacion === 0) return;

  if (!tieneCredencialesFirebaseAdmin()) {
    const perfil = perfilesMock.get(uid);
    if (!perfil) {
      perfilesMock.set(uid, {
        uid,
        nombre: "Estudiante",
        reputacion: Math.max(0, Math.trunc(variacion)),
        creadoEn: new Date().toISOString(),
      });
      return;
    }
    perfil.reputacion = Math.max(0, perfil.reputacion + Math.trunc(variacion));
    return;
  }

  await referenciaPerfil(uid).set(
    { reputacion: FieldValue.increment(Math.trunc(variacion)) },
    { merge: true }
  );
}

/** Nombre visible tomado de Firebase Auth (por si aún no existe el perfil). */
export async function obtenerNombreDeAuth(uid: string): Promise<string | null> {
  if (!tieneCredencialesFirebaseAdmin()) return null;

  try {
    const usuario = await obtenerAuthAdmin().getUser(uid);
    return usuario.displayName || usuario.email || null;
  } catch {
    return null;
  }
}
