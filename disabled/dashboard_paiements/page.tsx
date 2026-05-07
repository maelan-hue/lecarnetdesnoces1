"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatAmount } from "@/lib/stripe-utils";

type PaymentLink = {
  id: string; coupleName: string; coupleEmail: string; label: string;
  type: string; amount: number; amountTotal: number;
  status: string; createdAt: string; paidAt: string | null; expiresAt: string;
};

const STATUS_LABEL: Record<string, string> = { PENDING:"En attente", PAID:"Encaissé", EXPIRED:"Expiré", CANCELLED:"Annulé" };
const STATUS_CLASS: Record<string, string> = { PENDING:"pbg-pending", PAID:"pbg-paid", EXPIRED:"pbg-expired", CANCELLED:"pbg-expired" };
const DOT_CLASS:    Record<string, string> = { PENDING:"ps-pending",  PAID:"ps-paid",  EXPIRED:"ps-expired",  CANCELLED:"ps-expired" };
const TYPE_LABEL:   Record<string, string> = { ACOMPTE:"Acompte", SOLDE:"Solde", UNIQUE:"Paiement unique", ECHEANCE:"Échéance" };

export default function PaiementsPage() {
  const [links,   setLinks]   = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("ALL");

  useEffect(() => {
    fetch("/api/pro/paiements").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setLinks(d);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "ALL" ? links : links.filter((l) => l.status === filter);
  const totalEncaisse = links.filter((l) => l.status === "PAID").reduce((s, l) => s + l.amount, 0);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Historique complet</div>
        <h1 className="page-title">Mes <em>paiements</em></h1>
        <p className="page-sub">Toutes vos transactions, du premier acompte au dernier solde.</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[["ALL","Tous"], ["PENDING","En attente"], ["PAID","Encaissés"], ["EXPIRED","Expirés"]].map(([k, l]) => (
          <button key={k} className={`chip${filter === k ? " active" : ""}`} onClick={() => setFilter(k)}>
            {l} ({k === "ALL" ? links.length : links.filter((x) => x.status === k).length})
          </button>
        ))}
      </div>

      <div className="cta-row" style={{ marginBottom: 20 }}>
        <div className="serif" style={{ fontStyle: "italic", color: "var(--mute)" }}>
          {links.length} paiement{links.length > 1 ? "s" : ""} · {formatAmount(totalEncaisse)} encaissé{totalEncaisse > 0 ? "s" : ""}
        </div>
        <Link href="/dashboard/paiements/nouveau" className="btn gold small">+ Nouveau paiement</Link>
      </div>

      {loading ? (
        <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)" }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", marginBottom: 20 }}>
            {filter === "ALL" ? "Aucun paiement créé pour l'instant." : "Aucun paiement dans cette catégorie."}
          </p>
          {filter === "ALL" && <Link href="/dashboard/paiements/nouveau" className="btn gold">Créer mon premier lien</Link>}
        </div>
      ) : (
        <div className="pay-list">
          {filtered.map((link) => (
            <div key={link.id} className="pay-row">
              <div className={`pay-status ${DOT_CLASS[link.status]}`} />
              <div>
                <div className="pay-client">{link.coupleName}</div>
                <div className="pay-meta">
                  {TYPE_LABEL[link.type]} · {link.label} · {new Date(link.createdAt).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <div>
                <div className="pay-amount">{formatAmount(link.amount)}</div>
                <div className="pay-net">brut</div>
              </div>
              <span className={`pay-badge ${STATUS_CLASS[link.status]}`}>{STATUS_LABEL[link.status]}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
