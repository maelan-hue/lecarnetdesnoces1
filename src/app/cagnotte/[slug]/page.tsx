import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await db.cagnotte.findUnique({ where: { slug }, select: { title: true } });
  return { title: c?.title ? `${c.title} — Le Carnet des noces` : "Cagnotte — Le Carnet des noces" };
}

export default async function CagnottePage({ params }: Props) {
  const { slug }  = await params;
  const session   = await getSession();

  const cagnotte = await db.cagnotte.findUnique({
    where:   { slug },
    include: {
      dreams:  { orderBy: { sortOrder: "asc" } },
      program: { orderBy: { sortOrder: "asc" } },
      donations: { where: { status: "PAID" }, orderBy: { paidAt: "desc" } },
    },
  });

  if (!cagnotte) notFound();

  // Brouillon : accessible uniquement au couple propriétaire
  const isOwner = session?.role === "couple" && cagnotte.coupleId === session.sub;
  if (cagnotte.status !== "ACTIVE" && !isOwner) notFound();

  const isDraft = cagnotte.status === "DRAFT";

  const totalCollected    = cagnotte.donations.reduce((s, d) => s + d.amountNet, 0);
  const totalParticipants = cagnotte.donations.length;

  const ROMAN = ["I","II","III","IV","V"];

  return (
    <div style={{ background:"var(--ivory)", minHeight:"100vh" }}>
      {/* Bannière brouillon */}
      {isDraft && (
        <div style={{ background:"var(--ink)", color:"var(--paper)", padding:"10px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.9rem", color:"rgba(250,248,244,0.8)" }}>
            ◎ Aperçu brouillon — cette page n&apos;est pas encore visible par vos invités.
          </span>
          <Link href="/carnet/cagnotte/config" style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.62rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--gold)", textDecoration:"none" }}>
            Modifier →
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav style={{ background:"var(--paper)", borderBottom:"1px solid var(--bone)", padding:"0 32px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Link href="/" className="landing-logo" style={{ fontSize:"1rem", textDecoration:"none" }}>Le Carnet <em>des noces</em></Link>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.78rem", color:"var(--mute)" }}>Cagnotte propulsée par Le Carnet des noces</span>
      </nav>

      <div style={{ background:"var(--paper)", maxWidth:900, margin:"0 auto", boxShadow:"0 4px 20px rgba(0,0,0,0.04)" }}>

        {/* Hero */}
        <div style={{ padding:"50px 40px 28px", textAlign:"center" }}>
          {cagnotte.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cagnotte.photoUrl} alt="Photo du couple" style={{ width:"100%", maxHeight:400, objectFit:"cover", marginBottom:28 }} />
          )}
          <div className="eyebrow" style={{ marginBottom:8 }}>Leur cagnotte</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.8rem,4vw,2.6rem)", fontWeight:400, lineHeight:1.15, marginBottom:12 }}>
            {cagnotte.title || "Notre cagnotte"}
          </h1>
          {cagnotte.subtitle && (
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", maxWidth:480, margin:"0 auto" }}>{cagnotte.subtitle}</p>
          )}
          <div className="ornament" style={{ margin:"16px 0" }}>· · ·</div>
        </div>

        {/* Histoire + stats */}
        <div style={{ padding:"0 40px 30px", display:"grid", gridTemplateColumns:"1fr 220px", gap:30, alignItems:"start" }}>
          <div>
            {cagnotte.story && (
              <>
                <div className="eyebrow" style={{ marginBottom:10 }}>Notre histoire</div>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{cagnotte.story}</p>
              </>
            )}
          </div>
          <div style={{ background:"var(--ivory)", padding:"20px", border:"1px solid var(--bone)", textAlign:"center" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"2rem", color:"var(--gold)", lineHeight:1 }}>{(totalCollected/100).toLocaleString("fr-FR")} €</div>
            <div style={{ fontSize:"0.62rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--taupe)", margin:"6px 0 14px" }}>Collectés</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", color:"var(--ink)" }}>{totalParticipants}</div>
            <div style={{ fontSize:"0.62rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--taupe)" }}>Participants</div>
          </div>
        </div>

        {/* Rêves */}
        {cagnotte.dreams.length > 0 && (
          <div style={{ padding:"36px 40px 28px", background:"var(--ivory)", textAlign:"center" }}>
            <div className="eyebrow">Nos rêves</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:500, margin:"8px 0 20px" }}>
              Nos <em style={{ fontStyle:"italic", color:"var(--gold)" }}>envies</em> pour demain
            </h2>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min(cagnotte.dreams.length,3)},1fr)`, gap:14 }}>
              {cagnotte.dreams.map((d, i) => (
                <div key={d.id} style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"22px", textAlign:"left" }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.6rem", color:"var(--gold)", lineHeight:1, marginBottom:8 }}>{ROMAN[i]}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.05rem", fontWeight:500, marginBottom:6 }}>{d.title}</div>
                  {d.description && <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.85rem", color:"var(--mute)", lineHeight:1.55 }}>{d.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ padding:"32px 40px", textAlign:"center", background:"var(--ivory)" }}>
          <Link href={`/cagnotte/${slug}/donner`} className="btn large gold">Participer à la cagnotte</Link>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.8rem", marginTop:12 }}>
            Paiement sécurisé par Stripe · carte bancaire · 3D Secure
          </p>
        </div>

        {/* Programme */}
        {cagnotte.program.length > 0 && (
          <div style={{ padding:"40px", textAlign:"center" }}>
            <div className="eyebrow">Le jour J</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:500, margin:"8px 0 22px" }}>
              Notre <em style={{ fontStyle:"italic", color:"var(--gold)" }}>déroulé</em>
            </h2>
            <div style={{ maxWidth:420, margin:"0 auto" }}>
              {cagnotte.program.map((p) => (
                <div key={p.id} style={{ display:"grid", gridTemplateColumns:"80px 1fr", gap:18, padding:"14px 0", borderBottom:"0.5px dashed var(--bone)", textAlign:"left" }}>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.68rem", letterSpacing:"0.15em", color:"var(--gold)", fontWeight:500, paddingTop:4 }}>{p.timeLabel.toUpperCase()}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.05rem", fontWeight:500 }}>{p.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Livre d'or */}
        {cagnotte.showGuestbook && cagnotte.donations.some((d) => d.message && (!d.isAnonymous || d.donorName)) && (
          <div style={{ padding:"36px 40px", background:"var(--ivory)" }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div className="eyebrow">Livre d&apos;or</div>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:500, marginTop:8 }}>
                Les <em style={{ fontStyle:"italic", color:"var(--gold)" }}>mots</em> de vos proches
              </h2>
            </div>
            <div style={{ maxWidth:540, margin:"0 auto" }}>
              {cagnotte.donations
                .filter((d) => d.message)
                .slice(0, 5)
                .map((d) => (
                  <div key={d.id} style={{ background:"var(--paper)", padding:"14px 18px", borderLeft:"2px solid var(--gold)", marginBottom:10 }}>
                    <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.95rem", lineHeight:1.55 }}>« {d.message} »</p>
                    <div style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.62rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--taupe)", marginTop:6 }}>
                      {d.isAnonymous ? "Un·e invité·e · anonyme" : (d.donorName || "Anonyme")}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div style={{ padding:"22px 40px", textAlign:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--taupe)", fontSize:"0.82rem", borderTop:"0.5px solid var(--bone)" }}>
          Cagnotte propulsée par Le Carnet des noces · paiement sécurisé Stripe
        </div>
      </div>
    </div>
  );
}
