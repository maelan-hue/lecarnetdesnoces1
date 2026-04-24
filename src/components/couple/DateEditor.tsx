"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  weddingDate:  string | null;
  weddingCity:  string | null;
  weddingVenue: string | null;
  guestCount:   number | null;
  days:         number | null;
  months:       number | null;
  guestTotal:   number;
};

export default function DateEditor({
  weddingDate, weddingCity, weddingVenue, guestCount, days, months, guestTotal,
}: Props) {
  const router   = useRouter();
  const [editing, setEditing] = useState(false);
  const [date,    setDate]    = useState(
    weddingDate ? new Date(weddingDate).toISOString().split("T")[0] : ""
  );
  const [city,    setCity]    = useState(weddingCity ?? "");
  const [venue,   setVenue]   = useState(weddingVenue ?? "");
  const [guests,  setGuests]  = useState(String(guestCount ?? ""));
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/couple/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weddingDate:  date || null,
        weddingCity:  city || null,
        weddingVenue: venue || null,
        guestCount:   guests ? Number(guests) : null,
      }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  };

  if (editing) {
    return (
      <div style={{ background:"var(--ivory)", border:"1px solid var(--gold)", padding:"24px 28px", marginBottom:32 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:500, marginBottom:20 }}>
          Mettre à jour votre projet
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div>
            <label className="field-label">Date du mariage</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ marginBottom:0 }} />
          </div>
          <div>
            <label className="field-label">Nombre d&apos;invités</label>
            <input className="input" type="number" min={0} value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="120" style={{ marginBottom:0 }} />
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label className="field-label">Lieu de réception</label>
          <input className="input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Domaine de la Tuilerie" style={{ marginBottom:0 }} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label className="field-label">Ville</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Perpignan" style={{ marginBottom:0 }} />
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn gold small" onClick={handleSave} disabled={saving}>{saving ? "Sauvegarde…" : "Enregistrer"}</button>
          <button className="btn ghost small" onClick={() => setEditing(false)}>Annuler</button>
        </div>
      </div>
    );
  }

  // Pas de date → invite à la saisir
  if (!weddingDate) {
    return (
      <div
        style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"20px 24px", background:"var(--ivory)", border:"1px dashed var(--bone)",
          borderLeft:"2px solid var(--gold)", marginBottom:32, gap:20, flexWrap:"wrap",
          cursor:"pointer",
        }}
        onClick={() => setEditing(true)}
      >
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", fontWeight:500, marginBottom:3 }}>
            Renseignez votre date de mariage
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.9rem", color:"var(--mute)" }}>
            Pour afficher le compteur et personnaliser votre planning.
          </div>
        </div>
        <button className="btn gold small">Ajouter une date →</button>
      </div>
    );
  }

  // Date renseignée → compteur + lien modifier
  const weddingLabel = new Date(weddingDate).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div>
      <div className="countdown" style={{ position:"relative" }}>
        {days !== null && days > 0 && (
          <>
            <div className="cd"><span className="cd-n">{days}</span><span className="cd-l">Jours</span></div>
            <div className="cd"><span className="cd-n">{months}</span><span className="cd-l">Mois</span></div>
          </>
        )}
        {days !== null && days <= 0 && (
          <div className="cd">
            <span className="cd-n" style={{ fontSize:"1.8rem", color:"var(--gold)" }}>✦</span>
            <span className="cd-l">Jour J passé</span>
          </div>
        )}
        <a href="/invites" style={{ textDecoration:"none" }}>
          <div className="cd" style={{ cursor:"pointer" }}>
            <span className="cd-n" style={{ color:"var(--gold)" }}>{guestTotal || guestCount || "—"}</span>
            <span className="cd-l">Invités →</span>
          </div>
        </a>
        <button
          onClick={() => setEditing(true)}
          style={{
            position:"absolute", right:0, top:"50%", transform:"translateY(-50%)",
            background:"none", border:"none", cursor:"pointer",
            fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic",
            fontSize:"0.8rem", color:"var(--mute)", textDecoration:"underline",
            textDecorationColor:"var(--bone)", textUnderlineOffset:3,
          }}
        >
          {weddingLabel} · modifier
        </button>
      </div>
    </div>
  );
}
