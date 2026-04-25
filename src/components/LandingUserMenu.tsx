"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  name: string;
  role: "couple" | "pro";
  dashboardUrl: string;
};

export default function LandingUserMenu({ name, role, dashboardUrl }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref    = useRef<HTMLDivElement>(null);

  // Fermer en cliquant dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: open ? "var(--gold)" : "rgba(168,131,59,0.12)",
          border: "1px solid var(--gold)",
          color: open ? "var(--paper)" : "var(--gold)",
          cursor: "pointer",
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1rem",
          fontWeight: 500,
          letterSpacing: "0.04em",
          padding: "10px 22px",
          display: "flex", alignItems: "center", gap: 10,
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}
      >
        {name} <span style={{ fontSize: "0.6rem" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "var(--ink)", border: "1px solid rgba(168,131,59,0.2)",
          minWidth: 200, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(250,248,244,0.1)" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem", color: "var(--paper)" }}>
              {name}
            </div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gold)", marginTop: 2 }}>
              {role === "couple" ? "Espace couple" : "Espace prestataire"}
            </div>
          </div>
          <Link
            href={dashboardUrl}
            onClick={() => setOpen(false)}
            style={{ display: "block", padding: "12px 16px", color: "rgba(250,248,244,0.8)", textDecoration: "none", fontSize: "0.82rem", transition: "background 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250,248,244,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {role === "couple" ? "Mon carnet →" : "Mon dashboard →"}
          </Link>
          {role === "couple" && (
            <Link
              href="/carnet/cagnotte"
              onClick={() => setOpen(false)}
              style={{ display: "block", padding: "12px 16px", color: "rgba(250,248,244,0.8)", textDecoration: "none", fontSize: "0.82rem", transition: "background 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250,248,244,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Ma cagnotte →
            </Link>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "12px 16px", background: "none", border: "none",
              borderTop: "1px solid rgba(250,248,244,0.1)",
              color: "rgba(250,248,244,0.4)", cursor: "pointer",
              fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--terracotta)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(250,248,244,0.4)")}
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
