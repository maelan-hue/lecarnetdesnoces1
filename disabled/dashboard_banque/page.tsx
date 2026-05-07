"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type StripeStatus = {
  status: "none" | "pending" | "active";
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  requiresAction?: number;
  email?: string;
};

function BanquePage() {
  const searchParams = useSearchParams();
  const setup        = searchParams.get("setup");

  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [connecting,   setConnecting]   = useState(false);
  const [msg,          setMsg]          = useState("");

  useEffect(() => {
    fetch("/api/pro/stripe/status")
      .then((r) => r.json())
      .then((d) => { setStripeStatus(d); setLoading(false); });
  }, [setup]);

  useEffect(() => {
    if (setup === "complete") setMsg("✓ Votre compte Stripe a été configuré avec succès.");
    if (setup === "refresh")  setMsg("La session a expiré. Recommencez la configuration.");
  }, [setup]);

  const handleConnect = async () => {
    setConnecting(true);
    const res  = await fetch("/api/pro/stripe/connect", { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      window.location.href = json.url;
    } else {
      setMsg(json.error ?? "Erreur lors de la connexion Stripe.");
      setConnecting(false);
    }
  };

  if (loading) return (
    <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", padding: "40px 0" }}>Chargement…</p>
  );

  const isActive  = stripeStatus?.status === "active";
  const isPending = stripeStatus?.status === "pending";

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Vos encaissements</div>
        <h1 className="page-title">Compte <em>bancaire</em></h1>
        <p className="page-sub">Où arrivent vos fonds · géré par Stripe · sécurisé.</p>
      </div>

      {msg && (
        <div style={{ padding: "14px 18px", marginBottom: 24, borderLeft: "2px solid var(--gold)", background: "rgba(168,131,59,0.08)", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
          {msg}
        </div>
      )}

      {/* Statut Stripe */}
      <div className="stripe-status" style={{ display: "flex", gap: 18, alignItems: "center", padding: "22px 26px", background: "var(--paper)", border: "1px solid var(--bone)", marginBottom: 24 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
          background: isActive ? "var(--sage)" : isPending ? "var(--gold)" : "var(--bone)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", fontStyle: "italic",
          color: "var(--paper)",
        }}>
          {isActive ? "✓" : isPending ? "…" : "◇"}
        </div>
        <div>
          <h4 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.15rem", fontWeight: 500, marginBottom: 3 }}>
            {isActive  ? "Votre compte Stripe est actif" :
             isPending ? "Configuration Stripe en cours" :
                         "Compte Stripe non configuré"}
          </h4>
          <p className="serif" style={{ fontStyle: "italic", fontSize: "0.88rem", color: "var(--mute)" }}>
            {isActive  ? `Encaissements autorisés · versements activés${stripeStatus?.email ? ` · ${stripeStatus.email}` : ""}` :
             isPending ? "Complétez votre vérification d'identité pour activer les paiements." :
                         "Connectez un compte Stripe pour encaisser vos acomptes en ligne."}
          </p>
        </div>
      </div>

      {!isActive && (
        <div style={{ background: "var(--ivory)", border: "1px solid var(--bone)", borderLeft: "2px solid var(--gold)", padding: "28px 32px", marginBottom: 28 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontWeight: 500, marginBottom: 8 }}>
            {isPending ? "Finaliser la configuration" : "Connecter un compte Stripe"}
          </h3>
          <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", marginBottom: 20, lineHeight: 1.6 }}>
            {isPending
              ? "Vous avez commencé la configuration mais elle n'est pas terminée. Cliquez pour reprendre."
              : "Stripe gère les paiements par carte bancaire et les virements vers votre IBAN. La vérification d'identité est obligatoire — cela prend 5 minutes."}
          </p>
          <div style={{ marginBottom: 20 }}>
            {["Paiement CB sécurisé · 3D Secure", "Virement sur votre IBAN sous 2 à 7 jours", "Tableau de bord Stripe dédié", "Aucun frais d'abonnement"].map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, padding: "6px 0", fontSize: "0.88rem" }}>
                <span style={{ color: "var(--gold)" }}>✦</span> {item}
              </div>
            ))}
          </div>
          <button className="btn gold" onClick={handleConnect} disabled={connecting}>
            {connecting ? "Redirection…" : isPending ? "Reprendre la configuration Stripe →" : "Configurer mon compte Stripe →"}
          </button>
        </div>
      )}

      {isActive && (
        <>
          <div style={{ background: "linear-gradient(135deg, var(--ink), var(--taupe))", color: "var(--paper)", padding: 30, marginBottom: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(168,131,59,0.3), transparent)", borderRadius: "50%" }} />
            <div style={{ fontSize: "0.62rem", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.7, marginBottom: 14, color: "var(--gold)" }}>Compte Stripe Connect</div>
            <div style={{ fontFamily: "'Jost',sans-serif", fontSize: "1.1rem", letterSpacing: "0.05em", marginBottom: 10, opacity: 0.9 }}>Compte vérifié ✓</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.1rem", opacity: 0.85 }}>{stripeStatus?.email}</div>
          </div>

          <div className="form-section">
            <h3>Paramètres de versement</h3>
            <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", fontSize: "0.9rem", marginBottom: 18 }}>
              Les versements sont automatiques sous 2 à 7 jours ouvrés après chaque paiement reçu.
              Les frais Stripe (1,4 % + 0,25 €) sont déduits automatiquement.
            </p>
            <button className="btn ghost small" onClick={handleConnect} disabled={connecting}>
              Gérer sur Stripe Dashboard →
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default function BanquePageWrapper() {
  return (
    <Suspense fallback={<p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", padding: "40px 0" }}>Chargement…</p>}>
      <BanquePage />
    </Suspense>
  );
}
