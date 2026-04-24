"use client";

import { useState, useEffect } from "react";

type Field = { key: string; label: string; type?: string; placeholder?: string };

type Props = {
  apiUrl:   string;
  fields:   Field[];
  title?:   string;
};

export default function AccountForm({ apiUrl, fields, title = "Mon compte" }: Props) {
  const [values,  setValues]  = useState<Record<string, string>>({});
  const [current, setCurrent] = useState("");   // mot de passe actuel
  const [newPwd,  setNewPwd]  = useState("");   // nouveau mot de passe
  const [confirm, setConfirm] = useState("");   // confirmation
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch(apiUrl)
      .then((r) => r.json())
      .then((d) => {
        const init: Record<string, string> = {};
        fields.forEach(({ key }) => { init[key] = d[key] ?? ""; });
        setValues(init);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const handleSave = async () => {
    setMsg(null);

    if (newPwd && newPwd !== confirm) {
      setMsg({ text: "Les mots de passe ne correspondent pas.", ok: false });
      return;
    }

    setSaving(true);
    const body: Record<string, string> = { ...values };
    if (newPwd) { body.currentPassword = current; body.newPassword = newPwd; }

    const res  = await fetch(apiUrl, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);

    if (res.ok) {
      setMsg({ text: "Modifications enregistrées.", ok: true });
      setCurrent(""); setNewPwd(""); setConfirm("");
    } else {
      setMsg({ text: json.error ?? "Erreur.", ok: false });
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 className="section-title" style={{ marginBottom: 24 }}>{title}</h2>

      {/* Informations */}
      <div className="form-section">
        <h3>Informations personnelles</h3>
        {fields.map(({ key, label, type = "text", placeholder }) => (
          <div key={key}>
            <label className="field-label">{label}</label>
            <input
              className="input"
              type={type}
              placeholder={placeholder}
              value={values[key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      {/* Mot de passe */}
      <div className="form-section">
        <h3>Changer le mot de passe</h3>
        <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", fontSize: "0.9rem", marginBottom: 18 }}>
          Laissez vide si vous ne souhaitez pas changer votre mot de passe.
        </p>
        <label className="field-label">Mot de passe actuel</label>
        <input className="input" type="password" placeholder="••••••••" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <label className="field-label">Nouveau mot de passe</label>
        <input className="input" type="password" placeholder="8 caractères minimum" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
        <label className="field-label">Confirmer le nouveau mot de passe</label>
        <input className="input" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>

      {msg && (
        <p className="serif" style={{ fontStyle: "italic", marginBottom: 16, color: msg.ok ? "var(--sage)" : "var(--terracotta)" }}>
          {msg.ok ? "✓ " : ""}{msg.text}
        </p>
      )}

      <button className="btn gold" onClick={handleSave} disabled={saving}>
        {saving ? "Sauvegarde…" : "Enregistrer les modifications"}
      </button>
    </div>
  );
}
