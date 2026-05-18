"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PRO_CATEGORIES } from "@/lib/utils";

type Selection = {
  proId: string; status: string; category: string;
  pro: { id: string; name: string; slug: string; city: string | null; tarifs: { priceFrom: number }[] };
};

export default function SelectionPickerPage() {
  const router = useRouter();
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch("/api/couple/selections")
      .then((r) => r.json())
      .then((d) => { setSelections(Array.isArray(d) ? d.filter((s: Selection) => s.status === "selection") : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = [...new Set(selections.map((s) => s.category))];

  return (
    <div className="container narrow" style={{ paddingTop:60 }}>
      <div className="breadcrumb">
        <Link href="/carnet/budget">Mon budget</Link>
        <span className="sep">·</span>
        <Link href="/carnet/budget/ajouter">Ajouter</Link>
        <span className="sep">·</span>
        <span>Ma sélection</span>
      </div>

      <h1 className="page-title" style={{ marginBottom:8 }}>Votre <em>sélection</em></h1>
      <p className="page-sub" style={{ marginBottom:32 }}>
        Cliquez sur le prestataire que vous souhaitez confirmer et saisir.
      </p>

      {loading ? (
        <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Chargement…</p>
      ) : selections.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 0" }}>
          <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", marginBottom:20 }}>
            Votre sélection est vide. Ajoutez des prestataires depuis l&apos;annuaire.
          </p>
          <Link href="/prestataires" className="btn gold">Découvrir les prestataires →</Link>
        </div>
      ) : (
        <>
          {categories.map((cat) => {
            const items = selections.filter((s) => s.category === cat);
            const label = PRO_CATEGORIES[cat] ?? cat;
            return (
              <div key={cat} style={{ marginBottom:28 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10, paddingBottom:8, borderBottom:"1px dashed var(--bone)" }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", fontWeight:500 }}>{label}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.9rem" }}>{items.length} en sélection</div>
                </div>
                {items.map((sel) => (
                  <div
                    key={sel.proId}
                    onClick={() => router.push(`/carnet/budget/ajouter/plateforme?proId=${sel.proId}&category=${sel.category}`)}
                    style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"14px 20px", marginBottom:8, display:"grid", gridTemplateColumns:"1fr auto", gap:14, alignItems:"center", cursor:"pointer", transition:"border-color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bone)")}
                  >
                    <div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.05rem", fontWeight:500 }}>{sel.pro.name}</div>
                      <div style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.66rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--taupe)", marginTop:2 }}>
                        {[sel.pro.city, sel.pro.tarifs[0] ? `à partir de ${sel.pro.tarifs[0].priceFrom.toLocaleString("fr-FR")} €` : null].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--gold)" }}>Choisir →</div>
                  </div>
                ))}
              </div>
            );
          })}

          <div style={{ marginTop:28, paddingTop:20, borderTop:"1px dashed var(--bone)", textAlign:"center" }}>
            <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", marginBottom:12, fontSize:"0.92rem" }}>
              Vous ne voyez pas votre prestataire ?
            </p>
            <Link href="/carnet/budget/ajouter/externe" className="btn ghost small">+ Ajouter un prestataire hors plateforme</Link>
          </div>
        </>
      )}
    </div>
  );
}
