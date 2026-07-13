"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AMBIANCES } from "@/lib/utils";
import AddToSelectionButton from "@/components/couple/AddToSelectionButton";

type Pro = {
  id: string; slug: string; name: string; tagline: string | null;
  category: string; ambiances: string[]; city: string | null;
  department: string | null; portfolioPhotos: string[];
  profilePhoto: string | null; calendarActive: boolean;
  tarifs: { priceFrom: number }[];
  availability: { status: string }[];
};

type Selection = { proId: string; status: string };

type Props = {
  coupleData: { weddingDate: string | null; weddingCity: string | null; guestCount: number | null };
  categories: { value: string; label: string }[];
  isCouple: boolean;
};

const PRIMARY_CATEGORIES = ["PHOTOGRAPHE", "TRAITEUR", "LIEU", "FLEURISTE"];

function SearchContent({ coupleData, categories, isCouple }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [pros,       setPros]       = useState<Pro[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [category,   setCategory]   = useState(searchParams.get("category") ?? "");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (coupleData.weddingDate) params.set("date", coupleData.weddingDate.split("T")[0]);

    const prosRes = await fetch(`/api/prestataires?${params}`);
    if (prosRes.ok) { const d = await prosRes.json(); setPros(Array.isArray(d) ? d : []); }

    if (isCouple) {
      const selRes = await fetch("/api/couple/selections");
      if (selRes.ok) { const d = await selRes.json(); setSelections(Array.isArray(d) ? d.map((s: { proId: string; status: string }) => ({ proId: s.proId, status: s.status })) : []); }
    }

    setLoading(false);
  }, [category, coupleData.weddingDate, isCouple]);

  useEffect(() => { load(); }, [load]);

  const getSelectionStatus = (proId: string): "none" | "selection" | "confirmed" => {
    const s = selections.find((s) => s.proId === proId);
    if (!s) return "none";
    return s.status as "selection" | "confirmed";
  };

  const getAvailLabel = (pro: Pro): "ok" | "unavailable" | "contact" => {
    if (!coupleData.weddingDate)               return "contact";
    if (!pro.calendarActive)                   return "contact";
    if (!Array.isArray(pro.availability) || pro.availability.length === 0) return "contact";
    const s = pro.availability[0].status;
    if (s === "AVAILABLE")   return "ok";
    if (s === "UNAVAILABLE") return "unavailable";
    return "contact";
  };

  const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const weddingLabel = coupleData.weddingDate
    ? new Date(coupleData.weddingDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "Date à définir";

  return (
    <div className="container">
      <div className="page-head">
        <div className="eyebrow">Artisans du mariage</div>
        <h1 className="page-title">Nos <em>prestataires</em></h1>
        <p className="page-sub">
          Ajoutez plusieurs prestataires à votre sélection pour les comparer. Quand vous êtes prêts, choisissez celui que vous retenez.
        </p>
      </div>

      {!coupleData.weddingDate && (
        <div className="tip" style={{ marginBottom: 20 }}>
          🌿 <strong>Conseil —</strong> Renseignez votre date de mariage dans{" "}
          <a href="/carnet" style={{ color: "var(--gold)" }}>votre carnet</a>{" "}
          pour voir les disponibilités.
        </div>
      )}

      <div className="context-bar">
        <div className="ctx-facts">
          <div className="ctx-fact"><div className="ctx-fact-lbl">Date</div><div className="ctx-fact-val">{weddingLabel}</div></div>
          {coupleData.weddingCity && <div className="ctx-fact"><div className="ctx-fact-lbl">Lieu</div><div className="ctx-fact-val">{coupleData.weddingCity}</div></div>}
          {coupleData.guestCount  && <div className="ctx-fact"><div className="ctx-fact-lbl">Invités</div><div className="ctx-fact-val">{coupleData.guestCount}</div></div>}
        </div>
      </div>

      <div className="filters-row">
        <span style={{ fontSize:"0.66rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--mute)", marginRight:6 }}>Catégorie</span>
        <button className={`chip${category === "" ? " active" : ""}`} onClick={() => setCategory("")}>Tous</button>
        {categories
          .filter(({ value }) => PRIMARY_CATEGORIES.includes(value))
          .map(({ value, label }) => (
            <button key={value} className={`chip${category === value ? " active" : ""}`} onClick={() => setCategory(value === category ? "" : value)}>{label}</button>
          ))}
        {!showAllCategories && (
          <button className="chip" onClick={() => setShowAllCategories(true)}>Plus de catégories</button>
        )}
        {showAllCategories && categories
          .filter(({ value }) => !PRIMARY_CATEGORIES.includes(value))
          .map(({ value, label }) => (
            <button key={value} className={`chip${category === value ? " active" : ""}`} onClick={() => setCategory(value === category ? "" : value)}>{label}</button>
          ))}
      </div>

      {loading ? (
        <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", padding:"40px 0" }}>Chargement…</p>
      ) : pros.length === 0 ? (
        <div style={{ padding:"60px 0", textAlign:"center" }}>
          <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", marginBottom:16 }}>Aucun prestataire trouvé.</p>
          <button className="btn ghost small" onClick={() => setCategory("")}>Effacer les filtres</button>
        </div>
      ) : (
        <div className="presta-list">
          {pros.map((pro) => {
            const selStatus = getSelectionStatus(pro.id);
            const avail     = getAvailLabel(pro);

            return (
              <div
                key={pro.id}
                className="presta-card"
                onClick={() => router.push(`/prestataires/${pro.slug}`)}
                style={{ cursor:"pointer", position:"relative" }}
              >
                {/* Photo / initiales */}
                {pro.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pro.profilePhoto} alt={pro.name} className="presta-photo" style={{ objectFit:"cover", borderRadius:"50%" }} />
                ) : (
                  <div className="presta-photo serif">{initials(pro.name)}</div>
                )}

                <div>
                  <div className="presta-name">{pro.name}</div>
                  {pro.tagline && <div className="presta-style">{pro.tagline}</div>}
                  <div className="presta-meta">
                    {[pro.city, pro.department ? `Dép. ${pro.department}` : null].filter(Boolean).join(" · ")}
                    {pro.ambiances.length > 0 && ` · ${pro.ambiances.map((a) => AMBIANCES[a] ?? a).join(", ")}`}
                  </div>
                </div>

                <div className="presta-avail">
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:6, marginBottom:8 }}>
                    {selStatus === "confirmed" && (
                      <div style={{ fontSize:"0.52rem", letterSpacing:"0.14em", textTransform:"uppercase", background:"var(--gold)", color:"var(--paper)", padding:"2px 8px", fontWeight:600 }}>
                        Confirmé
                      </div>
                    )}
                    {selStatus === "selection" && (
                      <div style={{ fontSize:"0.52rem", letterSpacing:"0.14em", textTransform:"uppercase", background:"rgba(138,123,99,0.15)", color:"var(--taupe)", border:"1px solid rgba(138,123,99,0.3)", padding:"2px 8px", fontWeight:600 }}>
                        Ma sélection
                      </div>
                    )}
                  </div>
                  {avail === "ok"          && <div className="avail-dot avail-ok">Disponible</div>}
                  {avail === "contact"     && <div className="avail-dot avail-contact">À contacter</div>}
                  {avail === "unavailable" && <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px", fontSize:"0.6rem", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:500, background:"rgba(176,96,74,0.12)", color:"var(--terracotta)", border:"1px solid rgba(176,96,74,0.3)", marginBottom:6 }}><span style={{ width:6, height:6, borderRadius:"50%", background:"var(--terracotta)", display:"inline-block" }} />Indisponible</div>}
                  {pro.tarifs[0] && <div className="presta-price">À partir de {pro.tarifs[0].priceFrom.toLocaleString("fr-FR")} €</div>}
                  {isCouple && (
                    <div style={{ marginTop:8 }} onClick={(e) => e.stopPropagation()}>
                      <AddToSelectionButton proId={pro.id} initialStatus={selStatus} />
                    </div>
                  )}
                  {!isCouple && (
                    <div style={{ marginTop:6, fontSize:"0.62rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--gold)" }}>Voir la fiche →</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PrestataireSearch(props: Props) {
  return (
    <Suspense fallback={<div className="container"><p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", paddingTop:60 }}>Chargement…</p></div>}>
      <SearchContent {...props} />
    </Suspense>
  );
}
