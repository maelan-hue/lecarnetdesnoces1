"use client";

import { useState } from "react";

type Props = {
  proId:       string;
  initialStatus: "none" | "selection" | "confirmed";
};

export default function AddToSelectionButton({ proId, initialStatus }: Props) {
  const [status,  setStatus]  = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const isIn = status !== "none";

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    if (isIn) {
      if (!confirm("Retirer ce prestataire de votre sélection ?")) return;
      setLoading(true);
      await fetch("/api/couple/selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proId, action: "remove" }),
      });
      setStatus("none");
    } else {
      setLoading(true);
      await fetch("/api/couple/selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proId, action: "add" }),
      });
      setStatus("selection");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        background:    isIn ? "var(--gold)" : "transparent",
        color:         isIn ? "var(--paper)" : "var(--gold)",
        border:        "1px solid var(--gold)",
        padding:       "8px 14px",
        fontFamily:    "'Jost', sans-serif",
        fontSize:      "0.66rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        fontWeight:    500,
        cursor:        "pointer",
        transition:    "all 0.2s",
        whiteSpace:    "nowrap" as const,
      }}
    >
      {isIn ? "✓ Dans ma sélection" : "+ Ajouter à ma sélection"}
    </button>
  );
}
