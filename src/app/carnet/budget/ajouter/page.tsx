import Link from "next/link";

export default function BifurcationPage() {
  return (
    <div className="container narrow" style={{ paddingTop:60 }}>
      <div className="breadcrumb">
        <Link href="/carnet">Mon carnet</Link>
        <span className="sep">·</span>
        <Link href="/carnet/budget">Mon budget</Link>
        <span className="sep">·</span>
        <span>Ajouter une prestation</span>
      </div>

      <div className="eyebrow">Mon carnet · Ajouter une prestation</div>
      <h1 className="page-title" style={{ marginBottom:8 }}>Quelle <em>situation</em> ?</h1>
      <p className="page-sub" style={{ marginBottom:32 }}>
        Choisissez la situation qui correspond à votre prestataire.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

        <Link href="/carnet/budget/ajouter/plateforme" style={{ textDecoration:"none" }}>
          <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"28px 26px", cursor:"pointer", transition:"border-color 0.2s", display:"flex", flexDirection:"column", gap:8, height:"100%" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bone)")}
          >
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"2rem", color:"var(--gold)", marginBottom:6 }}>§</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:500, lineHeight:1.3 }}>
              Prestataire <em style={{ fontStyle:"italic", color:"var(--gold)" }}>du Carnet</em>,<br/>réglé en direct
            </div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.92rem", lineHeight:1.5, flexGrow:1 }}>
              Vous avez choisi un prestataire référencé sur Le Carnet, mais vous le payez par chèque, virement ou espèces.
            </p>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", color:"var(--gold)", marginTop:12, fontStyle:"italic" }}>Saisir →</div>
          </div>
        </Link>

        <Link href="/carnet/budget/ajouter/externe" style={{ textDecoration:"none" }}>
          <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"28px 26px", cursor:"pointer", transition:"border-color 0.2s", display:"flex", flexDirection:"column", gap:8, height:"100%" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bone)")}
          >
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"2rem", color:"var(--gold)", marginBottom:6 }}>✦</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:500, lineHeight:1.3 }}>
              Prestataire <em style={{ fontStyle:"italic", color:"var(--gold)" }}>hors plateforme</em>
            </div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.92rem", lineHeight:1.5, flexGrow:1 }}>
              Vous avez trouvé un prestataire par bouche-à-oreille, sur Instagram, dans la famille. Saisissez-le pour le suivre dans votre budget.
            </p>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", color:"var(--gold)", marginTop:12, fontStyle:"italic" }}>Saisir →</div>
          </div>
        </Link>

      </div>
    </div>
  );
}
