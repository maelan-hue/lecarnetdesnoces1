"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminConnexionPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error,  setError]      = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const res  = await fetch("/api/auth/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Erreur"); return; }
    router.push("/admin/dashboard");
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--ink)" }}>
      <div style={{ background:"var(--paper)", padding:"48px 44px", width:"100%", maxWidth:420 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem", fontWeight:500, marginBottom:6 }}>
          Le Carnet <em style={{ color:"var(--gold)", fontStyle:"italic" }}>des noces</em>
        </div>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", marginBottom:36, fontSize:"0.9rem" }}>Administration</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:18 }}><label className="field-label">Email admin</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div style={{ marginBottom:28 }}><label className="field-label">Mot de passe</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          {error && <p style={{ color:"var(--terracotta)", fontSize:"0.9rem", marginBottom:16 }}>{error}</p>}
          <button className="btn gold" type="submit" disabled={loading} style={{ width:"100%", justifyContent:"center" }}>{loading ? "…" : "Connexion"}</button>
        </form>
      </div>
    </div>
  );
}
