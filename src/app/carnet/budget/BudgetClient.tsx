"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type StripeEntry = {
  id: string; proId: string; proName: string; proCategory: string; proCity: string | null;
  totalAmount: number; depositAmount: number; status: "stripe"; label: string; paidAt: string | null;
};

type ManualEntry = {
  id: string; proId: string | null; proName: string | null; proSlug: string | null;
  vendorName: string; vendorCategory: string; vendorCity: string | null;
  isExternal: boolean; totalAmount: number; depositAmount: number;
  status: string; paymentMethod: string | null; notes: string | null;
};

type Data = {
  budgetEstimate: number | null;
  paidLinks: StripeEntry[];
  manual: ManualEntry[];
  categories: string[];
  categoryLabels: Record<string, string>;
};

const STATUS_LABEL: Record<string, string> = {
  DISCUSSING:   "En discussion",
  QUOTED:       "Devis reçu",
  DEPOSIT_PAID: "Acompte versé",
  FULLY_PAID:   "Soldé",
  stripe:       "Versé · Stripe",
};

const fmt = (cents: number) => (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " €";

export default function BudgetClient({ data }: { data: Data }) {
  const router = useRouter();
  const [entries,       setEntries]       = useState(data.manual);
  const [deleting,      setDeleting]      = useState<string | null>(null);
  const [editBudget,    setEditBudget]    = useState(false);
  const [budgetInput,   setBudgetInput]   = useState(data.budgetEstimate ? String(data.budgetEstimate) : "");
  const [budgetVal,     setBudgetVal]     = useState(data.budgetEstimate ? data.budgetEstimate * 100 : null);
  const [savingBudget,  setSavingBudget]  = useState(false);

  const saveBudget = async () => {
    const val = parseInt(budgetInput) || 0;
    if (val <= 0) { setEditBudget(false); return; }
    setSavingBudget(true);
    await fetch("/api/couple/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ budgetEstimate: val }),
    });
    setBudgetVal(val * 100);
    setSavingBudget(false);
    setEditBudget(false);
    router.refresh();
  };

  // Calculs globaux
  const allDevis = [
    ...data.paidLinks.map((p) => p.totalAmount),
    ...entries.map((m) => m.totalAmount),
  ];
  const allVerse = [
    ...data.paidLinks.map((p) => p.depositAmount),
    ...entries.map((m) => m.depositAmount),
  ];

  const totalEngage = allDevis.reduce((s, v) => s + v, 0);
  const totalVerse  = allVerse.reduce((s, v) => s + v, 0);
  const totalReste  = totalEngage - totalVerse;
  const budget      = budgetVal;
  const marge       = budget ? budget - totalEngage : null;
  const pct         = budget && budget > 0 ? Math.min(100, Math.round(totalEngage / budget * 100)) : 0;

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette entrée ?")) return;
    setDeleting(id);
    await fetch(`/api/couple/budget/${id}`, { method: "DELETE" });
    setEntries((e) => e.filter((x) => x.id !== id));
    setDeleting(null);
  };

  // Grouper par catégorie
  const allCategories = [...new Set([
    ...data.paidLinks.map((p) => p.proCategory),
    ...entries.map((m) => m.vendorCategory),
  ])];

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">Votre <em>budget</em></h1>
        <p className="page-sub">Tous vos prestataires, retenus ou réglés, en un seul endroit.</p>
      </div>

      {/* Récap global */}
      <div className="budget-summary">
        <div className="eyebrow" style={{ color:"var(--gold)" }}>Vue d&apos;ensemble</div>
        <div className="budget-grid">
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <span className="budget-cell-lbl" style={{ marginBottom:0 }}>Budget prévisionnel</span>
              <button
                onClick={() => setEditBudget(true)}
                title="Modifier"
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--taupe)", fontSize:"0.75rem", padding:"2px 4px", lineHeight:1, transition:"color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--taupe)")}
              >✎</button>
            </div>
            {editBudget ? (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <input
                  type="number"
                  min={1}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveBudget(); if (e.key === "Escape") setEditBudget(false); }}
                  autoFocus
                  style={{ width:100, fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", color:"var(--gold)", background:"transparent", border:"none", borderBottom:"1px solid var(--gold)", outline:"none", padding:"2px 0" }}
                />
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", color:"var(--gold)" }}>€</span>
                <button className="btn gold small" onClick={saveBudget} disabled={savingBudget} style={{ fontSize:"0.55rem", padding:"4px 10px" }}>
                  {savingBudget ? "…" : "✓"}
                </button>
                <button onClick={() => setEditBudget(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--mute)", fontSize:"0.8rem" }}>✕</button>
              </div>
            ) : (
              <div className="budget-cell-val">{budget ? fmt(budget) : "—"}</div>
            )}
            <div className="budget-cell-sub">{editBudget ? "Appuyez sur Entrée pour valider" : "modifiable"}</div>
          </div>
          <div>
            <div className="budget-cell-lbl">Engagé (devis)</div>
            <div className="budget-cell-val gold">{fmt(totalEngage)}</div>
            <div className="budget-cell-sub">{allDevis.length} prestataire{allDevis.length > 1 ? "s" : ""} retenus</div>
          </div>
          <div>
            <div className="budget-cell-lbl">Déjà versé</div>
            <div className="budget-cell-val">{fmt(totalVerse)}</div>
            <div className="budget-cell-sub">acomptes &amp; soldes</div>
          </div>
          <div>
            <div className="budget-cell-lbl">Reste à régler</div>
            <div className="budget-cell-val">{fmt(totalReste)}</div>
            <div className="budget-cell-sub">sur engagements actuels</div>
          </div>
        </div>

        {budget && budget > 0 && (
          <div className="budget-bar-wrap">
            <div className="eyebrow">
              Engagement total · {fmt(totalEngage)} sur {fmt(budget)}
              {marge !== null && marge >= 0 && (
                <span style={{ marginLeft:12, color:"var(--sage)" }}>· {fmt(marge)} de marge</span>
              )}
              {marge !== null && marge < 0 && (
                <span style={{ marginLeft:12, color:"var(--terracotta)" }}>· {fmt(-marge)} de dépassement</span>
              )}
            </div>
            <div className="budget-bar-bg">
              <div className="budget-bar-fill" style={{ width:`${pct}%`, background: pct > 100 ? "var(--terracotta)" : undefined }} />
            </div>
            <div className="budget-bar-legend">
              <span>{pct} % engagés</span>
              {marge !== null && <span>{marge >= 0 ? `${fmt(marge)} disponibles` : `${fmt(-marge)} de dépassement`}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Liste par catégorie */}
      {allCategories.length === 0 ? (
        <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", margin:"40px 0" }}>
          Aucun prestataire dans votre budget pour l&apos;instant.
        </p>
      ) : (
        allCategories.map((cat) => {
          const stripeItems = data.paidLinks.filter((p) => p.proCategory === cat);
          const manualItems = entries.filter((m) => m.vendorCategory === cat);
          const catTotal = [...stripeItems.map((p) => p.totalAmount), ...manualItems.map((m) => m.totalAmount)].reduce((s, v) => s + v, 0);
          const label = data.categoryLabels[cat] ?? cat;

          return (
            <div key={cat} className="cat-section">
              <div className="cat-section-head">
                <div className="cat-name"><em>{label}</em></div>
                <div className="cat-total">{fmt(catTotal)}</div>
              </div>

              {stripeItems.map((p) => (
                <div key={p.id} className="vendor-row">
                  <div>
                    <div className="vendor-cat">{label}</div>
                    <div className="vendor-name">{p.proName}</div>
                  </div>
                  <div className="vendor-status">Versé · Stripe</div>
                  <div className="vendor-amount">{fmt(p.totalAmount)}</div>
                  <Link href={`/prestataires/${p.proId}`} className="btn ghost small" style={{ fontSize:"0.58rem", padding:"6px 10px" }}>
                    Détail
                  </Link>
                </div>
              ))}

              {manualItems.map((m) => (
                <div key={m.id} className="vendor-row manual">
                  <div>
                    <div className="vendor-cat">{label}</div>
                    <div className="vendor-name">
                      {m.vendorName}
                      {!m.isExternal && <span className="badge-manual">Saisi manuellement</span>}
                      {m.isExternal  && <span className="badge-external">Hors plateforme</span>}
                    </div>
                    {m.depositAmount > 0 && (
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.78rem", color:"var(--mute)", marginTop:2 }}>
                        Acompte versé : {fmt(m.depositAmount)} · Reste : {fmt(m.totalAmount - m.depositAmount)}
                      </div>
                    )}
                  </div>
                  <div className="vendor-status">{STATUS_LABEL[m.status] ?? m.status}</div>
                  <div className="vendor-amount">{fmt(m.totalAmount)}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button
                      className="btn ghost small"
                      style={{ fontSize:"0.58rem", padding:"6px 10px" }}
                      onClick={() => router.push(`/carnet/budget/${m.id}/modifier`)}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={deleting === m.id}
                      style={{ background:"none", border:"none", cursor:"pointer", color:"var(--mute)", fontSize:"0.8rem", padding:"4px" }}
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}

      {/* CTA ajout */}
      <div className="add-cta-zone">
        <div className="eyebrow" style={{ marginBottom:8 }}>Ajouter une prestation à votre budget</div>
        <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", marginBottom:16, fontSize:"0.95rem" }}>
          Vous avez retenu un prestataire ou réservé en direct ? Ajoutez-le pour suivre votre budget complet.
        </p>
        <Link href="/carnet/budget/ajouter" className="btn gold">+ Ajouter une prestation</Link>
      </div>
    </div>
  );
}
