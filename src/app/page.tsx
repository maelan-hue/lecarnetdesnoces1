import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <nav className="landing-nav">
          <div className="landing-logo">Le Carnet <em>des noces</em></div>
          <div className="landing-nav-links">
            <a href="#comment-ca-marche">Comment ça marche</a>
            <Link href="/connexion">Espace couple</Link>
            <Link href="/connexion-pro">Espace prestataire</Link>
            <Link href="/onboarding" className="gold">Commencer</Link>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-eyebrow">Mariages du Sud &amp; de l&apos;élégance</div>
          <h1 className="hero-title">
            Votre mariage,<br />
            <span className="hero-title-line2"><em>orchestré</em> avec délicatesse.</span>
          </h1>
          <p className="hero-sub">
            Un carnet d&apos;adresses de confiance, une to-do personnalisée, des paiements sécurisés.
            Tout ce qu&apos;il faut pour composer votre jour, sans le poids de l&apos;organisation.
          </p>
          <div className="hero-ctas">
            <Link href="/onboarding" className="btn large gold">Commencer mon carnet</Link>
            <span className="hero-meta">· gratuit · 2 minutes</span>
          </div>
        </div>

        <div className="hero-image">
          <div className="hero-illustration">
            <div className="script">&amp;</div>
            <div className="caption">Bientôt mariés</div>
          </div>
        </div>
      </section>

      {/* ── 3 ÉTAPES ── */}
      <section className="landing-section" id="comment-ca-marche" style={{ textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>Trois étapes</div>
        <h2 className="landing-h2">Un carnet <em>comme autrefois</em>,<br />simple comme aujourd&apos;hui.</h2>
        <p className="section-hint" style={{ maxWidth: 600, margin: "16px auto 50px", fontSize: "1.1rem" }}>
          Votre projet se tisse en quelques minutes, puis se remplit au rythme de vos choix.
        </p>
        <div className="steps-3">
          <div>
            <div className="step-3-num">I</div>
            <div className="step-3-title">Composer votre projet</div>
            <p className="step-3-text">Six questions, deux minutes. Nous dessinons votre carnet sur-mesure — étape par étape, prestataire par prestataire.</p>
          </div>
          <div>
            <div className="step-3-num">II</div>
            <div className="step-3-title">Choisir vos artisans</div>
            <p className="step-3-text">Des prestataires sélectionnés, disponibles à votre date. Vous les contactez, comparez tranquillement, choisissez.</p>
          </div>
          <div>
            <div className="step-3-num">III</div>
            <div className="step-3-title">Sceller l&apos;accord</div>
            <p className="step-3-text">L&apos;acompte se règle sur la plateforme par carte bancaire, sécurisé par Stripe. Reçu, suivi de budget, médiation en cas de litige — nous veillons.</p>
          </div>
        </div>
      </section>

      {/* ── SECTION PRO ── */}
      <section className="landing-section dark">
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div className="eyebrow" style={{ marginBottom: 20 }}>Pour les artisans du mariage</div>
          <h2 className="landing-h2">Un <em>outil</em> taillé pour vous.</h2>
          <p className="section-hint" style={{ maxWidth: 620, margin: "16px auto 40px", fontSize: "1.1rem", color: "rgba(250,248,244,0.7)" }}>
            Recevez des demandes qualifiées, encaissez vos acomptes en un clic, gardez la main sur votre activité.
            Aucun abonnement — 3 % de commission à la charge du couple, quand vous encaissez.
          </p>
          <div className="workflow-steps">
            {[
              { n: "I",   t: "Contrat signé",         d: "Vous signez votre contrat avec le couple, comme d'habitude." },
              { n: "II",  t: "Demande de paiement",    d: "Depuis votre dashboard, vous créez une demande (acompte ou solde)." },
              { n: "III", t: "Lien généré",             d: "Le Carnet crée un lien Stripe sécurisé en 2 secondes." },
              { n: "IV",  t: "Envoi au couple",         d: "Email, SMS ou WhatsApp — votre couple reçoit le lien." },
              { n: "V",   t: "Le couple règle",         d: "Paiement CB sécurisé par Stripe · 3D Secure." },
              { n: "VI",  t: "Vous êtes crédité",       d: "Sous 2 à 7 jours ouvrés sur votre IBAN." },
            ].map((s) => (
              <div key={s.n} className="wf-step">
                <div className="wf-step-num">{s.n}</div>
                <div className="wf-step-title">{s.t}</div>
                <div className="wf-step-desc">{s.d}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap", alignItems:"center" }}>
            <Link href="/inscription-pro" className="btn gold large">Rejoindre Le Carnet</Link>
            <Link href="/connexion-pro" style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"rgba(250,248,244,0.6)", fontSize:"0.95rem" }}>
              Déjà inscrit ? Se connecter →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="landing-cta">
        <div className="eyebrow" style={{ marginBottom: 24 }}>Il est temps</div>
        <h2>Prêts à écrire la <em>première page</em> de votre carnet ?</h2>
        <p>Gratuit. Sans engagement. Votre carnet, dans votre poche.</p>
        <Link href="/onboarding" className="btn large gold">Commencer mon carnet</Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="ornament">· · · · ·</div>
        Le Carnet des noces — Perpignan &amp; Roussillon — © {new Date().getFullYear()}
      </footer>
    </>
  );
}
