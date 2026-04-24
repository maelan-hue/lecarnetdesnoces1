"use client";
import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  { value: "PHOTOGRAPHE",         label: "Photographe" },
  { value: "VIDEASTE",            label: "Vidéaste" },
  { value: "TRAITEUR",            label: "Traiteur" },
  { value: "LIEU",                label: "Lieu de réception" },
  { value: "FLEURISTE",           label: "Fleuriste" },
  { value: "DJ_MUSICIEN",         label: "DJ / Musicien" },
  { value: "OFFICIANT",           label: "Officiant laïc" },
  { value: "COIFFURE_MAQUILLAGE", label: "Coiffure & maquillage" },
  { value: "DECORATION_PAPETERIE",label: "Décoration / Papeterie" },
  { value: "WEDDING_PLANNER",     label: "Wedding planner" },
  { value: "AUTRE",               label: "Autre" },
];

export default function InscriptionProPage() {
  const [form, setForm] = useState({ name: "", category: "PHOTOGRAPHE", email: "", password: "", phone: "", department: "66 — Pyrénées-Orientales" });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    const res  = await fetch("/api/auth/pro/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Erreur"); return; }
    setSuccess(json.message);
  };

  return (
    <div style={{ paddingTop: 60 }}>
      {/* Nav minimale */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: "var(--paper)", borderBottom: "1px solid var(--bone)", padding: "0 32px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" className="landing-logo" style={{ fontSize: "1.1rem" }}>Le Carnet <em>des noces</em></Link>
        <Link href="/connexion-pro" className="btn ghost small">Déjà inscrit ?</Link>
      </nav>

      <div className="container">
        <div className="signup-hero">
          <div className="eyebrow">Pour les artisans du mariage</div>
          <h1 className="page-title">Rejoignez Le <em>Carnet des noces</em></h1>
          <p className="page-sub" style={{ margin: "14px auto 0" }}>Un outil respectueux, éditorial, conçu pour votre métier. Pas d&apos;abonnement — nous gagnons seulement quand vous encaissez.</p>
        </div>

        <div className="signup-benefit-grid" style={{ marginBottom: 50 }}>
          {[
            { icon: "✦", title: "Demandes qualifiées",   text: "Date, lieu, budget, style, invités. Fini les messages vagues." },
            { icon: "§", title: "Paiements en un clic",  text: "Créez un lien Stripe en 30 secondes. 3 % à la charge du couple." },
            { icon: "✶", title: "Vitrine éditoriale",    text: "Portfolio 12 photos, tarifs, style. Un écrin à la hauteur de votre travail." },
            { icon: "◎", title: "Calendrier de dispos",  text: "Les couples voient vos dates disponibles avant de vous contacter." },
            { icon: "✎", title: "Messagerie centralisée",text: "Tous vos échanges avec vos couples en un endroit." },
            { icon: "⌘", title: "Statistiques & suivi",  text: "Vues de fiche, messages, taux de conversion, CA annuel." },
          ].map(({ icon, title, text }) => (
            <div key={title} className="signup-benefit">
              <div className="signup-benefit-icon">{icon}</div>
              <h4>{title}</h4>
              <p>{text}</p>
            </div>
          ))}
        </div>

        <div className="msg-panel" style={{ maxWidth: 580, margin: "0 auto" }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontWeight: 500, marginBottom: 24 }}>Commencer maintenant</h3>

          {success ? (
            <div className="success-banner">
              <div className="success-icon">✓</div>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.15rem", fontWeight: 500, marginBottom: 4 }}>Demande reçue</div>
                <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", fontSize: "0.95rem" }}>{success}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="field-label">Nom de l&apos;atelier</label>
              <input className="input" placeholder="Studio Mila & Jules" value={form.name} onChange={(e) => set("name", e.target.value)} required />
              <label className="field-label">Catégorie</label>
              <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
              <label className="field-label">Votre email</label>
              <input className="input" type="email" placeholder="vous@votre-atelier.fr" value={form.email} onChange={(e) => set("email", e.target.value)} required />
              <label className="field-label">Mot de passe</label>
              <input className="input" type="password" placeholder="8 caractères minimum" value={form.password} onChange={(e) => set("password", e.target.value)} required />
              <label className="field-label">Téléphone</label>
              <input className="input" placeholder="+33 6 …" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              <label className="field-label">Département principal</label>
              <input className="input" value={form.department} onChange={(e) => set("department", e.target.value)} />
              <p className="serif" style={{ fontStyle: "italic", fontSize: "0.88rem", color: "var(--mute)", lineHeight: 1.5, margin: "0 0 20px", borderLeft: "2px solid var(--taupe)", paddingLeft: 14 }}>
                En créant votre compte, vous acceptez les CGV. Les frais de service sont de <strong style={{ fontStyle: "normal", color: "var(--gold)", fontWeight: 500 }}>3 % sur l&apos;acompte</strong>, à la charge du couple. Aucun abonnement.
              </p>
              {error && <p className="serif" style={{ fontStyle: "italic", color: "var(--terracotta)", marginBottom: 16 }}>{error}</p>}
              <button className="btn gold" type="submit" disabled={loading}>{loading ? "Envoi…" : "Créer mon compte"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
