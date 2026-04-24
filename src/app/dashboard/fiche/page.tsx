"use client";
import { useState, useEffect, useRef } from "react";

const AMBIANCES = ["champetre","classique","boheme","moderne","intimiste","mediterraneen"];
const AMBIANCE_LABELS: Record<string,string> = { champetre:"Champêtre", classique:"Classique chic", boheme:"Bohème", moderne:"Moderne", intimiste:"Intimiste", mediterraneen:"Méditerranéen" };

export default function FichePage() {
  const [form, setForm]           = useState({ name:"", tagline:"", bio:"", ambiances:[] as string[], styleKeywords:"", city:"", department:"", radiusKm:80 });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/pro/fiche").then((r) => r.json()).then((d) => {
      if (d.pro) {
        setForm({ name: d.pro.name, tagline: d.pro.tagline??'', bio: d.pro.bio??'', ambiances: d.pro.ambiances??[], styleKeywords: (d.pro.styleKeywords??[]).join(", "), city: d.pro.city??'', department: d.pro.department??'', radiusKm: d.pro.radiusKm??80 });
        setProfilePhoto(d.pro.profilePhoto ?? null);
      }
    });
  }, []);

  const toggleAmbiance = (key: string) => setForm((f) => ({ ...f, ambiances: f.ambiances.includes(key) ? f.ambiances.filter((a) => a !== key) : [...f.ambiances, key] }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(""); setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/pro/photo", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (res.ok) setProfilePhoto(json.url);
    else setUploadError(json.error ?? "Erreur lors de l'upload.");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handlePhotoDelete = async () => {
    if (!confirm("Supprimer la photo de profil ?")) return;
    await fetch("/api/pro/photo", { method: "DELETE" });
    setProfilePhoto(null);
  };

  const handleSave = async () => {
    setSaving(true); setMsg("");
    const res = await fetch("/api/pro/fiche", { method: "PATCH", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ ...form, styleKeywords: form.styleKeywords.split(",").map((s) => s.trim()).filter(Boolean) }) });
    setSaving(false);
    setMsg(res.ok ? "Fiche sauvegardée." : "Erreur lors de la sauvegarde.");
  };

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Ce que les couples voient de vous</div>
        <h1 className="page-title">Ma <em>fiche publique</em></h1>
        <p className="page-sub">Soignez votre écrin — c&apos;est la première impression qui compte.</p>
      </div>

      {/* ── Photo de profil ── */}
      <div className="form-section">
        <h3>Photo de profil / Logo</h3>
        <div style={{ display:"flex", alignItems:"center", gap:24, marginBottom:8 }}>
          {/* Aperçu */}
          {profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profilePhoto} alt="Photo de profil" style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"2px solid var(--bone)" }} />
          ) : (
            <div style={{ width:80, height:80, borderRadius:"50%", background:"var(--linen)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.8rem", color:"var(--taupe)", flexShrink:0 }}>
              {form.name ? form.name.split(/\s+/).map((w) => w[0]).slice(0,2).join("").toUpperCase() : "?"}
            </div>
          )}
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <button className="btn ghost small" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "Envoi…" : profilePhoto ? "Changer la photo" : "Ajouter une photo"}
              </button>
              {profilePhoto && (
                <button className="btn ghost small" onClick={handlePhotoDelete} style={{ borderColor:"var(--terracotta)", color:"var(--terracotta)" }}>Supprimer</button>
              )}
            </div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.82rem", color:"var(--mute)" }}>
              JPG, PNG ou WebP · 5 Mo max · format carré recommandé
            </p>
            {uploadError && <p style={{ color:"var(--terracotta)", fontSize:"0.82rem", marginTop:4 }}>{uploadError}</p>}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhotoUpload} />
      </div>

      <div className="form-section">
        <h3>Identité</h3>
        <label className="field-label">Nom de l&apos;atelier</label>
        <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <label className="field-label">Tagline (une phrase)</label>
        <input className="input" placeholder="Reportage sensible · lumière naturelle…" value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
        <label className="field-label">Bio</label>
        <textarea className="textarea" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
      </div>

      <div className="form-section">
        <h3>Ambiances &amp; style</h3>
        <label className="field-label">Vos ambiances</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
          {AMBIANCES.map((a) => <button key={a} type="button" className={`chip${form.ambiances.includes(a)?" active":""}`} onClick={() => toggleAmbiance(a)}>{AMBIANCE_LABELS[a]}</button>)}
        </div>
        <label className="field-label">Mots-clés de votre style (séparés par des virgules)</label>
        <input className="input" placeholder="lumière naturelle, argentique, reportage…" value={form.styleKeywords} onChange={(e) => setForm((f) => ({ ...f, styleKeywords: e.target.value }))} />
      </div>

      <div className="form-section">
        <h3>Zone d&apos;intervention</h3>
        <label className="field-label">Ville</label>
        <input className="input" placeholder="Perpignan" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
        <label className="field-label">Département principal</label>
        <input className="input" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
        <label className="field-label">Rayon d&apos;intervention : {form.radiusKm} km</label>
        <input type="range" min={10} max={500} value={form.radiusKm} onChange={(e) => setForm((f) => ({ ...f, radiusKm: Number(e.target.value) }))} style={{ width:"100%", marginBottom:18 }} />
      </div>

      {msg && <p className="serif" style={{ fontStyle:"italic", color: msg.includes("Erreur") ? "var(--terracotta)" : "var(--sage)", marginBottom:16 }}>{msg}</p>}
      <button className="btn gold" onClick={handleSave} disabled={saving}>{saving ? "Sauvegarde…" : "Enregistrer ma fiche"}</button>
    </>
  );
}
