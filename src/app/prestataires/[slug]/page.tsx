import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PRO_CATEGORIES, AMBIANCES } from "@/lib/utils";
import { getSpecFields } from "@/lib/specs";
import type { Metadata } from "next";
import Link from "next/link";
import AddToSelectionButton from "@/components/couple/AddToSelectionButton";
import BackButton from "@/components/BackButton";
import CoupleNav from "@/components/couple/CoupleNav";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pro = await db.pro.findUnique({ where: { slug }, select: { name:true, tagline:true, category:true, city:true } });
  if (!pro) return { title: "Prestataire introuvable" };
  return {
    title: `${pro.name} — ${PRO_CATEGORIES[pro.category]} — Le Carnet des noces`,
    description: pro.tagline ?? `${pro.name}, ${PRO_CATEGORIES[pro.category]} à ${pro.city ?? "Roussillon"}.`,
  };
}

export default async function FichePubliquePage({ params }: Props) {
  const { slug }  = await params;
  const session   = await getSession();

  const pro = await db.pro.findUnique({
    where:   { slug, status: "ACTIVE" },
    include: { tarifs: { orderBy: { position: "asc" } }, stats: true },
  });
  if (!pro) notFound();

  const isCouple  = session?.role === "couple";
  const isPro     = session?.role === "pro" && session.sub === pro.id;

  // Disponibilité + sélection pour le couple connecté
  let availStatus: "ok" | "unavailable" | "contact" = "contact";
  let selectionStatus: "none" | "selection" | "confirmed" = "none";
  let couplePrenoms = "";
  if (isCouple && session) {
    const couple = await db.couple.findUnique({ where: { id: session.sub }, select: { weddingDate: true, prenoms: true } });
    couplePrenoms = couple?.prenoms ?? "";
    if (couple?.weddingDate && pro.calendarActive) {
      const avail = await db.proAvailability.findUnique({
        where: { proId_date: { proId: pro.id, date: couple.weddingDate } },
      });
      if (avail?.status === "AVAILABLE")   availStatus = "ok";
      if (avail?.status === "UNAVAILABLE") availStatus = "unavailable";
    }
    const sel = await db.vendorSelection.findUnique({
      where: { coupleId_proId: { coupleId: session.sub, proId: pro.id } },
    });
    if (sel) selectionStatus = sel.status as "selection" | "confirmed";
  }

  // Incrémenter vues
  db.proStats.upsert({
    where:  { proId: pro.id },
    update: { profileViews: { increment: 1 } },
    create: { proId: pro.id, profileViews: 1 },
  }).catch(() => {});

  const initials = pro.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const catLabel = PRO_CATEGORIES[pro.category] ?? pro.category;
  const specFields = getSpecFields(pro.category);
  const specs = (pro.specs as Record<string, string> | null) ?? {};
  const filledSpecs = specFields.filter(({ key }) => specs[key]?.trim());
  const minTarif = pro.tarifs[0]?.priceFrom;

  // Méta hero (ville · spécialité · indicateur)
  const heroMeta = [
    pro.city,
    pro.tagline ? null : (pro.styleKeywords?.[0] ?? null),
  ].filter(Boolean);

  return (
    <div style={{ background:"var(--paper)", minHeight:"100vh" }}>
      {/* Nav */}
      {isCouple
        ? <CoupleNav prenoms={couplePrenoms} />
        : (
          <nav style={{ background:"var(--paper)", borderBottom:"1px solid var(--bone)", padding:"0 32px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
            <BackButton fallback={isPro ? "/dashboard" : "/"} />
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {isPro && <Link href="/dashboard/portfolio" className="btn ghost small">Modifier ma fiche</Link>}
              {!isPro && <Link href="/" className="landing-logo" style={{ fontSize:"0.9rem", textDecoration:"none" }}>Le Carnet <em>des noces</em></Link>}
              {!isPro && <Link href="/onboarding" className="btn gold small">Commencer mon carnet</Link>}
            </div>
          </nav>
        )
      }

      {/* Hero plein écran */}
      <div className="fiche-hero">
        {pro.profilePhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pro.profilePhoto} alt={pro.name} className="fiche-hero-img" />
        )}
        <div className="fiche-hero-overlay">
          <div style={{ position:"relative", zIndex:2, maxWidth:640 }}>
            <span className="fiche-hero-badge">{catLabel}</span>
            <h1>{pro.name.split(/\s+/).slice(0,-1).join(" ")} <em>{pro.name.split(/\s+/).slice(-1)}</em></h1>
            {heroMeta.length > 0 && (
              <div className="fiche-hero-meta">
                {heroMeta.map((m, i) => (
                  <span key={i}>{i > 0 ? "·" : ""} {m}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barre d'action */}
      <div className="fiche-bar">
        <div className="fiche-bar-left">
          {minTarif && (
            <span className="fiche-price">à partir de <em>{minTarif.toLocaleString("fr-FR")} €</em></span>
          )}
          {isCouple && (
            <>
              {availStatus === "ok"          && <span className="fiche-dispo ok">Disponible à votre date</span>}
              {availStatus === "unavailable" && <span className="fiche-dispo no">Indisponible à votre date</span>}
              {availStatus === "contact"     && <span className="fiche-dispo contact">À contacter</span>}
            </>
          )}
          {pro.ambiances.length > 0 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {pro.ambiances.map((a) => <span key={a} className="chip" style={{ cursor:"default", fontSize:"0.6rem" }}>{AMBIANCES[a] ?? a}</span>)}
            </div>
          )}
        </div>
        <div className="fiche-bar-right">
          {isCouple && <AddToSelectionButton proId={pro.id} initialStatus={selectionStatus} />}
          {isCouple && (
            <Link href={`/messages/nouveau?pros=${pro.id}`} className="btn ghost small">Demander un devis</Link>
          )}
          {pro.ctaUrl && pro.ctaLabel && (
            <a href={pro.ctaUrl} target="_blank" rel="noopener noreferrer" className="btn gold small">{pro.ctaLabel}</a>
          )}
          {!isCouple && !isPro && (
            <Link href={`/onboarding`} className="btn gold small">Créer mon carnet →</Link>
          )}
        </div>
      </div>

      {/* Corps */}
      <div className="fiche-body">
        <div>
          {/* À propos */}
          {pro.bio && (
            <div className="fiche-section">
              <div className="fiche-section-eyebrow">À propos</div>
              <h2>{pro.tagline ? <em>{pro.tagline}</em> : <>À propos de <em>{pro.name.split(/\s+/)[0]}</em></>}</h2>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{pro.bio}</p>
            </div>
          )}

          {/* Specs structurées */}
          {filledSpecs.length > 0 && (
            <div className="fiche-section">
              <div className="fiche-section-eyebrow">Caractéristiques · {catLabel}</div>
              <h2>Le <em>{catLabel.toLowerCase()}</em> en détails</h2>
              <div className="specs-grid">
                {filledSpecs.map(({ key, label }) => (
                  <div key={key} className="spec-row">
                    <span className="spec-label">{label}</span>
                    <span className="spec-value">{specs[key]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {pro.portfolioPhotos.length > 0 && (
            <div className="fiche-section">
              <div className="fiche-section-eyebrow">Portfolio</div>
              <h2><em>{pro.name.split(/\s+/)[0]}</em> en images</h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                {pro.portfolioPhotos.slice(0, 6).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={`${pro.name} — photo ${i+1}`} style={{ aspectRatio:"4/5", objectFit:"cover", width:"100%" }} />
                ))}
              </div>
            </div>
          )}

          {/* Tarifs */}
          {pro.tarifs.length > 0 && (
            <div className="fiche-section">
              <div className="fiche-section-eyebrow">Tarifs</div>
              <h2>Nos <em>formules</em></h2>
              <div style={{ background:"var(--ivory)", padding:"16px 20px", borderLeft:"2px solid var(--gold)" }}>
                {pro.tarifs.map((t) => (
                  <div key={t.id} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:16, padding:"10px 0", borderBottom:"0.5px dashed var(--bone)", alignItems:"baseline" }}>
                    <div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem" }}>{t.name}</div>
                      {t.description && <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.78rem", color:"var(--mute)", marginTop:2 }}>{t.description}</div>}
                    </div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.1rem", color:"var(--gold)", whiteSpace:"nowrap" }}>
                      à partir de {t.priceFrom.toLocaleString("fr-FR")} €
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Aside sticky */}
        <aside className="fiche-aside">
          {pro.highlightText && (
            <div className="aside-block">
              <div className="aside-h">Le <em>plus</em></div>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.92rem", color:"var(--mute)", lineHeight:1.6 }}>{pro.highlightText}</p>
            </div>
          )}

          <div className="aside-block">
            <div className="aside-h">Disponibilité</div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.9rem", color:"var(--mute)", marginBottom:10 }}>
              {pro.calendarActive ? "Calendrier mis à jour régulièrement." : "Contactez-nous pour vérifier votre date."}
            </p>
            {isCouple && <Link href={`/messages/nouveau?pros=${pro.id}`} className="btn ghost small" style={{ width:"100%", justifyContent:"center", display:"flex" }}>Envoyer un message</Link>}
          </div>


          {isCouple && (
            <div>
              <Link href={`/messages/nouveau?pros=${pro.id}`} className="btn gold" style={{ width:"100%", justifyContent:"center", display:"flex" }}>
                Demander un devis
              </Link>
              <p style={{ textAlign:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.78rem", marginTop:8 }}>
                Chaque prestataire reçoit votre message individuellement.
              </p>
            </div>
          )}
          {!isCouple && !isPro && (
            <Link href="/onboarding" className="btn gold" style={{ width:"100%", justifyContent:"center", display:"flex" }}>
              Créer mon carnet →
            </Link>
          )}
        </aside>
      </div>

      <div className="ornament" style={{ padding:"20px 0" }}>· · · · ·</div>
    </div>
  );
}
