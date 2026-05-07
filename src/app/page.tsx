import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import LandingUserMenu from "@/components/LandingUserMenu";

export default async function LandingPage() {
  const session = await getSession();

  let userName     = "";
  let userRole: "couple" | "pro" | null = null;
  let dashboardUrl = "/carnet";

  if (session?.role === "couple") {
    const couple = await db.couple.findUnique({ where: { id: session.sub }, select: { prenoms: true } });
    userName     = couple?.prenoms ?? "";
    userRole     = "couple";
    dashboardUrl = "/carnet";
  } else if (session?.role === "pro") {
    const pro = await db.pro.findUnique({ where: { id: session.sub }, select: { name: true } });
    userName     = pro?.name ?? "";
    userRole     = "pro";
    dashboardUrl = "/dashboard";
  }

  const isCouple = userRole === "couple";
  const isPro    = userRole === "pro";
  const isLogged = isCouple || isPro;

  return (
    <>
      {isLogged && (
        <div style={{ background:"var(--ink)", color:"var(--paper)", padding:"10px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.95rem", color:"rgba(250,248,244,0.85)" }}>
            Bienvenue <strong style={{ fontStyle:"normal", color:"var(--gold)" }}>{userName}</strong>
          </span>
          <Link href={dashboardUrl} style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.62rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--gold)", textDecoration:"none" }}>
            {isCouple ? "Reprendre votre carnet →" : "Accéder à votre dashboard →"}
          </Link>
        </div>
      )}

      <section className="hero">
        <nav className="landing-nav">
          <Link href="/" className="landing-logo" style={{ textDecoration:"none" }}>Le Carnet <em>des noces</em></Link>
          <div className="landing-nav-links">
            {!isLogged && (
              <>
                <a href="#comment-ca-marche">Comment ça marche</a>
                <Link href="/connexion">Espace couple</Link>
                <Link href="/connexion-pro">Espace prestataire</Link>
                <Link href="/onboarding" className="gold">Commencer</Link>
              </>
            )}
          </div>
          {isLogged && <LandingUserMenu name={userName} role={userRole!} dashboardUrl={dashboardUrl} />}
        </nav>

        <div className="hero-content">
          <div className="hero-eyebrow">Mariages du Sud &amp; de l&apos;élégance</div>
          <h1 className="hero-title">
            Votre mariage,<br />
            <span className="hero-title-line2"><em>orchestré</em> avec délicatesse.</span>
          </h1>
          <p className="hero-sub">
            {isPro
              ? "Recevez des demandes qualifiées, présentez votre travail dans un cadre élégant, gardez la main sur votre activité."
              : "Un carnet d’adresses de confiance, une to-do personnalisée, des prestataires triés sur le volet. Tout ce qu’il faut pour composer votre jour, sans le poids de l’organisation."}
          </p>
          <div className="hero-ctas">
            {isCouple  && <Link href="/carnet"    className="btn large gold">Reprendre mon carnet →</Link>}
            {isPro     && <Link href="/dashboard" className="btn large gold">Accéder à mon dashboard →</Link>}
            {!isLogged && <Link href="/onboarding" className="btn large gold">Commencer mon carnet</Link>}
          </div>
        </div>

        <div className="hero-image">
          <div className="hero-illustration">
            <div className="script">&amp;</div>
            <div className="caption">{isCouple && userName ? userName : "Bientôt mariés"}</div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="comment-ca-marche" style={{ textAlign:"center" }}>
        <div className="eyebrow" style={{ marginBottom:20 }}>Trois étapes</div>
        <h2 className="landing-h2">Un carnet <em>comme autrefois</em>,<br />simple comme aujourd&apos;hui.</h2>
        <p className="section-hint" style={{ maxWidth:600, margin:"16px auto 50px", fontSize:"1.1rem" }}>
          Votre projet se tisse en quelques minutes, puis se remplit au rythme de vos choix.
        </p>
        <div className="steps-3">
          <div><div className="step-3-num">I</div><div className="step-3-title">Composer votre projet</div><p className="step-3-text">Six questions, deux minutes. Nous dessinons votre carnet sur-mesure — étape par étape, prestataire par prestataire.</p></div>
          <div><div className="step-3-num">II</div><div className="step-3-title">Choisir vos artisans</div><p className="step-3-text">Des prestataires sélectionnés, disponibles à votre date. Vous les contactez, comparez tranquillement, choisissez.</p></div>
          <div><div className="step-3-num">III</div><div className="step-3-title">Sceller l&apos;accord</div><p className="step-3-text">Vous retenez le prestataire, saisissez votre devis, et suivez votre budget en temps réel. Tout est centralisé dans votre carnet.</p></div>
        </div>
      </section>

      <section className="landing-section dark">
        <div style={{ maxWidth:900, margin:"0 auto", textAlign:"center" }}>
          <div className="eyebrow" style={{ marginBottom:20 }}>Pour les artisans du mariage</div>
          <h2 className="landing-h2">Un <em>outil</em> taillé pour vous.</h2>
          <p className="section-hint" style={{ maxWidth:620, margin:"16px auto 40px", fontSize:"1.1rem", color:"rgba(250,248,244,0.7)" }}>
            Rejoignez un annuaire éditorial sélectionné, recevez des demandes qualifiées de couples du Roussillon, et présentez votre travail dans un cadre élégant. Inscription gratuite, aucun engagement.
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap", alignItems:"center" }}>
            {isPro
              ? <Link href="/dashboard" className="btn gold large">Mon dashboard →</Link>
              : <><Link href="/inscription-pro" className="btn gold large">Rejoindre Le Carnet</Link><Link href="/connexion-pro" style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"rgba(250,248,244,0.6)", fontSize:"0.95rem" }}>Déjà inscrit ? Se connecter →</Link></>
            }
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="eyebrow" style={{ marginBottom:24 }}>{isLogged ? "Votre carnet vous attend" : "Il est temps"}</div>
        <h2>{isCouple ? <>Prêts à continuer la <em>composition</em> de votre mariage ?</> : <>Prêts à écrire la <em>première page</em> de votre carnet ?</>}</h2>
        <p>{isCouple ? "Votre carnet, vos prestataires, votre cagnotte — tout est là." : "Sans engagement. Votre carnet, dans votre poche."}</p>
        {isCouple  && <Link href="/carnet"    className="btn large gold">Reprendre mon carnet →</Link>}
        {isPro     && <Link href="/dashboard" className="btn large gold">Mon dashboard →</Link>}
        {!isLogged && <Link href="/onboarding" className="btn large gold">Commencer mon carnet</Link>}
      </section>

      <footer className="landing-footer">
        <div className="ornament">· · · · ·</div>
        Le Carnet des noces — Perpignan &amp; Roussillon — © {new Date().getFullYear()}
      </footer>
    </>
  );
}
