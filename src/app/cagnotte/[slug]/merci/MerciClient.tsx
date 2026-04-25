"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function MerciClient({ paramsPromise }: { paramsPromise: Promise<{ slug: string }> }) {
  const { slug } = use(paramsPromise);
  const params   = useSearchParams();
  const status   = params.get("redirect_status");
  const ok       = status === "succeeded" || !!params.get("payment_intent");

  return (
    <div style={{ textAlign:"center", padding:"80px 20px" }}>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"5rem", color:"var(--gold)", lineHeight:1, marginBottom:20 }}>✦</div>
      <div className="eyebrow" style={{ marginBottom:16 }}>
        {ok ? "Participation confirmée" : "Traitement en cours"}
      </div>
      <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.4rem", fontWeight:300, marginBottom:14 }}>
        {ok ? "Merci pour votre cadeau." : "Votre paiement est en cours de vérification."}
      </h1>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", maxWidth:440, margin:"0 auto 36px", lineHeight:1.6 }}>
        {ok
          ? "Votre don a bien été enregistré. Les mariés ont été notifiés et vous remercient du fond du cœur."
          : "Veuillez patienter quelques instants — la confirmation arrive."}
      </p>
      <Link href={`/cagnotte/${slug}`} className="btn ghost">← Retour à la page de la cagnotte</Link>
    </div>
  );
}
