"use client";

import { useState } from "react";

export default function SaveProButton({ proId, initialSaved }: { proId: string; initialSaved: boolean }) {
  const [saved,   setSaved]   = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    if (saved) {
      await fetch("/api/couple/selection", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proId }),
      });
    } else {
      await fetch("/api/couple/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proId }),
      });
    }
    setSaved((s) => !s);
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={saved ? "btn gold small" : "btn ghost small"}
      style={{ gap: 6 }}
    >
      {saved ? "✦ Sauvegardé" : "✦ Sauvegarder dans mon carnet"}
    </button>
  );
}
