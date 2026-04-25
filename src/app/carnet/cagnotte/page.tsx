import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import CagnotteDashboard from "./CagnotteDashboard";

export default async function CagnottePage() {
  const session = await getSession();
  if (!session || session.role !== "couple") redirect("/connexion");

  const cagnotte = await db.cagnotte.findUnique({
    where:   { coupleId: session.sub },
    include: {
      dreams:    { orderBy: { sortOrder: "asc" } },
      program:   { orderBy: { sortOrder: "asc" } },
      donations: { where: { status: "PAID" }, orderBy: { paidAt: "desc" } },
      withdrawals: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Pas encore de cagnotte → état vide
  if (!cagnotte) {
    return (
      <div className="container narrow" style={{ paddingTop: 80, textAlign: "center" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"4rem", color:"var(--gold)", lineHeight:1, marginBottom:20 }}>✦</div>
        <div className="eyebrow" style={{ marginBottom:16 }}>Cagnotte en ligne</div>
        <h1 className="page-title" style={{ textAlign:"center" }}>
          Créez votre <em>cagnotte</em>
        </h1>
        <p className="page-sub" style={{ textAlign:"center", margin:"14px auto 36px" }}>
          Une page éditoriale personnalisée pour que vos proches participent à votre bonheur.
          Racontez votre histoire, listez vos rêves, partagez un lien.
        </p>
        <div style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap", marginBottom:48 }}>
          {[
            { icon:"✦", title:"0 % de frais", desc:"jusqu'au retrait" },
            { icon:"§", title:"3 % au retrait", desc:"commission plateforme" },
            { icon:"◎", title:"Page éditoriale", desc:"photo, rêves, programme" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"22px 20px", textAlign:"center", minWidth:140 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.8rem", color:"var(--gold)", marginBottom:8 }}>{icon}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", fontWeight:500 }}>{title}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.82rem", color:"var(--mute)", marginTop:4 }}>{desc}</div>
            </div>
          ))}
        </div>
        <Link href="/carnet/cagnotte/config" className="btn large gold">Créer ma cagnotte →</Link>
      </div>
    );
  }

  const couple = await db.couple.findUnique({
    where: { id: session.sub },
    select: { weddingDate: true },
  });

  return (
    <CagnotteDashboard
      cagnotte={{
        id:          cagnotte.id,
        slug:        cagnotte.slug,
        title:       cagnotte.title,
        status:      cagnotte.status,
        ibanStored:  cagnotte.ibanStored,
        withdrawnAt: cagnotte.withdrawnAt?.toISOString() ?? null,
        showGuestbook: cagnotte.showGuestbook,
        dreams:      cagnotte.dreams.map((d) => ({ id: d.id, title: d.title })),
        donations:   cagnotte.donations.map((d) => ({
          id:          d.id,
          donorName:   d.donorName,
          isAnonymous: d.isAnonymous,
          message:     d.message,
          amountNet:   d.amountNet,
          paidAt:      d.paidAt?.toISOString() ?? null,
          dreamTitle:  null, // jointure simplifiée
        })),
        lastWithdrawal: cagnotte.withdrawals[0] ? {
          status:    cagnotte.withdrawals[0].status,
          amountNet: cagnotte.withdrawals[0].amountNet,
          createdAt: cagnotte.withdrawals[0].createdAt.toISOString(),
        } : null,
      }}
      weddingDate={couple?.weddingDate?.toISOString() ?? null}
    />
  );
}
