"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function BudgetSlot({ budgetEstimate }: { budgetEstimate: number | null }) {
  const [engaged, setEngaged] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/couple/budget")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        const paidTotal  = (d.paidLinks ?? []).reduce((s: number, p: { totalAmount: number }) => s + p.totalAmount, 0);
        const manualTotal= (d.manual    ?? []).reduce((s: number, m: { totalAmount: number }) => s + m.totalAmount, 0);
        setEngaged(paidTotal + manualTotal);
      })
      .catch(() => {});
  }, []);

  const budget = budgetEstimate ? budgetEstimate * 100 : null;
  const marge  = budget !== null && engaged !== null ? budget - engaged : null;

  return (
    <Link href="/carnet/budget" style={{ textDecoration:"none" }}>
      <div className="cd" style={{ cursor:"pointer", padding:"8px 14px" }}
        onMouseEnter={(e) => { (e.currentTarget.querySelector(".cd-l") as HTMLElement).style.color = "var(--gold)"; }}
        onMouseLeave={(e) => { (e.currentTarget.querySelector(".cd-l") as HTMLElement).style.color = ""; }}
      >
        {engaged === null ? (
          <span className="cd-n" style={{ fontSize:"1.4rem", color:"var(--bone)" }}>—</span>
        ) : marge !== null && marge >= 0 ? (
          <span className="cd-n" style={{ color:"var(--sage)", fontSize:"1.4rem" }}>
            {(marge / 100).toLocaleString("fr-FR")} €
          </span>
        ) : engaged > 0 ? (
          <span className="cd-n" style={{ color:"var(--gold)", fontSize:"1.4rem" }}>
            {(engaged / 100).toLocaleString("fr-FR")} €
          </span>
        ) : (
          <span className="cd-n" style={{ color:"var(--bone)" }}>—</span>
        )}
        <span className="cd-l">
          {marge !== null && marge >= 0 ? "Marge →" : engaged !== null && engaged > 0 ? "Engagés →" : "Budget →"}
        </span>
      </div>
    </Link>
  );
}
