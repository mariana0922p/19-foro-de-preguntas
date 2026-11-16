export const dynamic = "force-dynamic";

import { Suspense } from "react";
import DetallePreguntaClient from "./DetallePreguntaClient";

export default async function DetallePreguntaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-label="Cargando detalle de pregunta">
          <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      }
    >
      <DetallePreguntaClient id={resolvedParams.id} />
    </Suspense>
  );
}