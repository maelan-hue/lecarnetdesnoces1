"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { computeAmounts, formatAmount } from "@/lib/stripe-utils";

const TYPES = [
  { value: "ACOMPTE",  label: "Acompte" },
  { value: "SOLDE",    label: "Solde" },
  { value: "UNIQUE",   label: "Paiement unique" },
  { value: "ECHEANCE", label: "Échéance" },
];

export default function NouveauPaiementPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    coupleEmail: "", coupleName: "",
    label: "", type: "ACOMPTE", quoteTotal: "", depositPct: 30,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState<{ id: string; paymentUrl: string } | null>(null);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // Simulation montants
  const quoteEuros   = parseFloat(form.quoteTotal) || 0;
  const quoteCents   = Math.round(quoteEuros * 100);
  const pct          = form.type === "SOLDE" || form.type === "UNIQUE" ? 100 : form.depositPct;
  const amountCents  = Math.round(quoteCents * pct / 100);
  const { commission, amountTotal, amountNet, stripeFee } = computeAmounts(amountCents);

  const handleSubmit = async () => {
    setError("");
    if (!form.coupleEmail || !form.coupleName || !form.label || !form.quoteTotal) {
      setError("Tous les champs sont obligatoires."); return;
    }
    setLoading(true);
    const res  = await fetch("/api/pro/paiements", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Erreur."); return; }
    setSuccess(json);
  };

  const copyLink = () => {
    if (success) navigator.clipboard.writeText(success.paymentUrl);
  };

  if (success) {
    return (
      <>
        <div className="success-banner">
          <div className="success-icon">✓</div>
          <div>
            <h4 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.2rem", fontWeight: 500, marginBottom: 3 }}>Lien de paiement créé</h4>
            <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", fontSize: "0.95rem" }}>
              {form.coupleName} a reçu un email avec le lien.
            </p>
          </div>
        </div>

        <label className="field-label">Le lien de paiement</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: "18px 20px", background: "var(--paper)", border: "1px solid var(--bone)", marginBottom: 22 }}>
          <div style={{ fontFamily: "'Jost',sans-serif", fontSize: "0.9rem", wordBreak: "break-all" }}>
            {success.paymentUrl}
          </div>
          <button className="btn ghost small" onClick={copyLink}>Copier</button>
        </div>

        <div className="recap-box">
          <div className="recap-row"><span className="recap-lbl">Destinataires</span><span className="recap-val">{form.coupleName}</span></div>
          <div className="recap-row"><span className="recap-lbl">Prestation</span><span className="recap-val">{form.label}</span></div>
          <div className="recap-row"><span className="recap-lbl">Montant payé par le couple</span><span className="recap-val">{formatAmount(amountTotal)}</span></div>
          <div className="recap-row"><span className="recap-lbl">Vous recevrez</span><span className="recap-val" style={{ color: "var(--gold)", fontWeight: 500 }}>{formatAmount(amountNet)}</span></div>
        </div>

        <div className="tip">
          🌿 <strong>La suite —</strong> Vous serez notifié dès que {form.coupleName} aura réglé. Le lien expire dans 15 jours · régénérable en un clic.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/dashboard/paiements" className="btn gold">Retour aux paiements</Link>
          <button className="btn ghost" onClick={() => setSuccess(null)}>Créer un autre lien</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Nouveau paiement</div>
        <h1 className="page-title">Créer un <em>lien de paiement</em></h1>
        <p className="page-sub">Une fois créé, envoyez-le à votre couple par email, SMS ou WhatsApp.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 36, alignItems: "start" }}>
        <div>
          {/* Couple */}
          <div className="form-section">
            <h3>Qui règle ce paiement ?</h3>
            <label className="field-label">Prénom(s) du couple</label>
            <input className="input" placeholder="Sophie & Marc" value={form.coupleName} onChange={(e) => set("coupleName", e.target.value)} />
            <label className="field-label">Email du couple</label>
            <input className="input" type="email" placeholder="sophie@email.com" value={form.coupleEmail} onChange={(e) => set("coupleEmail", e.target.value)} />
          </div>

          {/* Prestation */}
          <div className="form-section">
            <h3>Quelle prestation ?</h3>
            <label className="field-label">Type de paiement</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {TYPES.map(({ value, label }) => (
                <button key={value} className={`chip${form.type === value ? " active" : ""}`} onClick={() => set("type", value)}>{label}</button>
              ))}
            </div>
            <label className="field-label">Intitulé</label>
            <input className="input" placeholder="Reportage photo · mariage 12 juin 2027" value={form.label} onChange={(e) => set("label", e.target.value)} />
            <label className="field-label">Devis total (€)</label>
            <input className="input" type="number" min={0} placeholder="2400" value={form.quoteTotal} onChange={(e) => set("quoteTotal", e.target.value)} style={{ fontSize: "1.4rem", fontFamily: "'Cormorant Garamond',serif", fontWeight: 500 }} />
            {form.type === "ACOMPTE" && (
              <>
                <label className="field-label">Part de l&apos;acompte : {form.depositPct} %</label>
                <input type="range" min={10} max={100} value={form.depositPct} onChange={(e) => set("depositPct", Number(e.target.value))} style={{ width: "100%", marginBottom: 18 }} />
              </>
            )}
          </div>

          {/* Message */}
          <div className="form-section">
            <h3>Message personnalisé (optionnel)</h3>
            <textarea className="textarea" style={{ minHeight: 100 }} placeholder={`Bonjour,\n\nSuite à notre échange, voici le lien pour verser l'acompte.\n\nÀ très bientôt,`} value={form.message} onChange={(e) => set("message", e.target.value)} />
          </div>

          {error && <p className="serif" style={{ fontStyle: "italic", color: "var(--terracotta)", marginBottom: 16 }}>{error}</p>}
        </div>

        {/* Simulateur */}
        <aside style={{ background: "var(--ink)", color: "var(--paper)", padding: 28, position: "sticky", top: 80, borderTop: "3px solid var(--gold)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.25rem", fontWeight: 500, marginBottom: 6 }}>
            Votre <em style={{ fontStyle: "italic", color: "var(--gold)" }}>simulation</em>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "0.9rem", opacity: 0.72, marginBottom: 22 }}>
            Voici ce que vous allez percevoir.
          </div>

          {[
            { label: `${form.type === "ACOMPTE" ? `Acompte ${pct}%` : form.type === "SOLDE" ? "Solde" : "Montant"} brut`, value: formatAmount(amountCents), plus: true },
            { label: "Frais Stripe (1,4 % + 0,25 €)", value: `− ${formatAmount(stripeFee)}`, plus: false },
            { label: "Frais Le Carnet (absorbés couple)", value: "0,00 €", plus: false },
          ].map(({ label, value, plus }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "0.88rem", borderBottom: "1px solid rgba(250,248,244,0.1)", gap: 14 }}>
              <div>{label}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", color: plus ? "var(--gold)" : "var(--terracotta)", opacity: 0.9 }}>{value}</div>
            </div>
          ))}

          <div style={{ marginTop: 10, paddingTop: 16, borderTop: "2px solid var(--gold)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: "0.66rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500 }}>Vous recevez</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.9rem", color: "var(--gold)", fontWeight: 500 }}>{formatAmount(amountNet)}</div>
          </div>

          <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(250,248,244,0.05)", fontSize: "0.76rem", lineHeight: 1.55, opacity: 0.8, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
            Le couple paiera {formatAmount(amountTotal)} (acompte + 3 % frais de service).
          </div>

          <button className="btn gold" style={{ width: "100%", justifyContent: "center", marginTop: 22 }} onClick={handleSubmit} disabled={loading || !quoteEuros}>
            {loading ? "Création…" : "Créer le lien"}
          </button>
          <div style={{ textAlign: "center", fontSize: "0.72rem", opacity: 0.65, marginTop: 10, fontStyle: "italic", fontFamily: "'Cormorant Garamond',serif" }}>
            Versement sous 2 à 7 jours ouvrés
          </div>
        </aside>
      </div>
    </>
  );
}
