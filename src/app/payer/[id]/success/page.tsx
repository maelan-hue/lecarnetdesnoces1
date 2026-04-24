"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams   = useSearchParams();
  const paymentIntent  = searchParams.get("payment_intent");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!paymentIntent) { setStatus("error"); return; }
    setStatus("success");
  }, [paymentIntent]);

  if (status === "loading") return (
    <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Vérification…</p>
  );

  if (status === "error") return (
    <p className="serif" style={{ fontStyle:"italic", color:"var(--terracotta)" }}>Impossible de confirmer le paiement.</p>
  );

  return (
    <>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"5rem", color:"var(--gold)", lineHeight:1, marginBottom:20, textAlign:"center" }}>
        ✦
      </div>
      <div className="eyebrow" style={{ marginBottom:20, textAlign:"center" }}>Paiement confirmé</div>
      <h1 className="page-title" style={{ textAlign:"center" }}>Merci.</h1>
      <p className="page-sub" style={{ textAlign:"center", margin:"14px auto 40px" }}>
        Votre paiement a bien été enregistré. Le prestataire a été notifié et vous recontactera sous 48 h.
        Un reçu a été envoyé à votre adresse email.
      </p>

      <div style={{ textAlign:"center" }}>
        <Link href="/carnet" className="btn large gold">Retour à mon carnet</Link>
      </div>

      <div className="ornament">· · ·</div>
    </>
  );
}

export default function SuccessPage() {
  return (
    <div className="container narrow" style={{ paddingTop:80 }}>
      <Suspense fallback={<p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Chargement…</p>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
