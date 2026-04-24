"use client";

import { useState, useEffect, useRef } from "react";

type Tarif = { id: string; name: string; description: string | null; priceFrom: number; position: number };

const EMPTY_TARIF = { name: "", description: "", priceFrom: "" };

export default function PortfolioPage() {
  const [photos,      setPhotos]      = useState<string[]>([]);
  const [tarifs,      setTarifs]      = useState<Tarif[]>([]);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [editId,      setEditId]      = useState<string | null>(null);
  const [form,        setForm]        = useState(EMPTY_TARIF);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/pro/fiche").then((r) => r.json()).then((d) => {
      if (d.pro) setPhotos(d.pro.portfolioPhotos ?? []);
    });
    fetch("/api/pro/tarifs").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setTarifs(d);
    });
  }, []);

  // ── Upload photo ──────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Fichier image uniquement (JPG, PNG, WebP)."); return; }
    if (file.size > 8 * 1024 * 1024)    { setUploadError("Fichier trop lourd (8 Mo maximum)."); return; }

    setUploadError(""); setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    const res  = await fetch("/api/pro/portfolio", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);

    if (res.ok) {
      setPhotos(json.all);
    } else {
      setUploadError(json.error ?? "Erreur lors de l'upload.");
    }
    // Reset l'input pour pouvoir re-uploader le même fichier
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDeletePhoto = async (url: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    const res  = await fetch("/api/pro/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    const json = await res.json();
    if (res.ok) setPhotos(json.all);
  };

  // ── Tarifs ────────────────────────────────────────────────
  const startEdit = (tarif: Tarif) => {
    setEditId(tarif.id);
    setForm({ name: tarif.name, description: tarif.description ?? "", priceFrom: String(tarif.priceFrom) });
    setMsg("");
  };

  const cancelEdit = () => { setEditId(null); setForm(EMPTY_TARIF); };

  const handleSaveTarif = async () => {
    if (!form.name.trim() || !form.priceFrom) { setMsg("Nom et prix requis."); return; }
    setSaving(true); setMsg("");

    const url    = editId ? `/api/pro/tarifs/${editId}` : "/api/pro/tarifs";
    const method = editId ? "PATCH" : "POST";

    const res  = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, description: form.description, priceFrom: Number(form.priceFrom) }),
    });
    const json = await res.json();
    setSaving(false);

    if (res.ok) {
      if (editId) {
        setTarifs((t) => t.map((x) => x.id === editId ? json : x));
      } else {
        setTarifs((t) => [...t, json]);
      }
      cancelEdit();
      setMsg("Formule enregistrée.");
    } else {
      setMsg(json.error ?? "Erreur.");
    }
  };

  const handleDeleteTarif = async (id: string) => {
    if (!confirm("Supprimer cette formule ?")) return;
    const res = await fetch(`/api/pro/tarifs/${id}`, { method: "DELETE" });
    if (res.ok) setTarifs((t) => t.filter((x) => x.id !== id));
  };

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Vos travaux &amp; vos formules</div>
        <h1 className="page-title">Portfolio &amp; <em>tarifs</em></h1>
        <p className="page-sub">Six photos minimum. Les plus belles — celles qui racontent votre signature.</p>
      </div>

      {/* ── PORTFOLIO ── */}
      <h2 className="section-title">Portfolio</h2>
      <p className="section-hint">
        {photos.length} / 12 photos · Les premières apparaissent en tête de fiche.
      </p>

      <div className="portfolio-grid" style={{ marginBottom: 16, gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
        {photos.map((url) => (
          <div key={url} style={{ position: "relative", aspectRatio: "4/5" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Photo portfolio"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <button
              onClick={() => handleDeletePhoto(url)}
              style={{
                position: "absolute", top: 6, right: 6,
                background: "rgba(26,21,16,0.75)", color: "var(--paper)",
                border: "none", borderRadius: "50%", width: 28, height: 28,
                cursor: "pointer", fontSize: "0.85rem", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
              title="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}

        {photos.length < 12 && (
          <div
            onClick={() => fileRef.current?.click()}
            className="portfolio-add"
            style={{
              aspectRatio: "4/5", border: "2px dashed var(--bone)", background: "var(--paper)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, cursor: uploading ? "wait" : "pointer", color: "var(--mute)", transition: "all 0.2s",
            }}
          >
            {uploading ? (
              <span className="serif" style={{ fontStyle: "italic", fontSize: "0.9rem" }}>Envoi…</span>
            ) : (
              <>
                <span style={{ fontSize: "2rem", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", color: "var(--gold)" }}>+</span>
                <span style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ajouter</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {uploadError && (
        <p className="serif" style={{ fontStyle: "italic", color: "var(--terracotta)", marginBottom: 16 }}>
          {uploadError}
        </p>
      )}

      {/* ── TARIFS ── */}
      <h2 className="section-title" style={{ marginTop: 40 }}>Formules &amp; tarifs</h2>
      <p className="section-hint">Donnez des repères aux couples — les prix peuvent être ajustés au cas par cas.</p>

      {tarifs.length > 0 && (
        <div className="tarif-list" style={{ marginBottom: 24 }}>
          {tarifs.map((t) => (
            editId === t.id ? (
              // Formulaire d'édition inline
              <div key={t.id} style={{ padding: "16px 0", borderBottom: "1px dashed var(--bone)" }}>
                <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                  <div>
                    <label className="field-label">Nom de la formule</label>
                    <input className="input" style={{ marginBottom: 0 }} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Description (optionnelle)</label>
                    <input className="input" style={{ marginBottom: 0 }} placeholder="Ex : Préparatifs → soirée · 450 photos · album inclus" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Prix à partir de (€)</label>
                    <input className="input" style={{ marginBottom: 0 }} type="number" min={0} value={form.priceFrom} onChange={(e) => setForm((f) => ({ ...f, priceFrom: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn gold small" onClick={handleSaveTarif} disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
                  <button className="btn ghost small" onClick={cancelEdit}>Annuler</button>
                </div>
              </div>
            ) : (
              <div key={t.id} className="tarif-row">
                <div>
                  <div className="tarif-name">{t.name}</div>
                  {t.description && <div className="tarif-desc">{t.description}</div>}
                </div>
                <div className="tarif-price">À partir de {t.priceFrom.toLocaleString("fr-FR")} €</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn ghost small" onClick={() => startEdit(t)}>Modifier</button>
                  <button className="btn ghost small" onClick={() => handleDeleteTarif(t.id)} style={{ borderColor: "var(--terracotta)", color: "var(--terracotta)" }}>✕</button>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Formulaire d'ajout (si pas en mode édition) */}
      {!editId && (
        <div className="form-section">
          <h3>Ajouter une formule</h3>
          <label className="field-label">Nom</label>
          <input className="input" placeholder="Ex : Formule Journée complète" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <label className="field-label">Description (optionnelle)</label>
          <input className="input" placeholder="Ex : Préparatifs → soirée · album inclus" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <label className="field-label">Prix à partir de (€)</label>
          <input className="input" type="number" min={0} placeholder="2400" value={form.priceFrom} onChange={(e) => setForm((f) => ({ ...f, priceFrom: e.target.value }))} />
          <button className="btn gold" onClick={handleSaveTarif} disabled={saving}>{saving ? "Ajout…" : "+ Ajouter cette formule"}</button>
        </div>
      )}

      {msg && (
        <p className="serif" style={{ fontStyle: "italic", color: msg.includes("Erreur") || msg.includes("requis") ? "var(--terracotta)" : "var(--sage)", marginTop: 16 }}>
          {msg}
        </p>
      )}
    </>
  );
}
