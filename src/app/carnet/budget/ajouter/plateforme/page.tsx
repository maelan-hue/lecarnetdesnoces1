"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ManualEntryForm from "@/components/couple/ManualEntryForm";
import { PRO_CATEGORIES } from "@/lib/utils";

type Pro = { id: string; name: string; category: string };

function PlateformeContent() {
  const params = useSearchParams();
  const proId  = params.get("proId");
  const [pro, setPro] = useState<Pro | null>(null);

  useEffect(() => {
    if (!proId) return;
    fetch(`/api/prestataires?ids=${proId}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && d.length > 0 ? setPro(d[0]) : null);
  }, [proId]);

  if (proId && !pro) {
    return <div className="container narrow" style={{ paddingTop:80 }}>
      <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Chargement…</p>
    </div>;
  }

  return (
    <ManualEntryForm
      mode="cas-b"
      preFilledProId={pro?.id ?? proId ?? undefined}
      preFilledName={pro?.name ?? "Prestataire du Carnet"}
      preFilledCategory={pro?.category ?? "PHOTOGRAPHE"}
    />
  );
}

export default function PlateformePage() {
  return (
    <Suspense fallback={<div className="container narrow" style={{ paddingTop:80 }}><p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Chargement…</p></div>}>
      <PlateformeContent />
    </Suspense>
  );
}
