import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "pro") redirect("/connexion-pro");

  const pro = await db.pro.findUnique({
    where: { id: session.sub },
    include: {
      paymentLinks: { orderBy: { createdAt: "desc" }, take: 5 },
      stats: true,
    },
  });
  if (!pro) redirect("/connexion-pro");

  const firstName = pro.name.split(/\s+/)[0];

  const encaisse = pro.paymentLinks
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  const enAttente = pro.paymentLinks
    .filter((p) => p.status === "PENDING")
    .reduce((s, p) => s + p.amount, 0);

  const STATUS_LABEL: Record<string, string> = { PENDING: "En attente", PAID: "Encaissé", EXPIRED: "Relancer", CANCELLED: "Annulé" };
  const STATUS_CLASS: Record<string, string> = { PENDING: "pbg-pending", PAID: "pbg-paid", EXPIRED: "pbg-expired", CANCELLED: "pbg-expired" };
  const DOT_CLASS:    Record<string, string> = { PENDING: "ps-pending",  PAID: "ps-paid",  EXPIRED: "ps-expired",  CANCELLED: "ps-expired" };

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Bonjour {firstName}</div>
        <h1 className="page-title">Tableau <em>de bord</em></h1>
        <p className="page-sub">{pro.paymentLinks.filter((p) => p.status === "PENDING").length} paiement(s) en attente.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-lbl">Encaissé</div><div className="stat-val">{encaisse.toLocaleString("fr-FR")} <span style={{ fontSize: "1rem" }}>€</span></div></div>
        <div className="stat-card"><div className="stat-lbl">En attente</div><div className="stat-val"><em>{enAttente.toLocaleString("fr-FR")}</em></div></div>
        <div className="stat-card"><div className="stat-lbl">Liens créés</div><div className="stat-val">{pro.paymentLinks.length}</div></div>
        <div className="stat-card"><div className="stat-lbl">Vues de fiche</div><div className="stat-val">{pro.stats?.profileViews ?? 0}</div></div>
      </div>

      <div className="tip">🌿 <strong>Conseil —</strong> Dès qu&apos;un devis est validé par votre couple, créez le lien de paiement. Les acomptes versés tôt sécurisent vos dates et votre trésorerie.</div>

      <div className="cta-row">
        <h2 className="section-title">Mes paiements récents</h2>
        <Link href="/dashboard/paiements/nouveau" className="btn gold small">+ Nouveau paiement</Link>
      </div>

      {pro.paymentLinks.length === 0 ? (
        <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", padding: "30px 0" }}>Aucun paiement créé pour l&apos;instant.</p>
      ) : (
        <div className="pay-list">
          {pro.paymentLinks.map((p) => (
            <div key={p.id} className="pay-row">
              <div className={`pay-status ${DOT_CLASS[p.status]}`} />
              <div>
                <div className="pay-client">{p.coupleName}</div>
                <div className="pay-meta">{p.label}</div>
              </div>
              <div>
                <div className="pay-amount">{p.amount.toLocaleString("fr-FR")} €</div>
                <div className="pay-net">brut</div>
              </div>
              <span className={`pay-badge ${STATUS_CLASS[p.status]}`}>{STATUS_LABEL[p.status]}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
