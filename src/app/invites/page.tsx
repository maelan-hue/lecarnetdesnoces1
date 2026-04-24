"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Guest = {
  id: string; firstName: string; lastName: string;
  address: string | null; diet: string | null;
  presence: "PRESENT" | "ABSENT" | "PENDING"; notes: string | null;
};

const PRESENCE_LABEL: Record<string, string> = { PRESENT: "Présent·e", ABSENT: "Absent·e", PENDING: "En attente" };
const PRESENCE_CLASS: Record<string, string> = { PRESENT: "present", ABSENT: "absent",   PENDING: "pending" };

export default function InvitesPage() {
  const [guests,  setGuests]  = useState<Guest[]>([]);
  const [filter,  setFilter]  = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    firstName: "", lastName: "", address: "", diet: "Aucun (standard)", presence: "PENDING", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/couple/guests");
    if (res.ok) setGuests(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) { setError("Prénom et nom obligatoires."); return; }
    setSaving(true);
    const res = await fetch("/api/couple/guests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, diet: form.diet === "Aucun (standard)" ? null : form.diet }),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ firstName: "", lastName: "", address: "", diet: "Aucun (standard)", presence: "PENDING", notes: "" });
      load();
    } else {
      const j = await res.json();
      setError(j.error ?? "Erreur");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet invité ?")) return;
    await fetch(`/api/couple/guests/${id}`, { method: "DELETE" });
    setGuests((g) => g.filter((x) => x.id !== id));
  };

  const filtered = guests.filter((g) => {
    if (filter === "ALL")     return true;
    if (filter === "SPECIAL") return !!g.diet;
    return g.presence === filter;
  });

  const stats = {
    total:   guests.length,
    present: guests.filter((g) => g.presence === "PRESENT").length,
    absent:  guests.filter((g) => g.presence === "ABSENT").length,
    pending: guests.filter((g) => g.presence === "PENDING").length,
    special: guests.filter((g) => !!g.diet).length,
  };

  return (
    <div className="container">

      <div className="breadcrumb">
        <Link href="/carnet">Votre carnet</Link>
        <span className="sep">·</span>
        <span>Invités</span>
      </div>

      <div className="page-head">
        <div className="eyebrow">Votre table</div>
        <h1 className="page-title">Vos <em>invités</em></h1>
        <p className="page-sub">Composez votre liste, notez les régimes alimentaires et suivez les réponses.</p>
      </div>

      {/* Statistiques */}
      <div className="guests-stats">
        <div className="guest-stat highlight">
          <div className="guest-stat-n">{stats.total}</div>
          <div className="guest-stat-lbl">Total invités</div>
        </div>
        <div className="guest-stat">
          <div className="guest-stat-n" style={{ color: "var(--sage)" }}>{stats.present}</div>
          <div className="guest-stat-lbl">Présents confirmés</div>
        </div>
        <div className="guest-stat">
          <div className="guest-stat-n" style={{ color: "var(--terracotta)" }}>{stats.absent}</div>
          <div className="guest-stat-lbl">Absents</div>
        </div>
        <div className="guest-stat">
          <div className="guest-stat-n" style={{ color: "var(--gold)" }}>{stats.pending}</div>
          <div className="guest-stat-lbl">En attente</div>
        </div>
      </div>

      <div className="tip">🌿 <strong>Bon à savoir —</strong> Pensez à demander les régimes alimentaires au moment de l&apos;invitation — votre traiteur en aura besoin 2 mois avant le mariage.</div>

      {/* Formulaire d'ajout */}
      <div className="guest-add-form">
        <h3>Ajouter un <em>invité</em></h3>
        <p className="guest-add-form-sub">Remplissez les informations ci-dessous.</p>
        <form onSubmit={handleAdd}>
          <div className="guest-form-row">
            <div><label className="field-label">Prénom</label><input className="input" placeholder="Marie" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} /></div>
            <div><label className="field-label">Nom</label><input className="input" placeholder="Dupont" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} /></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Adresse postale</label>
            <input className="input" placeholder="12 rue des Lilas, 66000 Perpignan" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="guest-form-row">
            <div>
              <label className="field-label">Régime alimentaire</label>
              <select className="input" value={form.diet} onChange={(e) => setForm((f) => ({ ...f, diet: e.target.value }))}>
                {["Aucun (standard)", "Végétarien", "Végétalien / Vegan", "Sans gluten", "Sans lactose", "Halal", "Casher", "Allergie (préciser en commentaire)", "Enfant (menu enfant)"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Présence</label>
              <select className="input" value={form.presence} onChange={(e) => setForm((f) => ({ ...f, presence: e.target.value }))}>
                <option value="PENDING">En attente de réponse</option>
                <option value="PRESENT">Présent·e confirmé·e</option>
                <option value="ABSENT">Absent·e</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="field-label">Commentaire (optionnel)</label>
            <input className="input" placeholder="Ex : Allergie aux arachides · Table avec ses parents" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          {error && <p style={{ color: "var(--terracotta)", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", marginBottom: 12 }}>{error}</p>}
          <button className="btn gold" type="submit" disabled={saving}>{saving ? "Ajout…" : "Ajouter à la liste"}</button>
        </form>
      </div>

      {/* Filtres */}
      <h2 className="section-title">Liste complète</h2>
      <div className="guest-filters">
        {[
          { key: "ALL",     label: `Tous (${stats.total})` },
          { key: "PRESENT", label: `Présents (${stats.present})` },
          { key: "ABSENT",  label: `Absents (${stats.absent})` },
          { key: "PENDING", label: `En attente (${stats.pending})` },
          { key: "SPECIAL", label: `Régimes spéciaux (${stats.special})` },
        ].map(({ key, label }) => (
          <button key={key} className={`guest-filter-chip${filter === key ? " active" : ""}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", padding: "40px 0" }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="guest-empty">Aucun invité dans cette catégorie.</div>
      ) : (
        <div className="guest-list">
          <div className="guest-row header">
            <div>Nom &amp; prénom</div><div>Adresse</div><div>Régime</div><div>Présence</div><div></div>
          </div>
          {filtered.map((g) => (
            <div key={g.id} className="guest-row">
              <div><div className="guest-name">{g.firstName} {g.lastName}</div>{g.notes && <div className="guest-address">{g.notes}</div>}</div>
              <div className="guest-address">{g.address || "—"}</div>
              <div>{g.diet ? <span className="diet-tag">{g.diet}</span> : "—"}</div>
              <div><span className={`presence-badge ${PRESENCE_CLASS[g.presence]}`}>{PRESENCE_LABEL[g.presence]}</span></div>
              <div><button className="guest-row-action" onClick={() => handleDelete(g.id)}>✕</button></div>
            </div>
          ))}
        </div>
      )}

      {stats.total > 0 && (
        <div style={{ marginTop: 20, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", color: "var(--mute)", fontSize: "0.9rem" }}>
          {filtered.length} invité{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
        </div>
      )}

    </div>
  );
}
