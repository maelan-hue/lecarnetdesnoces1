"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ConnexionProPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error,  setError]      = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const res  = await fetch("/api/auth/pro/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Erreur de connexion."); return; }
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div className="landing-logo" style={{ fontSize: "1.4rem", display: "inline-block" }}>Le Carnet <em>des noces</em></div>
          </Link>
          <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", marginTop: 10 }}>Espace prestataire</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}><label className="field-label">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@atelier.fr" required /></div>
          <div style={{ marginBottom: 28 }}><label className="field-label">Mot de passe</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></div>
          {error && <p className="serif" style={{ fontStyle: "italic", color: "var(--terracotta)", marginBottom: 16, fontSize: "0.95rem" }}>{error}</p>}
          <button className="btn gold" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>{loading ? "Connexion…" : "Se connecter"}</button>
        </form>
        <div style={{ textAlign: "center", marginTop: 30, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", color: "var(--mute)", fontSize: "0.95rem" }}>
          Pas encore de compte ? <Link href="/inscription-pro" style={{ color: "var(--gold)" }}>Rejoindre Le Carnet</Link>
        </div>
      </div>
    </div>
  );
}
