"use client";
import Link from "next/link";

export default function BifurcationPage() {
  return (
    <div className="container narrow" style={{ paddingTop:60 }}>
      <h1 className="page-title" style={{ marginBottom:8 }}>D&apos;où <em>vient-il</em> ?</h1>
      <p className="page-sub" style={{ marginBottom:32 }}>
        Choisissez la situation qui correspond pour adapter la saisie.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

        <Link href="/carnet/budget/ajouter/selection" style={{ textDecoration:"none" }}>
          <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"28px 26px", cursor:"pointer", transition:"border-color 0.2s", display:"flex", flexDirection:"column", gap:8, height:"100%" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bone)")}
          >
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"2rem", color:"var(--gold)", marginBottom:6 }}>§</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:500, lineHeight:1.3 }}>
              Un prestataire de <em style={{ fontStyle:"italic", color:"var(--gold)" }}>ma sélection</em>
            </div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.92rem", lineHeight:1.5, flexGrow:1 }}>
              Choisissez parmi les prestataires que vous avez déjà sélectionnés sur Le Carnet.
            </p>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", color:"var(--gold)", marginTop:12, fontStyle:"italic" }}>Voir ma sélection →</div>
          </div>
        </Link>

        <Link href="/carnet/budget/ajouter/externe" style={{ textDecoration:"none" }}>
          <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"28px 26px", cursor:"pointer", transition:"border-color 0.2s", display:"flex", flexDirection:"column", gap:8, height:"100%" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bone)")}
          >
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"2rem", color:"var(--gold)", marginBottom:6 }}>✦</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:500, lineHeight:1.3 }}>
              Un prestataire <em style={{ fontStyle:"italic", color:"var(--gold)" }}>hors plateforme</em>
            </div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.92rem", lineHeight:1.5, flexGrow:1 }}>
              Vous avez trouvé un prestataire par bouche-à-oreille, sur Instagram, dans la famille.
            </p>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", color:"var(--gold)", marginTop:12, fontStyle:"italic" }}>Saisir manuellement →</div>
          </div>
        </Link>

      </div>
    </div>
  );
}
