import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "pro") redirect("/connexion-pro");

  const pro = await db.pro.findUnique({
    where: { id: session.sub },
    include: { stats: true },
  });
  if (!pro) redirect("/connexion-pro");

  const firstName = pro.name.split(/\s+/)[0];

  const unreadCount = await db.conversation.aggregate({
    where:   { proId: session.sub },
    _sum:    { unreadByPro: true },
  });
  const unread = unreadCount._sum.unreadByPro ?? 0;

  const recentConversations = await db.conversation.findMany({
    where:   { proId: session.sub },
    include: {
      couple:   { select: { prenoms: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Bonjour {firstName}</div>
        <h1 className="page-title">Tableau <em>de bord</em></h1>
        <p className="page-sub">
          {unread > 0
            ? `${unread} message${unread > 1 ? "s" : ""} non lu${unread > 1 ? "s" : ""} en attente.`
            : "Tout est à jour."}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-lbl">Vues de fiche</div>
          <div className="stat-val">{pro.stats?.profileViews ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Messages reçus</div>
          <div className="stat-val"><em>{pro.stats?.messageCount ?? 0}</em></div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Non lus</div>
          <div className="stat-val">{unread}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Conversations</div>
          <div className="stat-val">{recentConversations.length}</div>
        </div>
      </div>

      <div className="cta-row">
        <h2 className="section-title">Messagerie récente</h2>
        <Link href="/dashboard/messagerie" className="btn gold small">Voir tout</Link>
      </div>

      {recentConversations.length === 0 ? (
        <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", padding: "30px 0" }}>
          Aucune conversation pour l&apos;instant. Complétez votre fiche pour recevoir vos premières demandes.
        </p>
      ) : (
        <div className="pay-list">
          {recentConversations.map((c) => {
            const last = c.messages[0];
            return (
              <div key={c.id} className="pay-row">
                <div className={`pay-status ${c.unreadByPro > 0 ? "ps-pending" : "ps-paid"}`} />
                <div>
                  <div className="pay-client">{c.couple.prenoms}</div>
                  <div className="pay-meta">
                    {last ? last.body.slice(0, 60) + (last.body.length > 60 ? "…" : "") : "Aucun message"}
                  </div>
                </div>
                <div />
                {c.unreadByPro > 0 && (
                  <span className="pay-badge pbg-pending">{c.unreadByPro} non lu{c.unreadByPro > 1 ? "s" : ""}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
