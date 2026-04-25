import { Suspense } from "react";
import MerciClient from "./MerciClient";

export default function MerciPage({ params }: { params: Promise<{ slug: string }> }) {
  // On passe params au client en tant que Promise — Next.js 16 gère ça
  return (
    <div style={{ background:"var(--paper)", minHeight:"100vh" }}>
      <Suspense fallback={
        <div style={{ padding:80, textAlign:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)" }}>
          Chargement…
        </div>
      }>
        <MerciClient paramsPromise={params} />
      </Suspense>
    </div>
  );
}
