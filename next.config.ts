import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desactiva el empaquetado estático de firebase-admin para que Node.js lo cargue en tiempo de ejecución
  serverExternalPackages: ["firebase-admin"],
  turbopack: {},
};

export default nextConfig;