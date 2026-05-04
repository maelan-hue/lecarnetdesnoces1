import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

export default async function StatistiquesPage() {
  const session = await getSession();
  if (!session || session.role !== "pro") redirect("/connexion-pro");

  const pro = await db.pro.findUnique({
    where: { id: session.sub },
    include: {
      stats: true,
      conversations: { select: { id: true, createdAt: true } },
      paymentLinks: {
        where:  { status: "PAID" },
        select: { amount: true, paidAt: true, quoteTotal: true },
      },
    },
  });
  if (!pro) redirect("/connexion-pro");

  // ── Chiffres clés ────────────────────────────────────────────
  const profileViews  = pro.stats?.profileViews ?? 0;
  const messageCount  = pro.conversations.length;
  const paidLinks     = pro.paymentLinks;
  const caTotal       = paidLinks.reduce((s, p) => s + p.amount, 0); // centimes
  const conversionPct = messageCount > 0 ? Math.round((paidLinks.length / messageCount) * 100) : 0;

  // ── CA mensuel (12 derniers mois) ────────────────────────────
  const now   = new Date();
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { month: d.getMonth(), year: d.getFullYear(), total: 0 };
  });

  for (const link of paidLinks) {
    if (!link.paidAt) continue;
    const d = new Date(link.paidAt);
    const idx = monthly.findIndex((m) => m.month === d.getMonth() && m.year === d.getFullYear());
    if (idx !== -1) monthly[idx].total += link.amount;
  }

  const maxMonthly = Math.max(...monthly.map((m) => m.total), 1);

  // ── Mariages confirmés (PaymentLinks uniques par couple) ────
  const paidThisYear = paidLinks.filter((p) => p.paidAt && new Date(p.paidAt).getFullYear() === now.getFullYear());
  const caThisYear   = paidThisYear.reduce((s, p) => s + p.amount, 0);

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " €";

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Votre activité en chiffres</div>
        <h1 className="page-title">Statis<em>tiques</em></h1>
        <p className="page-sub">Vues de fiche, messages, conversions, chiffre d&apos;affaires.</p>
      </div>

      {/* Chiffres clés */}
      <div className="stats-grid" style={{ marginBottom: 36 }}>
        <div className="stat-card">
          <div className="stat-lbl">Vues de fiche</div>
          <div className="stat-val">{profileViews.toLocaleString("fr-FR")}</div>
          <div className="stat-trend">depuis le lancement</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Messages reçus</div>
          <div className="stat-val"><em>{messageCount}</em></div>
          <div className="stat-trend">conversations initiées</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Taux de conversion</div>
          <div className="stat-val">{conversionPct} %</div>
          <div className="stat-trend" style={{ color: conversionPct >= 15 ? "var(--sage)" : "var(--mute)" }}>
            {conversionPct >= 15 ? "↑ au-dessus de la moyenne" : "messages → paiements"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">CA encaissé {now.getFullYear()}</div>
          <div className="stat-val">{fmt(caThisYear)}</div>
          <div className="stat-trend">
            {paidThisYear.length} paiement{paidThisYear.length > 1 ? "s" : ""} reçu{paidThisYear.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Graphique CA mensuel */}
      <div className="chart-placeholder" style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:28, marginBottom:24 }}>
        <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:500, marginBottom:4 }}>
          Chiffre d&apos;affaires mensuel
        </h4>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.85rem", color:"var(--mute)", marginBottom:20 }}>
          12 derniers mois · {fmt(caTotal)} encaissés au total
        </p>

        {caTotal === 0 ? (
          <div style={{ height:120, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)" }}>
            Aucun paiement encaissé pour l&apos;instant.
          </div>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:6, height:160, alignItems:"end", paddingBottom:14, borderBottom:"1px solid var(--bone)", marginBottom:10 }}>
              {monthly.map((m, i) => {
                const pct = Math.max(4, Math.round((m.total / maxMonthly) * 100));
                return (
                  <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, height:"100%", justifyContent:"flex-end" }} title={`${MONTHS[m.month]} ${m.year} · ${fmt(m.total)}`}>
                    <div style={{ width:"100%", height:`${pct}%`, background: m.total > 0 ? "linear-gradient(180deg,var(--gold),var(--taupe))" : "var(--bone)", borderRadius:2, transition:"height 0.3s", cursor: m.total > 0 ? "pointer" : "default" }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:6 }}>
              {monthly.map((m, i) => (
                <div key={i} style={{ fontSize:"0.6rem", textAlign:"center", color:"var(--mute)", letterSpacing:"0.06em", textTransform:"uppercase" }}>
                  {MONTHS[m.month]}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Derniers paiements */}
      {paidLinks.length > 0 && (
        <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:28 }}>
          <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:500, marginBottom:18 }}>
            Derniers paiements encaissés
          </h4>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {[...paidLinks]
              .sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime())
              .slice(0, 8)
              .map((p, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"0.5px dashed var(--bone)" }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.85rem", color:"var(--mute)" }}>
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" }) : "—"}
                  </div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.05rem", color:"var(--gold)", fontWeight:500 }}>
                    {fmt(p.amount)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Message si pas encore d'activité */}
      {profileViews === 0 && messageCount === 0 && (
        <div className="tip" style={{ marginTop:24 }}>
          🌿 <strong>Conseil —</strong> Complétez votre fiche publique (bio, portfolio, tarifs) pour apparaître dans les recherches des couples et commencer à recevoir des vues.
        </div>
      )}
    </>
  );
}
