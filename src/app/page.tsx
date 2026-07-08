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
            <span className="hero-title-line2">à <em>votre</em> rythme.</span>
          </h1>
          <p className="hero-sub">
            {isPro
              ? "Recevez des demandes qualifiées, présentez votre travail dans un cadre élégant, gardez la main sur votre activité."
              : "Un espace doux pour suivre votre budget, retrouver vos prestataires du 66, avancer pas à pas — pour que l'organisation reste un plaisir, pas une charge."}
          </p>

          {!isLogged && (
            <>
              <span className="hero-badge-gratuit">100% gratuit</span>

              <ul className="hero-features">
                <li>
                  <span className="hero-feature-icon">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9 10h4.5a1.5 1.5 0 010 3H9"/></svg>
                  </span>
                  <span className="hero-feature-text">Budget</span>
                </li>
                <li>
                  <span className="hero-feature-icon">
                    <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M4 20c0-3.3 2.2-5.5 5-5.5s5 2.2 5 5.5M15 20c0-2.4 1.4-4.2 3.5-4.6"/></svg>
                  </span>
                  <span className="hero-feature-text">Invités</span>
                </li>
                <li>
                  <span className="hero-feature-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-9.6C5 7 7.2 5 9.6 5c1 0 2 .5 2.4 1.3C12.4 5.5 13.4 5 14.4 5 16.8 5 19 7 19 10.4 19 15.6 12 20 12 20z"/></svg>
                  </span>
                  <span className="hero-feature-text">Cagnotte</span>
                </li>
                <li>
                  <span className="hero-feature-icon">
                    <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="1"/><path d="M4 9h16M9 13h6M9 16h4"/></svg>
                  </span>
                  <span className="hero-feature-text">Site de mariage</span>
                </li>
                <li className="full-width">
                  <span className="hero-feature-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 21s-6.5-6-6.5-11A6.5 6.5 0 0112 3a6.5 6.5 0 016.5 6.5C18.5 15 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.2"/></svg>
                  </span>
                  <span className="hero-feature-text">Prestataires triés dans le 66</span>
                </li>
              </ul>
            </>
          )}

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
