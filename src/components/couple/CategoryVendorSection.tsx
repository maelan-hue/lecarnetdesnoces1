"use client";

import { useState } from "react";
import Link from "next/link";
import { PRO_CATEGORIES } from "@/lib/utils";

type RelPro = {
  id: string; name: string; slug: string; category: string;
  tagline: string | null; city: string | null; profilePhoto: string | null;
  tarifs: { priceFrom: number }[];
};

type Relation = {
  id: string; proId: string; status: "FAVORITE" | "RETAINED"; category: string;
  pro: RelPro;
};

type Props = {
  category:     string;
  taskCategory: string;
  relations:    Relation[];
  onRelationsChange: (updated: Relation[]) => void;
};

export default function CategoryVendorSection({ category, taskCategory: _taskCategory, relations, onRelationsChange }: Props) {
  const [acting, setActing] = useState(false);

  const retained  = relations.find((r) => r.category === category && r.status === "RETAINED");
  const favorites = relations.filter((r) => r.category === category && r.status === "FAVORITE");
  const searchUrl = `/prestataires?category=${category}`;

  const remove = async (proId: string) => {
    setActing(true);
    await fetch("/api/couple/vendors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proId, category, action: "remove" }),
    });
    onRelationsChange(relations.filter((r) => r.proId !== proId));
    setActing(false);
  };

  const retain = async (proId: string, proCategory: string) => {
    setActing(true);
    const res = await fetch("/api/couple/vendors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proId, category: proCategory, action: "retain" }),
    });
    if (res.ok) {
      const updated = relations.map((r) => {
        if (r.proId === proId)  return { ...r, status: "RETAINED" as const };
        if (r.status === "RETAINED" && r.category === category) return { ...r, status: "FAVORITE" as const };
        return r;
      });
      onRelationsChange(updated);
    }
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

  if (!retained && favorites.length === 0) {
    return (
      <div className="vendor-empty">
        <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", marginBottom:14, fontSize:"0.95rem" }}>
          Aucun {PRO_CATEGORIES[category]?.toLowerCase() ?? category} sélectionné.
        </p>
        <Link href={searchUrl} className="btn gold small">Découvrir les prestataires →</Link>
      </div>
    );
  }

  return (
    <div>
      {retained && (
        <div className="retained-card">
          <div className="retained-badge">
            ✦ Votre {PRO_CATEGORIES[category]?.toLowerCase() ?? category}
          </div>
          <div style={{ display:"flex", gap:14, alignItems:"center", justifyContent:"space-between", flexWrap:"wrap" }}>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <ProAvatar pro={retained.pro} />
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", fontWeight:500 }}>{retained.pro.name}</div>
                {retained.pro.tagline && <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.85rem", color:"var(--mute)" }}>{retained.pro.tagline}</div>}
                {retained.pro.tarifs[0] && <div style={{ fontSize:"0.78rem", color:"var(--gold)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" }}>À partir de {retained.pro.tarifs[0].priceFrom.toLocaleString("fr-FR")} €</div>}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <Link href={`/messages/nouveau?pros=${retained.pro.id}`} className="btn gold small">Message</Link>
              <Link href={`/prestataires/${retained.pro.slug}`} className="btn ghost small">Fiche</Link>
              <button className="heart-btn filled" onClick={() => remove(retained.pro.id)} disabled={acting} title="Retirer des favoris">♥</button>
            </div>
          </div>
        </div>
      )}

      {favorites.length > 0 && (
        <div>
          <div style={{ fontSize:"0.7rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--mute)", marginBottom:10 }}>
            {retained ? `Autres en comparaison (${favorites.length})` : `Vos favoris (${favorites.length}/5)`}
          </div>
          {favorites.map((rel) => (
            <div key={rel.id} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, padding:"12px 0", borderBottom:"1px dashed var(--bone)", alignItems:"center" }}>
              <div style={{ display:"flex", gap:10, alignItems:"center", minWidth:0 }}>
                <ProAvatar pro={rel.pro} />
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{rel.pro.name}</div>
                  {rel.pro.tarifs[0] && <div style={{ fontSize:"0.78rem", color:"var(--gold)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" }}>À partir de {rel.pro.tarifs[0].priceFrom.toLocaleString("fr-FR")} €</div>}
                </div>
              </div>

              <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                <Link href={`/prestataires/${rel.pro.slug}`} className="btn ghost small" style={{ fontSize:"0.56rem" }}>Fiche</Link>
                <Link href={`/messages/nouveau?pros=${rel.pro.id}`} className="btn ghost small" style={{ fontSize:"0.56rem" }}>Message</Link>
                <button className="retain-btn" onClick={() => retain(rel.pro.id, rel.category)} disabled={acting} title={retained ? "Retenir à la place" : "Retenir ce prestataire"}>
                  {retained ? "★ Retenir à la place" : "★ Retenir"}
                </button>
                <button className="heart-btn filled" onClick={() => remove(rel.pro.id)} disabled={acting} title="Retirer des favoris">♥</button>
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
