import type { NextConfig } from "next";

const esDesarrollo = process.env.NODE_ENV === "development";

/**
 * Política de contenido: todo el contenido es del mismo origen salvo las
 * llamadas del SDK web de Firebase Auth (Google Identity Toolkit).
 * En desarrollo se permite `unsafe-eval` porque React lo usa para depurar.
 */
const politicaContenido = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDesarrollo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://firebaseinstallations.googleapis.com${esDesarrollo ? " ws: wss:" : ""}`,
  "frame-src 'self' https://*.firebaseapp.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const cabecerasSeguridad = [
  { key: "Content-Security-Policy", value: politicaContenido },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: cabecerasSeguridad,
      },
    ];
  },
};

export default nextConfig;
