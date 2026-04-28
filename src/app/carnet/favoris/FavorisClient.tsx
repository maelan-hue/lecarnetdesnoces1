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

type Relation = {
  id: string; proId: string; status: "FAVORITE" | "RETAINED"; category: string;
  pro: RelPro;
};

type CategoryGroup = {
  key:      string;
  label:    string;
  relations: Relation[];
};

type Props = {
  categories:  CategoryGroup[];
  totalCount:  number;
};

export default function FavorisClient({ categories: initialCats, totalCount }: Props) {
  const router = useRouter();
  const [open,      setOpen]      = useState<Record<string, boolean>>({});
  const [cats,      setCats]      = useState(initialCats);
  const [acting,    setActing]    = useState(false);

  const toggle = (key: string) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  const removeRelation = async (proId: string, category: string) => {
    setActing(true);
    await fetch("/api/couple/vendors", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ proId, category, action: "remove" }),
    });
    setCats((prev) =>
      prev
        .map((c) => ({ ...c, relations: c.relations.filter((r) => r.proId !== proId) }))
        .filter((c) => c.relations.length > 0)
    );
    setActing(false);
  };

  const retainPro = async (proId: string, category: string) => {
    setActing(true);
    await fetch("/api/couple/vendors", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ proId, category, action: "retain" }),
    });
    setCats((prev) =>
      prev.map((c) =>
        c.key !== category ? c : {
          ...c,
          relations: c.relations.map((r) =>
            r.proId === proId
              ? { ...r, status: "RETAINED" as const }
              : r.status === "RETAINED"
                ? { ...r, status: "FAVORITE" as const }
                : r
          ),
        }
      )
    );
    setActing(false);
  };

  const initials = (name: string) =>
    name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const total = cats.reduce((s, c) => s + c.relations.length, 0);

  return (
    <div className="container">
      <div className="breadcrumb">
        <Link href="/carnet">Mon carnet</Link>
        <span className="sep">·</span>
        <span>Mes favoris</span>
      </div>

      <div className="page-head">
        <div className="eyebrow">Vos prestataires</div>
        <h1 className="page-title">Mes <em>favoris</em></h1>
        <p className="page-sub">
          {total > 0
            ? `${total} prestataire${total > 1 ? "s" : ""} sélectionné${total > 1 ? "s" : ""} · dépliez une catégorie pour gérer votre sélection.`
            : "Aucun favori pour l'instant — parcourez les prestataires et cliquez sur ♥ pour en ajouter."}
        </p>
      </div>

      {total === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"3rem", color:"var(--gold)", marginBottom:16 }}>♡</div>
          <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", marginBottom:24 }}>
            Explorez les prestataires et ajoutez vos coups de cœur.
          </p>
          <Link href="/prestataires" className="btn gold">Découvrir les prestataires →</Link>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {cats.map((cat) => {
            const isOpen     = !!open[cat.key];
            const retained   = cat.relations.find((r) => r.status === "RETAINED");
            const favCount   = cat.relations.filter((r) => r.status === "FAVORITE").length;

            return (
              <div key={cat.key} style={{ background:"var(--paper)", border:"1px solid var(--bone)" }}>
                {/* Header accordéon */}
                <div
                  onClick={() => toggle(cat.key)}
                  style={{ padding:"18px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", gap:16 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ivory)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:500 }}>
                      {cat.label}
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      {retained && (
                        <span style={{ background:"rgba(168,131,59,0.12)", color:"var(--gold)", border:"1px solid rgba(168,131,59,0.3)", fontSize:"0.56rem", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:600, padding:"2px 8px" }}>
                          ✦ Retenu
                        </span>
                      )}
                      <span style={{ background:"var(--ivory)", color:"var(--mute)", border:"1px solid var(--bone)", fontSize:"0.58rem", letterSpacing:"0.12em", textTransform:"uppercase", padding:"2px 8px" }}>
                        {cat.relations.length} ♥
                      </span>
                    </div>
                  </div>
                  <svg style={{ width:14, height:14, color:"var(--taupe)", transition:"transform 0.3s", transform: isOpen ? "rotate(180deg)" : "none", flexShrink:0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Corps dépliable */}
                {isOpen && (
                  <div style={{ borderTop:"1px dashed var(--bone)", padding:"16px 24px" }}>
                    {/* Retenu en premier */}
                    {retained && (
                      <div style={{ background:"linear-gradient(135deg,var(--paper),rgba(168,131,59,0.04))", border:"1px solid var(--gold)", borderLeft:"3px solid var(--gold)", padding:"16px 20px", marginBottom:12 }}>
                        <div style={{ fontSize:"0.58rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--gold)", fontWeight:600, marginBottom:10 }}>
                          ✦ Votre {cat.label.toLowerCase()} retenu
                        </div>
                        <ProRow pro={retained.pro} status="RETAINED" onRemove={() => removeRelation(retained.proId, cat.key)} onRetain={() => {}} acting={acting} initials={initials} />
                      </div>
                    )}

                    {/* Favoris */}
                    {cat.relations.filter((r) => r.status === "FAVORITE").map((rel) => (
                      <div key={rel.id} style={{ padding:"12px 0", borderBottom:"1px dashed var(--bone)" }}>
                        <ProRow
                          pro={rel.pro}
                          status="FAVORITE"
                          onRemove={() => removeRelation(rel.proId, cat.key)}
                          onRetain={() => retainPro(rel.proId, cat.key)}
                          acting={acting}
                          initials={initials}
                        />
                      </div>
                    ))}

                    <div style={{ marginTop:12 }}>
                      <Link href={`/prestataires?category=${cat.key}`} style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.85rem", color:"var(--gold)" }}>
                        + Voir d&apos;autres {cat.label.toLowerCase()}s →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProRow({ pro, status, onRemove, onRetain, acting, initials }: {
  pro: RelPro; status: "FAVORITE" | "RETAINED";
  onRemove: () => void; onRetain: () => void;
  acting: boolean; initials: (n: string) => string;
}) {
  return (
    <div style={{ display:"flex", gap:12, alignItems:"center", justifyContent:"space-between", flexWrap:"wrap" }}>
      <div style={{ display:"flex", gap:10, alignItems:"center", minWidth:0 }}>
        {pro.profilePhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pro.profilePhoto} alt={pro.name} style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
        ) : (
          <div style={{ width:40, height:40, borderRadius:"50%", background:"var(--linen)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.95rem", color:"var(--taupe)", flexShrink:0 }}>
            {initials(pro.name)}
          </div>
        )}
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", fontWeight:500 }}>{pro.name}</div>
          {pro.tagline && <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.8rem", color:"var(--mute)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pro.tagline}</div>}
          {pro.tarifs[0] && <div style={{ fontSize:"0.75rem", color:"var(--gold)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" }}>À partir de {pro.tarifs[0].priceFrom.toLocaleString("fr-FR")} €</div>}
        </div>
      </div>
      <div style={{ display:"flex", gap:6, flexShrink:0, flexWrap:"wrap" }}>
        <Link href={`/prestataires/${pro.slug}`} className="btn ghost small" style={{ fontSize:"0.56rem" }}>Fiche</Link>
        <Link href={`/messages/nouveau?pros=${pro.id}`} className="btn gold small" style={{ fontSize:"0.56rem" }}>Message</Link>
        {status === "FAVORITE" && (
          <button className="retain-btn" onClick={onRetain} disabled={acting} style={{ fontSize:"0.56rem" }}>★ Retenir</button>
        )}
        <button
          onClick={onRemove} disabled={acting}
          style={{ background:"none", border:"none", cursor:"pointer", color:"var(--mute)", fontSize:"1rem", padding:"4px 6px", transition:"color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--terracotta)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--mute)")}
          title="Retirer des favoris"
        >♥</button>
      </div>
    </div>
  );
}
