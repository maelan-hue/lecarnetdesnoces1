"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  useEffect(() => {
    if (!token) setError("Lien invalide ou expiré. Refaites une demande.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8)  { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Une erreur est survenue."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/connexion"), 3000);
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
            Nouveau mot de passe
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <p className="serif" style={{ fontStyle: "italic", color: "var(--ink)", lineHeight: 1.7, marginBottom: 12 }}>
              Votre mot de passe a bien été modifié.
            </p>
            <p style={{ color: "var(--mute)", fontSize: "0.9rem" }}>Redirection en cours…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Nouveau mot de passe</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                required
                minLength={8}
                disabled={!token}
              />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label className="field-label">Confirmer le mot de passe</label>
              <input
                className="input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                disabled={!token}
              />
            </div>

            {error && (
              <p className="serif" style={{ fontStyle: "italic", color: "var(--terracotta)", marginBottom: 16, fontSize: "0.95rem" }}>{error}</p>
            )}

            <button className="btn gold" type="submit" disabled={loading || !token} style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
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

export default function ReinitialisermotdepassePage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
