"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AMBIANCES } from "@/lib/utils";

type Pro = {
  id: string; slug: string; name: string; tagline: string | null;
  category: string; ambiances: string[]; city: string | null;
  department: string | null; portfolioPhotos: string[];
  profilePhoto: string | null; calendarActive: boolean;
  tarifs: { priceFrom: number }[];
  availability: { status: string }[];
};

type Relation = { proId: string; status: "FAVORITE" | "RETAINED"; category: string };

type Props = {
  coupleData: { weddingDate: string | null; weddingCity: string | null; guestCount: number | null; ambiances: string[] };
  categories: { value: string; label: string }[];
};

function SearchContent({ coupleData, categories }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [pros,      setPros]      = useState<Pro[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [category,  setCategory]  = useState(searchParams.get("category") ?? "");
  const [ambiance,  setAmbiance]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (ambiance) params.set("ambiance", ambiance);
    if (coupleData.weddingDate) params.set("date", coupleData.weddingDate.split("T")[0]);
    const [prosRes, relRes] = await Promise.all([
      fetch(`/api/prestataires?${params}`),
      fetch("/api/couple/vendors"),
    ]);
    if (prosRes.ok) { const d = await prosRes.json(); setPros(Array.isArray(d) ? d : []); }
    if (relRes.ok)  { const d = await relRes.json();  setRelations(Array.isArray(d) ? d : []); }
    setLoading(false);
  }, [category, ambiance, coupleData.weddingDate]);

  useEffect(() => { load(); }, [load]);

  const getRelation = (proId: string) => relations.find((r) => r.proId === proId) ?? null;

  const toggleFavorite = async (pro: Pro, e: React.MouseEvent) => {
    e.stopPropagation();
    const rel = getRelation(pro.id);
    setActionLoading(true);

    if (rel) {
      await fetch("/api/couple/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proId: pro.id, category: pro.category, action: "remove" }),
      });
      setRelations((r) => r.filter((x) => x.proId !== pro.id));
    } else {
      const res  = await fetch("/api/couple/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proId: pro.id, category: pro.category, action: "favorite" }),
      });
      const json = await res.json();
      if (res.ok) {
        setRelations((r) => [...r.filter((x) => x.proId !== pro.id), { proId: pro.id, status: "FAVORITE", category: pro.category }]);
      } else {
        alert(json.error ?? "Erreur");
      }
    }
    setActionLoading(false);
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
          Cliquez sur ♥ pour ajouter aux favoris. Consultez les fiches et contactez directement chaque prestataire.
        </p>
      </div>

      {!coupleData.weddingDate && (
        <div className="tip" style={{ marginBottom: 20 }}>
          🌿 <strong>Conseil —</strong> Renseignez votre date de mariage dans{" "}
          <a href="/carnet" style={{ color: "var(--gold)" }}>votre carnet</a>{" "}
          pour voir les disponibilités.
        </div>
      )}

      {/* Barre de contexte */}
      <div className="context-bar">
        <div className="ctx-facts">
          <div className="ctx-fact"><div className="ctx-fact-lbl">Date</div><div className="ctx-fact-val">{weddingLabel}</div></div>
          {coupleData.weddingCity && <div className="ctx-fact"><div className="ctx-fact-lbl">Lieu</div><div className="ctx-fact-val">{coupleData.weddingCity}</div></div>}
          {coupleData.guestCount  && <div className="ctx-fact"><div className="ctx-fact-lbl">Invités</div><div className="ctx-fact-val">{coupleData.guestCount}</div></div>}
        </div>
      </div>

      {/* Filtres catégorie */}
      <div className="filters-row">
        <span style={{ fontSize:"0.66rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--mute)", marginRight:6 }}>Catégorie</span>
        <button className={`chip${category === "" ? " active" : ""}`} onClick={() => setCategory("")}>Tous</button>
        {categories.map(({ value, label }) => (
          <button key={value} className={`chip${category === value ? " active" : ""}`} onClick={() => setCategory(value === category ? "" : value)}>{label}</button>
        ))}
      </div>

      <div className="filters-row" style={{ marginTop:-8 }}>
        <span style={{ fontSize:"0.66rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--mute)", marginRight:6 }}>Ambiance</span>
        {Object.entries(AMBIANCES).map(([key, label]) => (
          <button key={key} className={`chip${ambiance === key ? " active" : ""}`} onClick={() => setAmbiance(ambiance === key ? "" : key)}>{label}</button>
        ))}
      </div>

      <div className="tip">
        🌿 <strong>Bon à savoir —</strong> Ajoutez jusqu&apos;à 5 favoris par catégorie pour comparer. Cliquez sur une fiche pour contacter le prestataire.
      </div>

      {loading ? (
        <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", padding:"40px 0" }}>Chargement…</p>
      ) : pros.length === 0 ? (
        <div style={{ padding:"60px 0", textAlign:"center" }}>
          <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", marginBottom:16 }}>Aucun prestataire trouvé.</p>
          <button className="btn ghost small" onClick={() => { setCategory(""); setAmbiance(""); }}>Effacer les filtres</button>
        </div>
      ) : (
        <div className="presta-list">
          {pros.map((pro) => {
            const rel    = getRelation(pro.id);
            const isFav  = !!rel;
            const avail  = getAvailLabel(pro);

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
                  <img src={pro.profilePhoto} alt={pro.name} className="presta-photo" style={{ objectFit:"cover" }} />
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
                  {avail === "ok"          && <div className="avail-dot avail-ok">Disponible</div>}
                  {avail === "contact"     && <div className="avail-dot avail-contact">À contacter</div>}
                  {avail === "unavailable" && <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px", fontSize:"0.6rem", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:500, background:"rgba(176,96,74,0.12)", color:"var(--terracotta)", border:"1px solid rgba(176,96,74,0.3)", marginBottom:6 }}><span style={{ width:6, height:6, borderRadius:"50%", background:"var(--terracotta)", display:"inline-block" }} />Indisponible</div>}
                  {pro.tarifs[0] && <div className="presta-price">À partir de {pro.tarifs[0].priceFrom.toLocaleString("fr-FR")} €</div>}
                  <div style={{ marginTop:6, fontSize:"0.62rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--gold)" }}>Voir la fiche →</div>
                </div>

                {/* Cœur favori */}
                <button
                  className={`heart-btn${isFav ? " filled" : ""}`}
                  onClick={(e) => toggleFavorite(pro, e)}
                  disabled={actionLoading}
                  title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                  style={{ position:"absolute", top:12, right:12 }}
                >
                  {isFav ? "♥" : "♡"}
                </button>

                {/* Badge retenu */}
                {rel?.status === "RETAINED" && (
                  <div style={{ position:"absolute", top:12, right:42, fontSize:"0.52rem", letterSpacing:"0.14em", textTransform:"uppercase", background:"var(--gold)", color:"var(--paper)", padding:"2px 8px", fontWeight:600 }}>
                    Retenu
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

export default function PrestataireSearch(props: Props) {
  return (
    <Suspense fallback={<div className="container"><p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", paddingTop:60 }}>Chargement…</p></div>}>
      <SearchContent {...props} />
    </Suspense>
  );
}
