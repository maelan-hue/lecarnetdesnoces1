"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PRO_CATEGORIES } from "@/lib/utils";

type SelPro = {
  id: string;
  pro: {
    id: string; name: string; slug: string; category: string;
    tagline: string | null; city: string | null;
    profilePhoto: string | null;
    tarifs: { priceFrom: number }[];
  };
};

export default function Shortlist() {
  const [selections, setSelections] = useState<SelPro[]>([]);
  const [loaded,     setLoaded]     = useState(false);

  useEffect(() => {
    fetch("/api/couple/selection")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { setSelections(Array.isArray(d) ? d : []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const remove = async (proId: string) => {
    await fetch("/api/couple/selection", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proId }),
    });
    setSelections((s) => s.filter((x) => x.pro.id !== proId));
  };

  if (!loaded || selections.length === 0) return null;

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="section-title" style={{ marginBottom: 6 }}>
        Mes <em style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--gold)" }}>prestataires sauvegardés</em>
      </div>
      <p className="section-hint">{selections.length} prestataire{selections.length > 1 ? "s" : ""} dans votre sélection</p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:12 }}>
        {selections.map(({ pro }) => {
          const initials = pro.name.split(/\s+/).map((w) => w[0]).slice(0,2).join("").toUpperCase();
          return (
            <div key={pro.id} style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"16px", position:"relative", transition:"border-color 0.2s" }}>
              {/* Bouton supprimer */}
              <button
                onClick={() => remove(pro.id)}
                style={{ position:"absolute", top:10, right:10, background:"none", border:"none", cursor:"pointer", color:"var(--mute)", fontSize:"0.9rem", lineHeight:1, padding:4 }}
                title="Retirer de ma sélection"
              >
                ✕
              </button>

              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10 }}>
                {pro.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pro.profilePhoto} alt={pro.name} style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                ) : (
                  <div style={{ width:40, height:40, borderRadius:"50%", background:"var(--linen)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1rem", color:"var(--taupe)", flexShrink:0 }}>
                    {initials}
                  </div>
                )}
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", fontWeight:500, color:"var(--ink)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {pro.name}
                  </div>
                  <div style={{ fontSize:"0.68rem", color:"var(--mute)", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:2 }}>
                    {PRO_CATEGORIES[pro.category] ?? pro.category}
                  </div>
                </div>
              </div>

              {pro.tarifs[0] && (
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.82rem", color:"var(--gold)", marginBottom:8 }}>
                  À partir de {pro.tarifs[0].priceFrom.toLocaleString("fr-FR")} €
                </div>
              )}

              <div style={{ display:"flex", gap:6 }}>
                <Link href={`/prestataires/${pro.slug}`} className="btn ghost small" style={{ flex:1, justifyContent:"center", fontSize:"0.58rem" }}>
                  Voir la fiche
                </Link>
                <Link href={`/messages/nouveau?pros=${pro.id}`} className="btn gold small" style={{ flex:1, justifyContent:"center", fontSize:"0.58rem" }}>
                  Contacter
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
