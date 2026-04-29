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
        const paidTotal   = (d.paidLinks ?? []).reduce((s: number, p: { totalAmount: number }) => s + p.totalAmount, 0);
        const manualTotal = (d.manual    ?? []).reduce((s: number, m: { totalAmount: number }) => s + m.totalAmount, 0);
        setEngaged(paidTotal + manualTotal);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Link href="/carnet/budget" style={{ textDecoration:"none" }}>
      <div className="cd" style={{ cursor:"pointer" }}>
        <span className="cd-n" style={{ color:"var(--gold)", fontSize:"1.6rem" }}>
          {engaged === null || engaged === 0
            ? "—"
            : `${(engaged / 100).toLocaleString("fr-FR")} €`}
        </span>
        <span className="cd-l">Budget →</span>
      </div>
    </Link>
  );
}
