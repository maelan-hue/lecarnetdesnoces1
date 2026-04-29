"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PRO_CATEGORIES } from "@/lib/utils";

const PAYMENT_METHODS = [
  { value:"check",    label:"Chèque" },
  { value:"transfer", label:"Virement" },
  { value:"cash",     label:"Espèces" },
  { value:"other",    label:"Autre" },
];

const STATUSES = [
  { value:"DISCUSSING",   label:"En discussion" },
  { value:"QUOTED",       label:"Devis reçu" },
  { value:"DEPOSIT_PAID", label:"Acompte versé" },
  { value:"FULLY_PAID",   label:"Soldé" },
];

type Props = {
  mode: "cas-b" | "cas-c";
  // Cas B uniquement : prestataire pré-rempli
  preFilledProId?:   string;
  preFilledName?:    string;
  preFilledCategory?:string;
  // Edition
  initialData?: Record<string, string | number | boolean>;
  entryId?: string;
};

export default function ManualEntryForm({ mode, preFilledProId, preFilledName, preFilledCategory, initialData, entryId }: Props) {
  const router = useRouter();

  const [vendorName,     setVendorName]     = useState(String(initialData?.vendorName     ?? preFilledName     ?? ""));
  const [vendorCategory, setVendorCategory] = useState(String(initialData?.vendorCategory ?? preFilledCategory ?? "PHOTOGRAPHE"));
  const [vendorCity,     setVendorCity]     = useState(String(initialData?.vendorCity     ?? ""));
  const [vendorEmail,    setVendorEmail]    = useState(String(initialData?.vendorEmail    ?? ""));
  const [vendorPhone,    setVendorPhone]    = useState(String(initialData?.vendorPhone    ?? ""));
  const [vendorWebsite,  setVendorWebsite]  = useState(String(initialData?.vendorWebsite  ?? ""));
  const [totalEuros,     setTotalEuros]     = useState(initialData?.totalAmount ? String(Number(initialData.totalAmount)/100) : "");
  const [depositEuros,   setDepositEuros]   = useState(initialData?.depositAmount ? String(Number(initialData.depositAmount)/100) : "");
  const [depositDate,    setDepositDate]    = useState(String(initialData?.depositPaidAt  ?? ""));
  const [balanceDate,    setBalanceDate]    = useState(String(initialData?.balanceDueDate ?? ""));
  const [prestDate,      setPrestDate]      = useState(String(initialData?.prestationDate ?? ""));
  const [paymentMethod,  setPaymentMethod]  = useState(String(initialData?.paymentMethod  ?? ""));
  const [status,         setStatus]         = useState(String(initialData?.status         ?? ""));
  const [notes,          setNotes]          = useState(String(initialData?.notes          ?? ""));
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState("");

  const totalCents   = Math.round(parseFloat(totalEuros || "0") * 100) || 0;
  const depositCents = Math.round(parseFloat(depositEuros || "0") * 100) || 0;
  const balanceCents = Math.max(0, totalCents - depositCents);

  // Statut auto-déduit
  const autoStatus = !totalCents ? "QUOTED"
    : depositCents === 0           ? "QUOTED"
    : depositCents >= totalCents   ? "FULLY_PAID"
    :                                "DEPOSIT_PAID";

  const handleSave = async () => {
    setError("");
    if (mode === "cas-c" && !vendorName.trim()) { setError("Le nom est obligatoire."); return; }
    if (!totalEuros || totalCents <= 0) { setError("Le devis total est obligatoire."); return; }

    setSaving(true);
    const body = {
      vendorName,
      vendorCategory,
      vendorCity:    vendorCity || null,
      vendorEmail:   vendorEmail || null,
      vendorPhone:   vendorPhone || null,
      vendorWebsite: vendorWebsite || null,
      proId:         mode === "cas-b" ? preFilledProId : null,
      isExternal:    mode === "cas-c",
      totalAmount:   totalCents,
      depositAmount: depositCents,
      depositPaidAt: depositDate || null,
      balanceDueDate:balanceDate || null,
      prestationDate:prestDate || null,
      paymentMethod: paymentMethod || null,
      status:        status || autoStatus,
      notes:         notes || null,
    };

    const url    = entryId ? `/api/couple/budget/${entryId}` : "/api/couple/budget";
    const method = entryId ? "PATCH" : "POST";
    const res    = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    const json   = await res.json();
    setSaving(false);

    if (res.ok) router.push("/carnet/budget");
    else setError(json.error ?? "Erreur lors de la sauvegarde.");
  };

  const catOptions = Object.entries(PRO_CATEGORIES);

  return (
    <div className="container narrow" style={{ paddingTop:60 }}>
      <div className="breadcrumb">
        <Link href="/carnet">Mon carnet</Link>
        <span className="sep">·</span>
        <Link href="/carnet/budget">Mon budget</Link>
        <span className="sep">·</span>
        <Link href="/carnet/budget/ajouter">Ajouter</Link>
        <span className="sep">·</span>
        <span>{mode === "cas-b" ? "Prestataire du Carnet" : "Prestataire externe"}</span>
      </div>

      <div className="eyebrow" style={{ marginBottom:4 }}>Mon carnet · Saisie manuelle</div>
      <h1 className="page-title" style={{ marginBottom:8 }}>
        {mode === "cas-b"
          ? <>Vos <em>échanges</em> avec {preFilledName}</>
          : <>Ajouter <em>un prestataire</em></>}
      </h1>
      <p className="page-sub" style={{ marginBottom:24 }}>
        {mode === "cas-b"
          ? "Vous payez ce prestataire en direct. Ces informations restent privées et alimentent votre budget."
          : "Saisissez les informations du prestataire. Seuls le nom, la catégorie et le devis total sont obligatoires."}
      </p>

      <div className="tip" style={{ marginBottom:24 }}>
        🌿 <strong>Bon à savoir —</strong> Seul le devis total compte dans votre budget global. Les acomptes et soldes vous servent à suivre où vous en êtes des paiements.
      </div>

      {/* Section identité */}
      {(mode === "cas-c" || mode === "cas-b") && (
        <div className="form-section" style={{ borderColor:"var(--gold)", borderLeft:"2px solid var(--gold)" }}>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.25rem", fontWeight:500, marginBottom:18 }}>
            Le <em style={{ fontStyle:"italic", color:"var(--gold)" }}>prestataire</em>
          </h3>
          <label className="field-label">Nom du prestataire {mode === "cas-c" ? "(obligatoire)" : ""}</label>
          <input className="input" placeholder="Ex : Atelier Luce" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:14 }}>
            <div>
              <label className="field-label">Catégorie (obligatoire)</label>
              <select className="input" value={vendorCategory} onChange={(e) => setVendorCategory(e.target.value)}>
                {catOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Ville</label>
              <input className="input" placeholder="Ex : Perpignan" value={vendorCity} onChange={(e) => setVendorCity(e.target.value)} />
            </div>
          </div>
          {mode === "cas-c" && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:14 }}>
                <div>
                  <label className="field-label">Email</label>
                  <input className="input" type="email" placeholder="contact@…" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Téléphone</label>
                  <input className="input" placeholder="+33 6…" value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} />
                </div>
              </div>
              <label className="field-label">Site web ou Instagram (optionnel)</label>
              <input className="input" placeholder="atelierluce.fr ou @atelierluce" value={vendorWebsite} onChange={(e) => setVendorWebsite(e.target.value)} />
            </>
          )}
        </div>
      )}

      {/* Devis */}
      <div className="form-section" style={{ borderColor:"var(--gold)", borderLeft:"2px solid var(--gold)" }}>
        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.25rem", fontWeight:500, marginBottom:18 }}>
          Le <em style={{ fontStyle:"italic", color:"var(--gold)" }}>devis</em>
        </h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <label className="field-label">Devis total TTC (obligatoire)</label>
            <input className="input" type="number" min={0} step={1} placeholder="Ex : 1740" value={totalEuros} onChange={(e) => setTotalEuros(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Date de prestation</label>
            <input className="input" type="date" value={prestDate} onChange={(e) => setPrestDate(e.target.value)} />
          </div>
        </div>
        <label className="field-label">Statut de la réservation</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
          {STATUSES.map(({ value, label }) => {
            const isAuto = !status && autoStatus === value;
            const isActive = status === value || isAuto;
            return (
              <button key={value} onClick={() => setStatus(status === value ? "" : value)}
                style={{ background:isActive?"var(--gold)":"transparent", color:isActive?"var(--paper)":"var(--ink)", border:`1px solid ${isActive?"var(--gold)":"var(--bone)"}`, padding:"6px 14px", cursor:"pointer", fontFamily:"'Cormorant Garamond',serif", fontSize:"0.88rem", transition:"all 0.2s" }}>
                {label}{isAuto && !status ? " (auto)" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Paiements */}
      <div className="form-section">
        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.25rem", fontWeight:500, marginBottom:18 }}>
          Vos <em style={{ fontStyle:"italic", color:"var(--gold)" }}>paiements</em>
        </h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <label className="field-label">Acompte versé (€)</label>
            <input className="input" type="number" min={0} step={1} placeholder="Ex : 522" value={depositEuros} onChange={(e) => setDepositEuros(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Date de versement</label>
            <input className="input" type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} />
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <label className="field-label">Solde restant (calculé)</label>
            <input className="input" disabled value={balanceCents > 0 ? `${(balanceCents/100).toLocaleString("fr-FR")} €` : "—"} style={{ color:"var(--gold)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" }} />
          </div>
          <div>
            <label className="field-label">Date de solde prévue</label>
            <input className="input" type="date" value={balanceDate} onChange={(e) => setBalanceDate(e.target.value)} />
          </div>
        </div>
        <label className="field-label">Mode de paiement</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
          {PAYMENT_METHODS.map(({ value, label }) => (
            <button key={value} onClick={() => setPaymentMethod(paymentMethod === value ? "" : value)}
              style={{ background:paymentMethod===value?"var(--gold)":"transparent", color:paymentMethod===value?"var(--paper)":"var(--ink)", border:`1px solid ${paymentMethod===value?"var(--gold)":"var(--bone)"}`, padding:"6px 14px", cursor:"pointer", fontFamily:"'Cormorant Garamond',serif", fontSize:"0.88rem", transition:"all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="form-section">
        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.25rem", fontWeight:500, marginBottom:18 }}>
          Notes <em style={{ fontStyle:"italic", color:"var(--gold)" }}>privées</em>
        </h3>
        <textarea className="textarea" rows={3} placeholder="Ex : RDV essai bouquet le 15 mars · livraison le 11 juin à 9h" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ minHeight:80 }} />
      </div>

      {/* Récap */}
      <div style={{ background:"var(--ivory)", padding:"16px 20px", borderLeft:"2px solid var(--gold)", marginBottom:24, fontFamily:"'Cormorant Garamond',serif" }}>
        <div style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--gold)", marginBottom:10, fontWeight:500 }}>Impact sur votre budget</div>
        <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontSize:"0.9rem", color:"var(--mute)" }}>
          <span>Catégorie</span><span>{PRO_CATEGORIES[vendorCategory] ?? vendorCategory}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontSize:"0.9rem", color:"var(--mute)" }}>
          <span>Devis total</span><span>{totalCents > 0 ? `${(totalCents/100).toLocaleString("fr-FR")} €` : "—"}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", marginTop:6, borderTop:"0.5px dashed var(--bone)", fontSize:"1.1rem", fontWeight:500 }}>
          <span>Ajouté à votre budget</span>
          <span style={{ fontStyle:"italic", color:"var(--gold)" }}>{totalCents > 0 ? `${(totalCents/100).toLocaleString("fr-FR")} €` : "—"}</span>
        </div>
      </div>

      {error && <p style={{ color:"var(--terracotta)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", marginBottom:16 }}>{error}</p>}

      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <button className="btn gold" onClick={handleSave} disabled={saving}>{saving ? "Sauvegarde…" : entryId ? "Enregistrer les modifications" : "Enregistrer"}</button>
        <Link href="/carnet/budget" className="btn ghost">Annuler</Link>
        {entryId && (
          <button className="btn ghost small" style={{ borderColor:"var(--terracotta)", color:"var(--terracotta)", marginLeft:"auto" }}
            onClick={async () => {
              if (!confirm("Supprimer cette entrée ?")) return;
              await fetch(`/api/couple/budget/${entryId}`, { method:"DELETE" });
              router.push("/carnet/budget");
            }}>
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
