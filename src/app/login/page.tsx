"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  firebaseClienteConfigurado,
  obtenerAuthCliente,
} from "@/lib/firebase-client";

type Modo = "ingresar" | "registrar";

function destinoSeguro(valor: string | null): string {
  if (!valor) return "/";
  if (!valor.startsWith("/") || valor.startsWith("//")) return "/";
  return valor;
}

function mensajeDeError(codigo: string | undefined): string {
  switch (codigo) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos. Verifica tus datos.";
    case "auth/email-already-in-use":
      return "Ese correo ya tiene una cuenta. Usa la opción «Ingresar».";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-email":
      return "El correo electrónico no es válido.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
    case "auth/operation-not-allowed":
      return "El inicio de sesión con correo no está habilitado en Firebase.";
    case "auth/network-request-failed":
      return "No hay conexión con Firebase. Revisa tu red.";
    default:
      return "No se pudo completar el inicio de sesión. Inténtalo de nuevo.";
  }
}

function FormularioSesion() {
  const router = useRouter();
  const parametros = useSearchParams();
  const destino = destinoSeguro(parametros.get("next"));

  const [modo, setModo] = useState<Modo>("ingresar");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const configurado = firebaseClienteConfigurado();

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    if (!configurado) {
      setError(
        "Faltan las variables NEXT_PUBLIC_FIREBASE_* del cliente. Revisa .env.local."
      );
      return;
    }

    setEnviando(true);
    try {
      const auth = obtenerAuthCliente();

      if (modo === "registrar") {
        const credencial = await createUserWithEmailAndPassword(
          auth,
          correo.trim(),
          contrasena
        );
        if (nombre.trim()) {
          await updateProfile(credencial.user, { displayName: nombre.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, correo.trim(), contrasena);
      }

      const usuario = auth.currentUser;
      if (!usuario) throw new Error("Sin usuario autenticado");

      const idToken = await usuario.getIdToken(true);
      const respuesta = await fetch("/api/auth/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));
        setError(
          typeof datos.error === "string"
            ? datos.error
            : "No se pudo crear la sesión en el servidor."
        );
        return;
      }

      router.replace(destino);
      router.refresh();
    } catch (excepcion: unknown) {
      const codigo =
        typeof excepcion === "object" && excepcion !== null && "code" in excepcion
          ? String((excepcion as { code?: unknown }).code)
          : undefined;
      setError(mensajeDeError(codigo));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {modo === "ingresar" ? "Iniciar sesión" : "Crear una cuenta"}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Usa tu correo para publicar preguntas, votar y marcar respuestas
        aceptadas.
      </p>

      <div
        role="group"
        aria-label="Elige ingresar o registrarte"
        className="mt-5 flex gap-2"
      >
        <button
          type="button"
          aria-pressed={modo === "ingresar"}
          onClick={() => {
            setModo("ingresar");
            setError(null);
          }}
          className={`min-h-11 flex-1 rounded-md border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
            modo === "ingresar"
              ? "border-blue-700 bg-blue-700 text-white"
              : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          aria-pressed={modo === "registrar"}
          onClick={() => {
            setModo("registrar");
            setError(null);
          }}
          className={`min-h-11 flex-1 rounded-md border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
            modo === "registrar"
              ? "border-blue-700 bg-blue-700 text-white"
              : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form
        onSubmit={manejarEnvio}
        noValidate
        className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        {modo === "registrar" && (
          <div>
            <label
              htmlFor="campo-nombre"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Nombre visible
            </label>
            <input
              id="campo-nombre"
              name="name"
              type="text"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="campo-correo"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Correo electrónico
          </label>
          <input
            id="campo-correo"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            aria-describedby={error ? "error-sesion" : undefined}
            className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>

        <div>
          <label
            htmlFor="campo-contrasena"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Contraseña
          </label>
          <input
            id="campo-contrasena"
            name="password"
            type="password"
            autoComplete={
              modo === "registrar" ? "new-password" : "current-password"
            }
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            minLength={6}
            aria-describedby={error ? "error-sesion" : undefined}
            className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </div>

        {error && (
          <p
            id="error-sesion"
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="min-h-11 w-full rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {enviando
            ? "Conectando con Firebase..."
            : modo === "ingresar"
              ? "Ingresar"
              : "Crear cuenta e ingresar"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        <Link
          href="/"
          className="font-medium text-blue-700 underline hover:text-blue-900 dark:text-blue-400"
        >
          Volver al foro sin iniciar sesión
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="mx-auto max-w-md text-sm text-slate-600">
          Cargando formulario de sesión...
        </p>
      }
    >
      <FormularioSesion />
    </Suspense>
  );
}
