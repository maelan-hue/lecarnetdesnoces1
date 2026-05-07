"use client";

import { useState } from "react";
import Link from "next/link";

export default function MotDePasseOubliePage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { setError("Une erreur est survenue. Réessayez."); return; }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div className="landing-logo" style={{ fontSize: "1.4rem", display: "inline-block" }}>
              Le Carnet <em>des noces</em>
            </div>
          </Link>
          <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", marginTop: 10, fontSize: "1rem" }}>
            Mot de passe oublié
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <p className="serif" style={{ fontStyle: "italic", color: "var(--ink)", lineHeight: 1.7, marginBottom: 28 }}>
              Si un compte existe pour <strong>{email}</strong>, vous recevrez un email avec un lien de réinitialisation dans quelques instants.
            </p>
            <Link href="/connexion" style={{ color: "var(--gold)", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.95rem" }}>
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: "var(--mute)", fontSize: "0.9rem", marginBottom: 24, lineHeight: 1.6 }}>
              Saisissez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
            <div style={{ marginBottom: 28 }}>
              <label className="field-label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sophie@email.com"
                required
              />
            </div>

            {error && (
              <p className="serif" style={{ fontStyle: "italic", color: "var(--terracotta)", marginBottom: 16, fontSize: "0.95rem" }}>{error}</p>
            )}

            <button className="btn gold" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>

            <div style={{ textAlign: "center", marginTop: 24, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--mute)", fontSize: "0.95rem" }}>
              <Link href="/connexion" style={{ color: "var(--gold)" }}>Retour à la connexion</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
