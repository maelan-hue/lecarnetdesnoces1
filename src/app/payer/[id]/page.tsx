import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatAmount } from "@/lib/stripe-utils";
import PaymentForm from "./PaymentForm";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function PayerPage({ params }: Props) {
  const { id }  = await params;
  const link    = await db.paymentLink.findUnique({
    where:   { id },
    include: { pro: { select: { name: true, category: true, slug: true } } },
  });

  if (!link) notFound();

  // Lien expiré
  if (new Date() > link.expiresAt && link.status === "PENDING") {
    await db.paymentLink.update({ where: { id }, data: { status: "EXPIRED" } });
  }

  const isExpired  = link.status === "EXPIRED";
  const isPaid     = link.status === "PAID";
  const isValid    = link.status === "PENDING";

  const TYPE_LABEL: Record<string, string> = { ACOMPTE:"Acompte", SOLDE:"Solde", UNIQUE:"Paiement unique", ECHEANCE:"Échéance" };

  return (
    <>
      <nav style={{ background:"var(--paper)", borderBottom:"1px solid var(--bone)", padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <Link href="/" className="landing-logo" style={{ fontSize:"1.1rem", textDecoration:"none" }}>Le Carnet <em>des noces</em></Link>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.85rem", color:"var(--mute)" }}>
          Stripe · chiffré · 3D Secure
        </span>
      </nav>

      <div className="container wide">
        <div className="page-head">
          <div className="eyebrow">Paiement sécurisé · {link.pro.name}</div>
          <h1 className="page-title">{TYPE_LABEL[link.type]} <em>{link.pro.name}</em></h1>
          <p className="page-sub">{link.label}</p>
        </div>

        {/* Déjà payé */}
        {isPaid && (
          <div className="success-banner">
            <div className="success-icon">✓</div>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:500, marginBottom:4 }}>Paiement déjà effectué</div>
              <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", fontSize:"0.95rem" }}>
                Ce paiement a été réglé le {link.paidAt ? new Date(link.paidAt).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" }) : "—"}.
              </p>
            </div>
          </div>
        )}

        {/* Expiré */}
        {isExpired && (
          <div style={{ background:"rgba(176,96,74,0.08)", border:"1px solid rgba(176,96,74,0.3)", borderLeft:"2px solid var(--terracotta)", padding:"24px 28px", marginBottom:28 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.15rem", fontWeight:500, marginBottom:6, color:"var(--terracotta)" }}>
              Ce lien a expiré
            </div>
            <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>
              Ce lien de paiement a expiré. Contactez {link.pro.name} pour en obtenir un nouveau.
            </p>
          </div>
        )}

        {/* Formulaire actif */}
        {isValid && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:36, alignItems:"start" }}>
            <div>
              {/* Récapitulatif */}
              <h2 className="section-title">Récapitulatif</h2>
              <p className="section-hint">Le détail exact de ce que vous allez régler.</p>

              <div className="recap-box">
                <div className="recap-row"><span className="recap-lbl">Prestataire</span><span className="recap-val">{link.pro.name}</span></div>
                <div className="recap-row"><span className="recap-lbl">Prestation</span><span className="recap-val">{link.label}</span></div>
                <div className="recap-row"><span className="recap-lbl">{TYPE_LABEL[link.type]}</span><span className="recap-val">{formatAmount(link.amount)}</span></div>
                <div className="recap-row"><span className="recap-lbl">Frais de service Le Carnet · 3 %</span><span className="recap-val">+ {formatAmount(link.amountTotal - link.amount)}</span></div>
                <div className="recap-total">
                  <span className="recap-total-lbl">Total à régler</span>
                  <span className="recap-total-val">{formatAmount(link.amountTotal)}</span>
                </div>
              </div>

              <div style={{ background:"var(--ivory)", padding:"14px 16px", marginBottom:18, fontSize:"0.78rem", color:"var(--mute)", borderLeft:"2px solid var(--taupe)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", lineHeight:1.5 }}>
                Les frais de service (3 %) financent le paiement sécurisé Stripe et la médiation en cas de litige.
              </div>

              <div className="legal-note">
                <div className="legal-note-title">Conditions de paiement</div>
                <ul className="legal-note-list">
                  <li><strong>Paiement par carte bancaire uniquement</strong>, sécurisé par Stripe · 3D Secure.</li>
                  <li><strong>Pas de remboursement automatique</strong> une fois l&apos;acompte versé.</li>
                  <li>En cas de litige, <strong>Le Carnet propose une médiation gratuite</strong>.</li>
                </ul>
              </div>
            </div>

            {/* Formulaire Stripe */}
            <aside>
              <PaymentForm
                paymentLinkId={id}
                amountTotal={link.amountTotal}
                coupleName={link.coupleName}
                publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
              />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
