import { Suspense } from "react";
import Messagerie from "@/components/Messagerie";

export default function MessagesPage() {
  return (
    <div className="container wide" style={{ paddingBottom: 0 }}>
      <div className="page-head">
        <div className="eyebrow">Vos échanges</div>
        <h1 className="page-title">Messa<em>gerie</em></h1>
      </div>
      <Suspense fallback={<p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Chargement…</p>}>
        <Messagerie role="couple" />
      </Suspense>
    </div>
  );
}
