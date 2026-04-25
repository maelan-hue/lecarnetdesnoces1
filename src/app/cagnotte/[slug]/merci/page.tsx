"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function MerciContent({ slug }: { slug: string }) {
  const params = useSearchParams();
  const ok = params.get("payment_intent") || params.get("redirect_status") === "succeeded";
  return (
    <div style={{ textAlign:"center", padding:"80px 20px" }}>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"5rem", color:"var(--gold)", lineHeight:1, marginBottom:20 }}>✦</div>
      <div className="eyebrow" style={{ marginBottom:16 }}>{ok ? "Participation confirmée" : "Traitement en cours"}</div>
      <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.4rem", fontWeight:300, marginBottom:14 }}>
        {ok ? "Merci pour votre cadeau." : "Votre paiement est en cours de vérification."}
      </h1>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", maxWidth:440, margin:"0 auto 36px" }}>
        {ok ? "Votre don a bien été enregistré. Les mariés ont été notifiés et vous remercient du fond du cœur." : "Veuillez patienter quelques instants."}
      </p>
      <Link href={`/cagnotte/${slug}`} className="btn ghost">← Retour à la page de la cagnotte</Link>
    </div>
  );
}

export default function MerciPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div style={{ background:"var(--paper)", minHeight:"100vh" }}>
      <Suspense fallback={<div style={{ padding:80, textAlign:"center" }}>Chargement…</div>}>
        <SlugConsumer params={params} />
      </Suspense>
    </div>
  );
}

function SlugConsumer({ params }: { params: Promise<{ slug: string }> }) {
  // Next.js 16 : on ne peut pas await dans un composant client, on utilise use()
  // Workaround : passer le slug comme searchParam ou param statique
  // Pour simplifier : lire le slug depuis l'URL
  return (
    <Suspense fallback={null}>
      <MerciInner params={params} />
    </Suspense>
  );
}

function MerciInner({ params: _params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  // Le slug est dans le pathname, on le récupère via window.location en dernier recours
  const slug = typeof window !== "undefined"
    ? window.location.pathname.split("/")[2]
    : "";
  return <MerciContent slug={slug} />;
}
