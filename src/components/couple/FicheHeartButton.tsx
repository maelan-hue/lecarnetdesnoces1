"use client";
import { useState } from "react";

export default function FicheHeartButton({ proId, category, initialSaved }: { proId: string; category: string; initialSaved: boolean }) {
  const [saved,   setSaved]   = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const action = saved ? "remove" : "favorite";
    const res = await fetch("/api/couple/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proId, category, action }),
    });
    const json = await res.json();
    if (res.ok) setSaved(!saved);
    else alert(json.error ?? "Erreur");
    setLoading(false);
  };

  return (
    <button
      className={`heart-btn${saved ? " filled" : ""}`}
      onClick={toggle}
      disabled={loading}
      title={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
      style={{ fontSize:"1.5rem" }}
    >
      {saved ? "♥" : "♡"}
    </button>
  );
}
