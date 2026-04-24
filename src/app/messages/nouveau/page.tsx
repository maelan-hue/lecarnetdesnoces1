"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Pro = { id: string; name: string; category: string };

function NouveauMessageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const proIds       = searchParams.get("pros")?.split(",").filter(Boolean) ?? [];

  const [pros,    setPros]    = useState<Pro[]>([]);
  const [subject, setSubject] = useState("Demande de devis — mariage");
  const [body,    setBody]    = useState("");
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!proIds.length) return;
    // Charger les noms des pros sélectionnés
    fetch(`/api/prestataires?ids=${proIds.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPros(data.filter((p: Pro) => proIds.includes(p.id)));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!body.trim()) { setError("Rédigez votre message avant d'envoyer."); return; }
    setError(""); setSending(true);
    const res  = await fetch("/api/messages/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proIds, subject, body }),
    });
    setSending(false);
    if (res.ok) router.push("/messages");
    else { const j = await res.json(); setError(j.error ?? "Erreur lors de l'envoi."); }
  };

  return (
    <div className="container">
      <div className="breadcrumb">
        <Link href="/prestataires">Prestataires</Link>
        <span className="sep">·</span>
        <span>Nouveau message</span>
      </div>

      <div className="page-head">
        <div className="eyebrow">Contacter</div>
        <h1 className="page-title">Votre <em>message</em></h1>
        <p className="page-sub">Un même message, envoyé individuellement à chaque prestataire sélectionné.</p>
      </div>

      <div className="msg-panel">
        {/* Destinataires */}
        <label className="field-label">Destinataires</label>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:22 }}>
          {pros.length === 0 && proIds.length > 0 && (
            <span className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Chargement…</span>
          )}
          {pros.map((p) => (
            <span key={p.id} style={{ display:"flex", alignItems:"center", gap:8, background:"var(--ivory)", padding:"6px 14px 6px 6px", border:"1px solid var(--bone)", fontSize:"0.85rem" }}>
              <span style={{ width:24, height:24, borderRadius:"50%", background:"var(--linen)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontSize:"0.75rem", fontStyle:"italic", color:"var(--taupe)" }}>
                {p.name.split(/\s+/).map((w) => w[0]).slice(0,2).join("").toUpperCase()}
              </span>
              {p.name}
            </span>
          ))}
          {proIds.length === 0 && <span className="serif" style={{ fontStyle:"italic", color:"var(--terracotta)" }}>Aucun prestataire sélectionné.</span>}
        </div>

        <div className="tip">
          🌿 <strong>Bon à savoir —</strong> Soyez concrets (date, horaires, lieu, ambiance). Plus le brief est clair, plus les devis seront comparables.
        </div>

        <label className="field-label">Objet</label>
        <input className="input" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />

        <label className="field-label">Votre message</label>
        <textarea
          className="textarea"
          style={{ minHeight:220 }}
          placeholder={`Bonjour,\n\nNous préparons notre mariage et serions intéressés par vos services…\n\nMerci,\nSophie & Marc`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {error && <p className="serif" style={{ fontStyle:"italic", color:"var(--terracotta)", marginBottom:14 }}>{error}</p>}

        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button className="btn gold" onClick={handleSend} disabled={sending || proIds.length === 0}>
            {sending ? "Envoi…" : `Envoyer à ${proIds.length} prestataire${proIds.length > 1 ? "s" : ""}`}
          </button>
          <Link href="/prestataires" className="btn ghost">Retour</Link>
        </div>
      </div>
    </div>
  );
}

export default function NouveauMessagePage() {
  return (
    <Suspense fallback={<div className="container"><p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", paddingTop:80 }}>Chargement…</p></div>}>
      <NouveauMessageContent />
    </Suspense>
  );
}
