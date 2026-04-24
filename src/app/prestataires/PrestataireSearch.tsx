"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AMBIANCES } from "@/lib/utils";

type Pro = {
  id: string; slug: string; name: string; tagline: string | null;
  category: string; ambiances: string[]; city: string | null;
  department: string | null; portfolioPhotos: string[];
  tarifs: { priceFrom: number }[];
  availability: { status: string }[];
};

type Props = {
  coupleData: { weddingDate: string | null; weddingCity: string | null; guestCount: number | null; ambiances: string[] };
  categories: { value: string; label: string }[];
};

function SearchContent({ coupleData, categories }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [pros,     setPros]     = useState<Pro[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Initialiser category depuis l'URL (?category=PHOTOGRAPHE)
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [ambiance, setAmbiance] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (ambiance) params.set("ambiance", ambiance);
    if (coupleData.weddingDate) params.set("date", coupleData.weddingDate.split("T")[0]);
    const res = await fetch(`/api/prestataires?${params}`);
    if (res.ok) setPros(await res.json());
    setLoading(false);
  }, [category, ambiance, coupleData.weddingDate]);

  useEffect(() => { load(); }, [load]);

  // Checkbox seule → sélection (sans naviguer)
  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Clic carte → page profil
  const goToProfile = (slug: string) => {
    router.push(`/prestataires/${slug}`);
  };

  const handleContact = () => {
    const ids = Array.from(selected).join(",");
    router.push(`/messages/nouveau?pros=${ids}`);
  };

  const weddingLabel = coupleData.weddingDate
    ? new Date(coupleData.weddingDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "Date à définir";

  const getAvailLabel = (pro: Pro) => {
    if (!coupleData.weddingDate || pro.availability.length === 0) return "contact";
    return pro.availability[0].status === "AVAILABLE" ? "ok" : null;
  };

  const initials = (name: string) =>
    name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="container">
      <div className="page-head">
        <div className="eyebrow">Artisans du mariage</div>
        <h1 className="page-title">Nos <em>prestataires</em></h1>
        <p className="page-sub">
          Cliquez sur une fiche pour découvrir le portfolio.{" "}
          Cochez pour sélectionner et envoyer un message groupé.
        </p>
      </div>

      {/* Barre de contexte */}
      <div className="context-bar">
        <div className="ctx-facts">
          <div className="ctx-fact">
            <div className="ctx-fact-lbl">Date</div>
            <div className="ctx-fact-val">{weddingLabel}</div>
          </div>
          {coupleData.weddingCity && (
            <div className="ctx-fact">
              <div className="ctx-fact-lbl">Lieu</div>
              <div className="ctx-fact-val">{coupleData.weddingCity}</div>
            </div>
          )}
          {coupleData.guestCount && (
            <div className="ctx-fact">
              <div className="ctx-fact-lbl">Invités</div>
              <div className="ctx-fact-val">{coupleData.guestCount}</div>
            </div>
          )}
        </div>
        {selected.size > 0 && (
          <button className="btn gold small" onClick={handleContact}>
            Contacter {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Filtres catégorie */}
      <div className="filters-row">
        <span style={{ fontSize:"0.66rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--mute)", marginRight:6 }}>Catégorie</span>
        <button className={`chip${category === "" ? " active" : ""}`} onClick={() => setCategory("")}>Tous</button>
        {categories.map(({ value, label }) => (
          <button
            key={value}
            className={`chip${category === value ? " active" : ""}`}
            onClick={() => setCategory(value === category ? "" : value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filtres ambiance */}
      <div className="filters-row" style={{ marginTop:-8 }}>
        <span style={{ fontSize:"0.66rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--mute)", marginRight:6 }}>Ambiance</span>
        {Object.entries(AMBIANCES).map(([key, label]) => (
          <button
            key={key}
            className={`chip${ambiance === key ? " active" : ""}`}
            onClick={() => setAmbiance(ambiance === key ? "" : key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="tip">
        🌿 <strong>Bon à savoir —</strong> Cochez 2 à 3 prestataires pour leur envoyer un message groupé et comparer les devis.
      </div>

      {/* Liste */}
      {loading ? (
        <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", padding:"40px 0" }}>Chargement…</p>
      ) : pros.length === 0 ? (
        <div style={{ padding:"60px 0", textAlign:"center" }}>
          <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", marginBottom:16 }}>
            Aucun prestataire trouvé pour ces critères.
          </p>
          <button className="btn ghost small" onClick={() => { setCategory(""); setAmbiance(""); }}>
            Effacer les filtres
          </button>
        </div>
      ) : (
        <div className="presta-list">
          {pros.map((pro) => {
            const isSel    = selected.has(pro.id);
            const avail    = getAvailLabel(pro);
            const minTarif = pro.tarifs[0];

            return (
              <div
                key={pro.id}
                className={`presta-card${isSel ? " selected" : ""}`}
                onClick={() => goToProfile(pro.slug)}
                style={{ cursor:"pointer" }}
              >
                {/* Checkbox — stopPropagation pour ne pas naviguer */}
                <div
                  className="checkbox-round"
                  onClick={(e) => toggleSelect(e, pro.id)}
                  title="Sélectionner"
                  style={{ cursor:"pointer", flexShrink:0 }}
                >
                  {isSel ? "✓" : ""}
                </div>

                <div className="presta-photo serif">{initials(pro.name)}</div>

                <div>
                  <div className="presta-name">{pro.name}</div>
                  {pro.tagline && <div className="presta-style">{pro.tagline}</div>}
                  <div className="presta-meta">
                    {[pro.city, pro.department ? `Dép. ${pro.department}` : null].filter(Boolean).join(" · ")}
                    {pro.ambiances.length > 0 && ` · ${pro.ambiances.map((a) => AMBIANCES[a] ?? a).join(", ")}`}
                  </div>
                </div>

                <div className="presta-avail">
                  {avail === "ok"      && <div className="avail-dot avail-ok">Disponible</div>}
                  {avail === "contact" && <div className="avail-dot avail-contact">À contacter</div>}
                  {minTarif && (
                    <div className="presta-price">À partir de {minTarif.priceFrom.toLocaleString("fr-FR")} €</div>
                  )}
                  <div style={{ marginTop:8, fontSize:"0.62rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--gold)" }}>
                    Voir la fiche →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Barre flottante */}
      {selected.size > 0 && (
        <div className="floating-bar">
          <div className="fb-count">
            {selected.size} <em>prestataire{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}</em>
          </div>
          <button className="btn small gold" onClick={handleContact}>Les contacter</button>
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
