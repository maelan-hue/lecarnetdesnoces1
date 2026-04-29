"use client";
import { useRouter } from "next/navigation";

export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "'Jost', sans-serif", fontSize: "0.62rem",
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: "var(--mute)", display: "flex", alignItems: "center", gap: 6,
        padding: 0, transition: "color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--mute)")}
    >
      ← Retour
    </button>
  );
}
