"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ManualEntryForm from "@/components/couple/ManualEntryForm";

type Pro = { id: string; name: string; category: string };

function PlateformeContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const proId   = params.get("proId");
  const [pro,         setPro]         = useState<Pro | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const [skipping,    setSkipping]    = useState(false);

  useEffect(() => {
    if (proId) {
      fetch(`/api/prestataires?ids=${proId}`)
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && d.length > 0 ? setPro(d[0]) : null);
    }
    fetch("/api/couple/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.weddingDate) {
          setDefaultDate(new Date(d.weddingDate).toISOString().split("T")[0]);
        }
      })
      .catch(() => {});
  }, [proId]);

  const handleSkip = async () => {
    if (!proId) { router.push("/carnet/budget"); return; }
    setSkipping(true);
    await fetch("/api/couple/selections", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ proId, action: "confirm" }),
    });
    router.push("/carnet/budget");
  };

  if (proId && !pro) {
    return (
      <div className="container narrow" style={{ paddingTop:80 }}>
        <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div>
      {proId && pro && (
        <div className="container narrow" style={{ paddingTop:40 }}>
          <div style={{ background:"rgba(168,131,59,0.08)", border:"1px solid var(--gold)", borderLeft:"3px solid var(--gold)", padding:"16px 20px", marginBottom:24, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.5rem", color:"var(--gold)", flexShrink:0 }}>✦</span>
            <div>
              <div style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.72rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--gold)", fontWeight:500, marginBottom:4 }}>Choix enregistré</div>
              <p className="serif" style={{ fontStyle:"italic", fontSize:"0.95rem", lineHeight:1.6 }}>
                <strong style={{ fontStyle:"normal" }}>{pro.name}</strong> est désormais confirmé dans votre carnet. Vous pouvez compléter le budget maintenant ou plus tard.
              </p>
            </div>
          </div>
        </div>
      )}

      <ManualEntryForm
        mode="cas-b"
        preFilledProId={pro?.id ?? proId ?? undefined}
        preFilledName={pro?.name ?? "Prestataire du Carnet"}
        preFilledCategory={pro?.category ?? "PHOTOGRAPHE"}
        defaultDate={defaultDate}
        onSkip={proId ? handleSkip : undefined}
      />
    </div>
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
