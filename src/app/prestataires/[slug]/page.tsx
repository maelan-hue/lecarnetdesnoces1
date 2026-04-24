import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PRO_CATEGORIES, AMBIANCES } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import FicheHeartButton from "@/components/couple/FicheHeartButton";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pro = await db.pro.findUnique({ where: { slug }, select: { name:true, tagline:true, category:true, city:true } });
  if (!pro) return { title: "Prestataire introuvable" };
  return {
    title: `${pro.name} — ${PRO_CATEGORIES[pro.category]} — Le Carnet des noces`,
    description: pro.tagline ?? `${pro.name}, ${PRO_CATEGORIES[pro.category]} à ${pro.city ?? "Roussillon"}. Découvrez le portfolio et les tarifs.`,
  };
}

export default async function FichePubliquePage({ params }: Props) {
  const { slug }  = await params;
  const session = await getSession();

  const pro = await db.pro.findUnique({
    where:   { slug, status: "ACTIVE" },
    include: { tarifs: { orderBy: { position: "asc" } }, stats: true },
  });
  if (!pro) notFound();

  const isCouple = session?.role === "couple";
  const isPro    = session?.role === "pro" && session.sub === pro.id;

  // Disponibilité à la date du couple
  let availStatus: "ok" | "unavailable" | "contact" = "contact";
  let isSaved = false;
  if (isCouple && session) {
    const couple = await db.couple.findUnique({
      where: { id: session.sub },
      select: { weddingDate: true },
    });
    if (couple?.weddingDate && pro.calendarActive) {
      const avail = await db.proAvailability.findUnique({
        where: { proId_date: { proId: pro.id, date: couple.weddingDate } },
      });
      if (avail?.status === "AVAILABLE")   availStatus = "ok";
      if (avail?.status === "UNAVAILABLE") availStatus = "unavailable";
    }
    const rel = await db.vendorRelation.findUnique({
      where: { coupleId_proId: { coupleId: session.sub, proId: pro.id } },
    });
    isSaved = !!rel;
  }

  // Incrémenter les vues
  await db.proStats.upsert({
    where:  { proId: pro.id },
    update: { profileViews: { increment: 1 } },
    create: { proId: pro.id, profileViews: 1 },
  });

  const initials = pro.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      {/* Nav */}
      <nav style={{ background:"var(--paper)", borderBottom:"1px solid var(--bone)", padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        {isPro ? (
          <Link href="/dashboard/portfolio" className="landing-logo" style={{ fontSize:"0.68rem", textDecoration:"none", fontFamily:"'Jost',sans-serif", fontWeight:400, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--mute)" }}>
            ← Retour au dashboard
          </Link>
        ) : isCouple ? (
          <Link href="/prestataires" className="landing-logo" style={{ fontSize:"0.68rem", textDecoration:"none", fontFamily:"'Jost',sans-serif", fontWeight:400, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--mute)" }}>
            ← Retour aux prestataires
          </Link>
        ) : (
          <Link href="/" className="landing-logo" style={{ fontSize:"1.1rem", textDecoration:"none" }}>
            Le Carnet <em>des noces</em>
          </Link>
        )}

        {isPro ? (
          <Link href="/dashboard/portfolio" className="btn ghost small">
            Modifier ma fiche
          </Link>
        ) : isCouple ? (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <FicheHeartButton proId={pro.id} category={pro.category} initialSaved={isSaved} />
            <Link href={`/messages/nouveau?pros=${pro.id}`} className="btn gold small">
              Contacter
            </Link>
          </div>
        ) : (
          <Link href="/onboarding" className="btn gold small">Commencer mon carnet</Link>
        )}
      </nav>

      <div className="container">

        {/* En-tête */}
        <div className="presta-hero" style={{ marginBottom:36 }}>
          {pro.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pro.profilePhoto} alt={pro.name} className="presta-hero-photo" style={{ objectFit:"cover" }} />
          ) : (
            <div className="presta-hero-photo serif">{initials}</div>
          )}
          <div>
            <div className="eyebrow">{PRO_CATEGORIES[pro.category]}</div>
            <div className="presta-hero-name">{pro.name}</div>
            {pro.tagline && <div className="presta-hero-style">{pro.tagline}</div>}
            <div className="presta-hero-meta">
              {[pro.city, pro.department ? `Dép. ${pro.department}` : null, pro.radiusKm ? `Rayon ${pro.radiusKm} km` : null].filter(Boolean).join(" · ")}
            </div>

            {/* Disponibilité à la date du couple */}
            {isCouple && (
              <div style={{ marginTop:12, display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                {availStatus === "ok" && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(122,139,110,0.12)", color:"var(--sage)", padding:"4px 10px", fontSize:"0.6rem", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:500 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--sage)", display:"inline-block" }} />
                    Disponible à votre date
                  </span>
                )}
                {availStatus === "unavailable" && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(176,96,74,0.12)", color:"var(--terracotta)", padding:"4px 10px", fontSize:"0.6rem", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:500 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--terracotta)", display:"inline-block" }} />
                    Indisponible à votre date
                  </span>
                )}
                {availStatus === "contact" && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(168,131,59,0.12)", color:"var(--gold)", padding:"4px 10px", fontSize:"0.6rem", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:500 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--gold)", display:"inline-block" }} />
                    À contacter
                  </span>
                )}
              </div>
            )}

            {pro.ambiances.length > 0 && (
              <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
                {pro.ambiances.map((a) => (
                  <span key={a} className="chip active" style={{ cursor:"default" }}>{AMBIANCES[a] ?? a}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {pro.bio && (
          <div style={{ marginBottom:36 }}>
            <h2 className="section-title">À propos</h2>
            <p className="serif" style={{ fontSize:"1.05rem", lineHeight:1.7, color:"var(--ink)", whiteSpace:"pre-wrap" }}>{pro.bio}</p>
          </div>
        )}

        {/* Portfolio */}
        {pro.portfolioPhotos.length > 0 && (
          <div style={{ marginBottom:36 }}>
            <h2 className="section-title">Portfolio</h2>
            <div className="portfolio-grid" style={{ gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10 }}>
              {pro.portfolioPhotos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt={`${pro.name} — photo ${i+1}`} style={{ aspectRatio:"4/5", objectFit:"cover", width:"100%", display:"block" }} />
              ))}
            </div>
          </div>
        )}

        {/* Tarifs */}
        {pro.tarifs.length > 0 && (
          <div style={{ marginBottom:36 }}>
            <h2 className="section-title">Formules &amp; tarifs</h2>
            <div className="tarif-list">
              {pro.tarifs.map((t) => (
                <div key={t.id} className="tarif-row">
                  <div>
                    <div className="tarif-name">{t.name}</div>
                    {t.description && <div className="tarif-desc">{t.description}</div>}
                  </div>
                  <div className="tarif-price">À partir de {t.priceFrom.toLocaleString("fr-FR")} €</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ background:"var(--ivory)", border:"1px solid var(--bone)", padding:"32px 36px", textAlign:"center", borderTop:"2px solid var(--gold)" }}>
          {isCouple ? (
            <>
              <h3 className="serif" style={{ fontSize:"1.6rem", fontWeight:300, marginBottom:10 }}>
                Intéressé·e par <em style={{ color:"var(--gold)", fontStyle:"italic" }}>{pro.name}</em> ?
              </h3>
              <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", marginBottom:24 }}>
                Envoyez votre demande directement depuis votre carnet. Réponse sous 48 h.
              </p>
              <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
                <Link href={`/messages/nouveau?pros=${pro.id}`} className="btn large gold">
                  Contacter {pro.name.split(/\s+/)[0]}
                </Link>
                <Link href="/prestataires" className="btn ghost">
                  ← Retour à la liste
                </Link>
              </div>
            </>
          ) : (
            <>
              <h3 className="serif" style={{ fontSize:"1.6rem", fontWeight:300, marginBottom:10 }}>
                Intéressé·e par <em style={{ color:"var(--gold)", fontStyle:"italic" }}>{pro.name}</em> ?
              </h3>
              <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", marginBottom:24 }}>
                Créez votre carnet gratuit en 2 minutes pour envoyer votre demande.
              </p>
              <Link href="/onboarding" className="btn large gold">Commencer mon carnet</Link>
            </>
          )}
        </div>

        <div className="ornament">· · · · ·</div>
      </div>
    </>
  );
}
