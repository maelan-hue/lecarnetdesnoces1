"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRO_CATEGORIES } from "@/lib/utils";

type RelPro = {
  id: string; name: string; slug: string; category: string;
  tagline: string | null; city: string | null; profilePhoto: string | null;
  tarifs: { priceFrom: number }[];
};

type Selection = {
  id: string; proId: string; status: string; category: string;
  budgetEntry: { id: string; totalAmount: number } | null;
  pro: RelPro;
};

type Props = {
  category:     string;
  taskCategory: string;
  selections:   Selection[];
  onSelectionsChange: (updated: Selection[]) => void;
};

const fmt = (cents: number) => (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " €";

export default function CategoryVendorSection({ category, taskCategory: _tc, selections, onSelectionsChange }: Props) {
  const router  = useRouter();
  const [acting, setActing] = useState(false);

  const confirmed   = selections.filter((s) => s.status === "confirmed");
  const inSelection = selections.filter((s) => s.status === "selection");
  const searchUrl   = `/prestataires?category=${category}`;

  const remove = async (proId: string) => {
    if (!confirm("Retirer ce prestataire de votre sélection ?")) return;
    setActing(true);
    await fetch("/api/couple/selections", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proId, action: "remove" }),
    });
    onSelectionsChange(selections.filter((s) => s.proId !== proId));
    setActing(false);
  };

  const unconfirm = async (proId: string) => {
    if (!confirm("Remettre ce prestataire en sélection ? Le devis associé sera supprimé.")) return;
    setActing(true);
    await fetch("/api/couple/selections", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proId, action: "unconfirm" }),
    });
    onSelectionsChange(selections.map((s) => s.proId === proId ? { ...s, status: "selection", budgetEntry: null } : s));
    setActing(false);
  };

  const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const ProAvatar = ({ pro }: { pro: RelPro }) => pro.profilePhoto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={pro.profilePhoto} alt={pro.name} style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
  ) : (
    <div style={{ width:40, height:40, borderRadius:"50%", background:"var(--linen)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.95rem", color:"var(--taupe)", flexShrink:0 }}>
      {initials(pro.name)}
    </div>
  );

  if (confirmed.length === 0 && inSelection.length === 0) {
    return (
      <div className="vendor-empty">
        <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", marginBottom:14, fontSize:"0.95rem" }}>
          Aucun {PRO_CATEGORIES[category]?.toLowerCase() ?? category} dans votre sélection.
        </p>
        <Link href={searchUrl} className="btn gold small">Découvrir les prestataires →</Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Confirmés ── */}
      {confirmed.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:"0.7rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--gold)", marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
            ✦ Confirmé{confirmed.length > 1 ? "s" : ""}
            <span style={{ color:"var(--mute)", fontWeight:400 }}>({confirmed.length})</span>
          </div>
          {confirmed.map((sel) => (
            <div key={sel.id} style={{ border:"1px solid var(--bone)", borderLeft:"2px solid var(--gold)", padding:"14px 18px", marginBottom:8, display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"center", background:"rgba(168,131,59,0.04)" } as React.CSSProperties}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <ProAvatar pro={sel.pro} />
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", fontWeight:500 }}>{sel.pro.name}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.78rem", color:"var(--mute)" }}>
                    {sel.pro.tagline ?? (sel.pro.city ?? "")}
                  </div>
                  {sel.budgetEntry
                    ? <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.85rem", color:"var(--gold)", marginTop:2 }}>{fmt(sel.budgetEntry.totalAmount)}</div>
                    : <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.78rem", color:"var(--mute)", marginTop:2 }}>budget non renseigné</div>
                  }
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {sel.budgetEntry
                  ? <button className="btn ghost small" onClick={() => router.push(`/carnet/budget/${sel.budgetEntry!.id}/modifier`)}>Modifier budget</button>
                  : <button className="btn gold small" onClick={() => router.push(`/carnet/budget/ajouter/plateforme?proId=${sel.proId}&category=${sel.category}`)}>Saisir le devis</button>
                }
                <button className="btn ghost small" style={{ fontSize:"0.56rem" }} onClick={() => unconfirm(sel.proId)} disabled={acting}>Remettre en sélection</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Ma sélection ── */}
      {inSelection.length > 0 && (
        <div>
          <div style={{ fontSize:"0.7rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--taupe)", marginBottom:10 }}>
            Ma sélection ({inSelection.length} en comparaison)
          </div>
          {inSelection.map((sel) => (
            <div key={sel.id} style={{ background:"var(--paper)", border:"1px solid var(--bone)", borderLeft:"2px solid var(--taupe)", padding:"14px 18px", marginBottom:8, display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"center" }}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <ProAvatar pro={sel.pro} />
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", fontWeight:500 }}>{sel.pro.name}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.78rem", color:"var(--mute)" }}>
                    {sel.pro.tagline ?? (sel.pro.city ?? "")}
                  </div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.78rem", color:"var(--mute)", marginTop:2 }}>budget non renseigné</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <Link href={`/prestataires/${sel.pro.slug}`} className="btn ghost small" style={{ fontSize:"0.56rem" }}>Fiche</Link>
                <button
                  className="btn gold small"
                  onClick={() => router.push(`/carnet/budget/ajouter/plateforme?proId=${sel.proId}&category=${sel.category}`)}
                >
                  Choisir ce prestataire
                </button>
                <button className="btn ghost small" style={{ fontSize:"0.56rem" }} onClick={() => remove(sel.proId)} disabled={acting}>Retirer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop:10 }}>
        <Link href={searchUrl} style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.85rem", color:"var(--gold)" }}>
          + Découvrir d&apos;autres {PRO_CATEGORIES[category]?.toLowerCase() ?? category}s
        </Link>
      </div>
    </div>
  );
}
