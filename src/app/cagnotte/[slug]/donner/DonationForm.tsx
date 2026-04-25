"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

type Dream = { id: string; title: string };

type Props = {
  slug: string;
  cagnotteTitle: string;
  dreams: Dream[];
  publishableKey: string;
};

const PRESETS = [30, 50, 100, 200];

function computeFees(amountEuros: number): number {
  const cents = Math.round(amountEuros * 100);
  return Math.ceil(cents * 0.015) + 25; // centimes
}

function CheckoutForm({ slug, amountCents, totalCents }: { slug: string; amountCents: number; totalCents: number }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setError("");
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/cagnotte/${slug}/merci` },
    });
    setLoading(false);
    if (error) setError(error.message ?? "Une erreur est survenue.");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop:20 }}>
      <PaymentElement options={{ layout:"tabs" }} />
      {error && <p style={{ color:"var(--terracotta)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", marginTop:12 }}>{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="btn gold" style={{ width:"100%", justifyContent:"center", marginTop:20, padding:"16px" }}>
        {loading ? "Traitement…" : `Régler ${(totalCents/100).toLocaleString("fr-FR",{minimumFractionDigits:2})} € · Carte bancaire`}
      </button>
      <p style={{ textAlign:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--taupe)", fontSize:"0.78rem", marginTop:10 }}>
        3D Secure · Stripe · aucune donnée stockée
      </p>
    </form>
  );
}

export default function DonationForm({ slug, cagnotteTitle, dreams, publishableKey }: Props) {
  const [amount,      setAmount]      = useState(50);
  const [customAmt,   setCustomAmt]   = useState("");
  const [dreamId,     setDreamId]     = useState<string | null>(null);
  const [message,     setMessage]     = useState("");
  const [donorName,   setDonorName]   = useState("");
  const [donorEmail,  setDonorEmail]  = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [wantsReceipt,setWantsReceipt]= useState(true);
  const [clientSecret,setClientSecret]= useState("");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [stripePromise] = useState(() => loadStripe(publishableKey));

  const effectiveAmount = customAmt ? parseFloat(customAmt) || 0 : amount;
  const fees      = computeFees(effectiveAmount);
  const totalCents = Math.round(effectiveAmount * 100) + fees;

  const handleProceed = async () => {
    setError("");
    if (effectiveAmount < 10)  { setError("Montant minimum : 10 €."); return; }
    if (effectiveAmount > 500) { setError("Montant maximum : 500 €."); return; }
    if (!donorEmail.includes("@")) { setError("Email invalide."); return; }

    setLoading(true);
    const res  = await fetch(`/api/public/cagnotte/${slug}/donate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountNet:   Math.round(effectiveAmount * 100),
        dreamId:     dreamId || null,
        donorName:   isAnonymous ? "" : donorName,
        donorEmail,
        isAnonymous,
        message:     message || null,
        wantsReceipt,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Erreur."); return; }
    setClientSecret(json.clientSecret);
  };

  return (
    <div style={{ background:"var(--paper)", padding:"44px 38px", maxWidth:580, margin:"0 auto", boxShadow:"0 4px 20px rgba(0,0,0,0.04)" }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div className="eyebrow">Pour {cagnotteTitle}</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2rem", fontWeight:400, margin:"10px 0 6px" }}>
          Votre <em style={{ fontStyle:"italic", color:"var(--gold)" }}>participation</em>
        </h1>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)" }}>Paiement sécurisé · carte bancaire uniquement</p>
      </div>

      {!clientSecret ? (
        <>
          {/* Montant */}
          <div style={{ marginBottom:24 }}>
            <label className="field-label">Montant de votre don</label>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              {PRESETS.map((p) => (
                <button key={p} onClick={() => { setAmount(p); setCustomAmt(""); }}
                  style={{ flex:1, background: amount===p && !customAmt ? "var(--gold)" : "transparent", color: amount===p && !customAmt ? "var(--paper)" : "var(--ink)", border:`1px solid ${amount===p && !customAmt ? "var(--gold)":"var(--bone)"}`, padding:"14px 0", textAlign:"center", cursor:"pointer", fontFamily:"'Cormorant Garamond',serif", fontSize:"1.05rem", transition:"all 0.2s" }}>
                  {p} €
                </button>
              ))}
            </div>
            <input className="input" type="number" min={10} max={500} placeholder="Ou saisissez un autre montant (€)"
              value={customAmt} onChange={(e) => { setCustomAmt(e.target.value); setAmount(0); }} />
          </div>

          {/* Rêve */}
          {dreams.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <label className="field-label">Pour quel rêve ? (optionnel)</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[...dreams, { id: null, title: "Peu importe" }].map((d) => (
                  <button key={d.id ?? "none"} onClick={() => setDreamId(d.id as string | null)}
                    style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", background: dreamId===d.id ? "var(--gold)" : "transparent", color: dreamId===d.id ? "var(--paper)" : "var(--ink)", border:`1px solid ${dreamId===d.id ? "var(--gold)":"var(--bone)"}`, cursor:"pointer", fontFamily:"'Cormorant Garamond',serif", fontSize:"0.85rem", transition:"all 0.2s" }}>
                    {dreamId===d.id && <span>✓</span>}{d.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div style={{ marginBottom:24 }}>
            <label className="field-label">Un petit mot pour les mariés (optionnel)</label>
            <textarea className="textarea" rows={3} placeholder="Un souhait, une anecdote, un conseil…" value={message} onChange={(e) => setMessage(e.target.value)} style={{ minHeight:80 }} />
          </div>

          {/* Nom + options */}
          <div style={{ marginBottom:24 }}>
            <label className="field-label">Votre nom</label>
            <input className="input" type="text" placeholder="Comment signer votre message" value={donorName} onChange={(e) => setDonorName(e.target.value)} />
            <label className="field-label">Votre email</label>
            <input className="input" type="email" placeholder="pour l'accusé de réception" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} />
            <div onClick={() => setIsAnonymous(!isAnonymous)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", cursor:"pointer" }}>
              <div style={{ width:16, height:16, border:`1px solid ${isAnonymous?"var(--gold)":"var(--taupe)"}`, background:isAnonymous?"var(--gold)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", color:"var(--paper)", flexShrink:0 }}>{isAnonymous?"✓":""}</div>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", color:"var(--mute)", fontSize:"0.92rem" }}>Rester anonyme (mon nom n&apos;apparaîtra pas dans le livre d&apos;or)</span>
            </div>
            <div onClick={() => setWantsReceipt(!wantsReceipt)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", cursor:"pointer" }}>
              <div style={{ width:16, height:16, border:`1px solid ${wantsReceipt?"var(--gold)":"var(--taupe)"}`, background:wantsReceipt?"var(--gold)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", color:"var(--paper)", flexShrink:0 }}>{wantsReceipt?"✓":""}</div>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", color:"var(--mute)", fontSize:"0.92rem" }}>Recevoir un accusé de réception par email</span>
            </div>
          </div>

          {/* Récap */}
          <div style={{ background:"var(--ivory)", padding:"16px 20px", borderLeft:"2px solid var(--gold)", marginBottom:24, fontFamily:"'Cormorant Garamond',serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontSize:"0.9rem", color:"var(--mute)" }}>
              <span>Votre don aux mariés</span><span>{effectiveAmount.toLocaleString("fr-FR")} €</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontSize:"0.9rem", color:"var(--mute)" }}>
              <span>Frais bancaires sécurisés</span><span>{(fees/100).toLocaleString("fr-FR",{minimumFractionDigits:2})} €</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", marginTop:6, borderTop:"0.5px dashed var(--bone)", fontSize:"1.1rem", fontWeight:500 }}>
              <span>Total à régler</span>
              <span style={{ fontStyle:"italic", color:"var(--gold)" }}>{(totalCents/100).toLocaleString("fr-FR",{minimumFractionDigits:2})} €</span>
            </div>
            <p style={{ fontStyle:"italic", color:"var(--mute)", fontSize:"0.78rem", marginTop:8, lineHeight:1.5 }}>
              Les {effectiveAmount.toLocaleString("fr-FR")} € arrivent en totalité dans la cagnotte. Les frais couvrent le traitement sécurisé de votre carte.
            </p>
          </div>

          {error && <p style={{ color:"var(--terracotta)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", marginBottom:16 }}>{error}</p>}

          <button className="btn gold" style={{ width:"100%", justifyContent:"center", padding:"16px" }} onClick={handleProceed} disabled={loading || effectiveAmount < 10}>
            {loading ? "Préparation…" : "Continuer vers le paiement →"}
          </button>
        </>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance:{ theme:"stripe", variables:{ colorPrimary:"#A8833B" } } }}>
          <div style={{ marginBottom:16, padding:"14px 18px", background:"var(--ivory)", borderLeft:"2px solid var(--gold)", fontFamily:"'Cormorant Garamond',serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:500 }}>
              <span>Total à régler</span>
              <span style={{ color:"var(--gold)" }}>{(totalCents/100).toLocaleString("fr-FR",{minimumFractionDigits:2})} €</span>
            </div>
          </div>
          <CheckoutForm slug={slug} amountCents={Math.round(effectiveAmount*100)} totalCents={totalCents} />
        </Elements>
      )}
    </div>
  );
}
