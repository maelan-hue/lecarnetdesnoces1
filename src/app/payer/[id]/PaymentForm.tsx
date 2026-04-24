"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { formatAmount } from "@/lib/stripe";

type Props = {
  paymentLinkId:  string;
  amountTotal:    number;
  coupleName:     string;
  publishableKey: string;
};

function CheckoutForm({ amountTotal, coupleName, paymentLinkId }: Omit<Props, "publishableKey">) {
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
      confirmParams: {
        return_url: `${window.location.origin}/payer/${paymentLinkId}/success`,
      },
    });

    setLoading(false);
    if (error) setError(error.message ?? "Une erreur est survenue.");
  };

  return (
    <div style={{ background:"var(--ink)", color:"var(--paper)", padding:28, borderTop:"3px solid var(--gold)" }}>
      <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem", fontWeight:500, marginBottom:6 }}>
        Régler <em style={{ color:"var(--gold)", fontStyle:"italic" }}>{formatAmount(amountTotal)}</em>
      </h3>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.9rem", opacity:0.72, marginBottom:22 }}>
        Paiement sécurisé par Stripe · 3D Secure
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <PaymentElement options={{ layout: "tabs" }} />
        </div>

        {error && (
          <p style={{ color:"#ff6b6b", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", marginBottom:16, fontSize:"0.9rem" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!stripe || loading}
          style={{
            width:"100%", padding:"16px", background:"var(--gold)", color:"var(--paper)",
            border:"none", fontSize:"0.74rem", letterSpacing:"0.22em", textTransform:"uppercase",
            fontWeight:500, cursor:"pointer", fontFamily:"'Jost',sans-serif", transition:"all 0.3s",
            opacity: (!stripe || loading) ? 0.6 : 1,
          }}
        >
          {loading ? "Traitement…" : `Régler ${formatAmount(amountTotal)}`}
        </button>

        <p style={{ textAlign:"center", fontSize:"0.72rem", opacity:0.65, marginTop:12, fontStyle:"italic", fontFamily:"'Cormorant Garamond',serif" }}>
          Stripe · chiffré · 3D Secure
        </p>
      </form>
    </div>
  );
}

export default function PaymentForm({ paymentLinkId, amountTotal, coupleName, publishableKey }: Props) {
  const [clientSecret, setClientSecret] = useState("");
  const [error,        setError]        = useState("");
  const [stripePromise] = useState(() => loadStripe(publishableKey));

  useEffect(() => {
    fetch(`/api/payer/${paymentLinkId}/intent`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.clientSecret) setClientSecret(d.clientSecret);
        else setError(d.error ?? "Erreur de configuration du paiement.");
      })
      .catch(() => setError("Impossible de charger le formulaire de paiement."));
  }, [paymentLinkId]);

  if (error) return (
    <div style={{ padding:"24px", background:"rgba(176,96,74,0.08)", border:"1px solid rgba(176,96,74,0.3)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--terracotta)" }}>
      {error}
    </div>
  );

  if (!clientSecret) return (
    <div style={{ padding:"24px", background:"var(--ink)", borderTop:"3px solid var(--gold)", textAlign:"center" }}>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"rgba(250,248,244,0.6)", fontSize:"0.95rem" }}>
        Chargement du formulaire de paiement…
      </p>
    </div>
  );

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night", variables: { colorPrimary: "#A8833B", fontFamily: "Jost, sans-serif" } } }}>
      <CheckoutForm amountTotal={amountTotal} coupleName={coupleName} paymentLinkId={paymentLinkId} />
    </Elements>
  );
}
