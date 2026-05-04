"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ManualEntryForm from "@/components/couple/ManualEntryForm";

type Pro = { id: string; name: string; category: string };

function PlateformeContent() {
  const params  = useSearchParams();
  const proId   = params.get("proId");
  const [pro,         setPro]         = useState<Pro | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Charger le pro si fourni
    if (proId) {
      fetch(`/api/prestataires?ids=${proId}`)
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && d.length > 0 ? setPro(d[0]) : null);
    }
    // Charger la date du mariage
    fetch("/api/couple/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.weddingDate) {
          setDefaultDate(new Date(d.weddingDate).toISOString().split("T")[0]);
        }
      })
      .catch(() => {});
  }, [proId]);

  if (proId && !pro) {
    return (
      <div className="container narrow" style={{ paddingTop:80 }}>
        <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Chargement…</p>
      </div>
    );
  }

  return (
    <ManualEntryForm
      mode="cas-b"
      preFilledProId={pro?.id ?? proId ?? undefined}
      preFilledName={pro?.name ?? "Prestataire du Carnet"}
      preFilledCategory={pro?.category ?? "PHOTOGRAPHE"}
      defaultDate={defaultDate}
    />
  );
}

export default function PlateformePage() {
  return (
    <Suspense fallback={
      <div className="container narrow" style={{ paddingTop:80 }}>
        <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Chargement…</p>
      </div>
    }>
      <PlateformeContent />
    </Suspense>
  );
}
