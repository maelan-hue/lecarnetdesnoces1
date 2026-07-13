"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

type Guest = {
  id: string; firstName: string; lastName: string;
  address: string | null; diet: string | null;
  presence: "PRESENT" | "ABSENT" | "PENDING"; notes: string | null;
  presenceMoments: string[];
};

type ParsedRow = {
  firstName: string; lastName: string;
  address?: string; diet?: string; presenceMoments?: string[];
  isDuplicate: boolean; include: boolean;
};

const PRESENCE_LABEL: Record<string, string> = { PRESENT: "Présent·e", ABSENT: "Absent·e", PENDING: "En attente" };
const PRESENCE_CLASS: Record<string, string> = { PRESENT: "present", ABSENT: "absent",   PENDING: "pending" };
const DIET_OPTIONS = ["Aucun (standard)", "Végétarien", "Végétalien / Vegan", "Sans gluten", "Sans lactose", "Halal", "Casher", "Allergie (préciser en commentaire)", "Enfant (menu enfant)"];

const PRESENCE_MOMENTS = [
  { key: "CEREMONIE",   label: "Cérémonie" },
  { key: "VIN_HONNEUR", label: "Vin d'honneur" },
  { key: "REPAS",       label: "Repas" },
  { key: "SOIREE",      label: "Soirée" },
  { key: "BRUNCH",      label: "Brunch" },
];
const ALL_MOMENT_KEYS = PRESENCE_MOMENTS.map((m) => m.key);
const MOMENT_LABEL: Record<string, string> = Object.fromEntries(PRESENCE_MOMENTS.map((m) => [m.key, m.label]));

const QUICK_PRESENCE_OPTIONS = [
  { key: "ALL_DAY",     label: "Toute la journée", moments: ALL_MOMENT_KEYS },
  { key: "CEREMONIE",   label: "Cérémonie",        moments: ["CEREMONIE"] },
  { key: "VIN_HONNEUR", label: "Vin d'honneur",    moments: ["VIN_HONNEUR"] },
  { key: "BRUNCH",      label: "Brunch",           moments: ["BRUNCH"] },
];

function momentsSummary(moments: string[]): string {
  if (moments.length === 0) return "";
  if (moments.length === ALL_MOMENT_KEYS.length) return "Toute la journée";
  return moments.map((k) => MOMENT_LABEL[k] ?? k).join(", ");
}

function parseMomentsCell(raw: string): string[] {
  const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const tokens = raw.split(/[,;]/).map(norm).filter(Boolean);
  const found = new Set<string>();
  for (const t of tokens) {
    if (t.includes("toute") && t.includes("journee")) { ALL_MOMENT_KEYS.forEach((k) => found.add(k)); continue; }
    const match = PRESENCE_MOMENTS.find((m) => norm(m.label) === t || norm(m.label).includes(t) || t.includes(norm(m.label)));
    if (match) found.add(match.key);
  }
  return Array.from(found);
}

function normKey(firstName: string, lastName: string) {
  return (firstName + " " + lastName).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parsePastedNames(text: string, existing: Guest[]): ParsedRow[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const seen = new Set(existing.map((g) => normKey(g.firstName, g.lastName)));
  const seenInBatch = new Set<string>();
  return lines.map((line) => {
    const parts = line.split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName  = parts.slice(1).join(" ");
    const key = normKey(firstName, lastName);
    const isDuplicate = seen.has(key) || seenInBatch.has(key);
    seenInBatch.add(key);
    return { firstName, lastName, isDuplicate, include: true };
  });
}

function parseCSVText(text: string): string[][] {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delimiter) { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some((f) => f.trim() !== "")) rows.push(row);
        row = [];
      } else field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parseCSVGuests(text: string, existing: Guest[]): { rows: ParsedRow[]; error?: string } {
  const rows = parseCSVText(text);
  if (rows.length < 2) return { rows: [], error: "Fichier vide ou sans ligne de données." };

  const header = rows[0].map(normalizeHeader);
  const dataRows = rows.slice(1);
  const findCol = (...names: string[]) => header.findIndex((h) => names.includes(h));

  const idxFirst = findCol("prenom", "prénom", "firstname", "first name");
  const idxLast  = findCol("nom", "lastname", "last name");
  if (idxFirst === -1 || idxLast === -1) {
    return { rows: [], error: "Colonnes «Prénom» et «Nom» introuvables dans le fichier." };
  }
  const idxAddr    = findCol("adresse", "address");
  const idxDiet    = findCol("regime", "régime", "diet", "regime alimentaire", "régime alimentaire");
  const idxMoments = findCol("presence", "présence", "moments", "creneaux", "créneaux");

  const seen = new Set(existing.map((g) => normKey(g.firstName, g.lastName)));
  const seenInBatch = new Set<string>();

  const parsed = dataRows.map((cols): ParsedRow => {
    const firstName = (cols[idxFirst] ?? "").trim();
    const lastName  = (cols[idxLast]  ?? "").trim();
    const address   = idxAddr    >= 0 ? (cols[idxAddr]    ?? "").trim() || undefined : undefined;
    const diet      = idxDiet    >= 0 ? (cols[idxDiet]    ?? "").trim() || undefined : undefined;
    const presenceMoments = idxMoments >= 0 ? parseMomentsCell(cols[idxMoments] ?? "") : undefined;
    const key = normKey(firstName, lastName);
    const isDuplicate = seen.has(key) || seenInBatch.has(key);
    seenInBatch.add(key);
    return { firstName, lastName, address, diet, presenceMoments, isDuplicate, include: true };
  }).filter((r) => r.firstName || r.lastName);

  return { rows: parsed };
}

export default function InvitesPage() {
  const [guests,  setGuests]  = useState<Guest[]>([]);
  const [filter,  setFilter]  = useState("ALL");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ firstName: "", lastName: "", quickPresence: "" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const firstNameRef = useRef<HTMLInputElement>(null);

  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showImport, setShowImport] = useState(false);

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
    const presenceMoments = QUICK_PRESENCE_OPTIONS.find((o) => o.key === form.quickPresence)?.moments ?? [];
    const res = await fetch("/api/couple/guests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName, lastName: form.lastName,
        presenceMoments,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ firstName: "", lastName: "", quickPresence: form.quickPresence });
      firstNameRef.current?.focus();
      load();
    } else {
      const j = await res.json();
      setError(j.error ?? "Erreur");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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
    total:   guests.filter((g) => g.presence === "PRESENT").length,
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
          <div className="guest-stat-lbl">Présents confirmés</div>
        </div>
        <div className="guest-stat">
          <div className="guest-stat-n" style={{ color: "var(--gold)" }}>{stats.pending}</div>
          <div className="guest-stat-lbl">En attente</div>
        </div>
        <div className="guest-stat">
          <div className="guest-stat-n" style={{ color: "var(--terracotta)" }}>{stats.absent}</div>
          <div className="guest-stat-lbl">Absents</div>
        </div>
        <div className="guest-stat">
          <div className="guest-stat-n" style={{ color: "var(--mute)" }}>{guests.length}</div>
          <div className="guest-stat-lbl">Dans la liste</div>
        </div>
      </div>

      <div className="tip">🌿 <strong>Bon à savoir —</strong> Pensez à demander les régimes alimentaires au moment de l&apos;invitation — votre traiteur en aura besoin 2 mois avant le mariage. Cliquez sur un invité dans la liste pour compléter adresse, régime ou commentaire.</div>

      {/* Ajout rapide */}
      <div className="guest-add-form">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div>
            <h3>Ajout <em>rapide</em></h3>
            <p className="guest-add-form-sub">Prénom, nom, présence — le reste se complète plus tard.</p>
          </div>
          <button type="button" className="btn ghost small" onClick={() => setShowImport(true)}>
            Importer plusieurs invités
          </button>
        </div>
        <form onSubmit={handleAdd}>
          <div className="guest-quick-row">
            <div>
              <label className="field-label">Prénom</label>
              <input ref={firstNameRef} className="input" placeholder="Marie" autoFocus
                value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Nom</label>
              <input className="input" placeholder="Dupont" value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Présence</label>
              <select className="input" value={form.quickPresence} onChange={(e) => setForm((f) => ({ ...f, quickPresence: e.target.value }))}>
                <option value="">—</option>
                {QUICK_PRESENCE_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <button className="btn gold" type="submit" disabled={saving}>{saving ? "Ajout…" : "Ajouter à la liste"}</button>
          </div>
          {error && <p style={{ color: "var(--terracotta)", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", marginTop: 10 }}>{error}</p>}
        </form>
      </div>

      {/* Filtres */}
      <h2 className="section-title">Liste complète</h2>
      <div className="guest-filters">
        {[
          { key: "ALL",     label: `Tous (${guests.length})` },
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
            <div key={g.id} className="guest-row clickable" onClick={() => setEditingGuest(g)}>
              <div>
                <div className="guest-name">
                  {g.firstName} {g.lastName}
                  {g.presenceMoments.length > 0 && <span className="moment-tag">{momentsSummary(g.presenceMoments)}</span>}
                </div>
                {g.notes && <div className="guest-address">{g.notes}</div>}
              </div>
              <div className="guest-address">{g.address || "—"}</div>
              <div>{g.diet ? <span className="diet-tag">{g.diet}</span> : "—"}</div>
              <div><span className={`presence-badge ${PRESENCE_CLASS[g.presence]}`}>{PRESENCE_LABEL[g.presence]}</span></div>
              <div><button className="guest-row-action" onClick={(e) => handleDelete(e, g.id)}>✕</button></div>
            </div>
          ))}
        </div>
      )}

      {stats.total > 0 && (
        <div style={{ marginTop: 20, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", color: "var(--mute)", fontSize: "0.9rem" }}>
          {filtered.length} invité{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
        </div>
      )}

      {editingGuest && (
        <GuestEditModal
          guest={editingGuest}
          onClose={() => setEditingGuest(null)}
          onSaved={(updated) => {
            setGuests((gs) => gs.map((g) => (g.id === updated.id ? updated : g)));
            setEditingGuest(null);
          }}
        />
      )}

      {showImport && (
        <GuestImportModal
          existing={guests}
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); load(); }}
        />
      )}

    </div>
  );
}

// ── Modale d'édition (enrichissement différé) ────────────────────────────────

function GuestEditModal({ guest, onClose, onSaved }: {
  guest: Guest;
  onClose: () => void;
  onSaved: (g: Guest) => void;
}) {
  const [form, setForm] = useState({
    firstName: guest.firstName, lastName: guest.lastName,
    address: guest.address ?? "", diet: guest.diet ?? "Aucun (standard)",
    presence: guest.presence, notes: guest.notes ?? "",
    presenceMoments: guest.presenceMoments ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleMoment = (key: string) => setForm((f) => ({
    ...f,
    presenceMoments: f.presenceMoments.includes(key)
      ? f.presenceMoments.filter((k) => k !== key)
      : [...f.presenceMoments, key],
  }));

  const allDayChecked = form.presenceMoments.length === ALL_MOMENT_KEYS.length;
  const toggleAllDay = () => setForm((f) => ({
    ...f,
    presenceMoments: allDayChecked ? [] : ALL_MOMENT_KEYS,
  }));

  const handleSave = async () => {
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) { setError("Prénom et nom obligatoires."); return; }
    setSaving(true);
    const res = await fetch(`/api/couple/guests/${guest.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        address: form.address.trim() || null,
        diet: form.diet === "Aucun (standard)" ? null : form.diet,
        presence: form.presence, notes: form.notes.trim() || null,
        presenceMoments: form.presenceMoments,
      }),
    });
    setSaving(false);
    if (res.ok) onSaved(await res.json());
    else { const j = await res.json(); setError(j.error ?? "Erreur"); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Modifier <em>l&apos;invité</em></h3>
        <div className="guest-form-row">
          <div><label className="field-label">Prénom</label><input className="input" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} /></div>
          <div><label className="field-label">Nom</label><input className="input" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} /></div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label className="field-label">Présence (moments)</label>
          <div className="moment-checkboxes">
            <label className="moment-checkbox all-day">
              <input type="checkbox" checked={allDayChecked} onChange={toggleAllDay} />
              Toute la journée
            </label>
            {PRESENCE_MOMENTS.map((m) => (
              <label key={m.key} className="moment-checkbox">
                <input type="checkbox" checked={form.presenceMoments.includes(m.key)} onChange={() => toggleMoment(m.key)} />
                {m.label}
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="field-label">Adresse postale</label>
          <input className="input" placeholder="12 rue des Lilas, 66000 Perpignan" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
        <div className="guest-form-row">
          <div>
            <label className="field-label">Régime alimentaire</label>
            <select className="input" value={form.diet} onChange={(e) => setForm((f) => ({ ...f, diet: e.target.value }))}>
              {DIET_OPTIONS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Présence</label>
            <select className="input" value={form.presence} onChange={(e) => setForm((f) => ({ ...f, presence: e.target.value as Guest["presence"] }))}>
              <option value="PENDING">En attente de réponse</option>
              <option value="PRESENT">Présent·e confirmé·e</option>
              <option value="ABSENT">Absent·e</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="field-label">Commentaire (optionnel)</label>
          <input className="input" placeholder="Ex : Allergie aux arachides · Table avec ses parents" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
        {error && <p style={{ color: "var(--terracotta)", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", marginBottom: 12 }}>{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Annuler</button>
          <button type="button" className="btn gold" onClick={handleSave} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Modale d'import en masse ─────────────────────────────────────────────────

function GuestImportModal({ existing, onClose, onImported }: {
  existing: Guest[];
  onClose: () => void;
  onImported: () => void;
}) {
  const [method, setMethod] = useState<"paste" | "csv">("paste");
  const [pasteText, setPasteText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleParsePaste = () => {
    setParseError("");
    const parsed = parsePastedNames(pasteText, existing);
    if (parsed.length === 0) { setParseError("Aucun nom détecté."); setRows([]); return; }
    setRows(parsed);
  };

  const handleFile = async (file: File) => {
    setParseError("");
    const text = await file.text();
    const { rows: parsed, error } = parseCSVGuests(text, existing);
    if (error) { setParseError(error); setRows([]); return; }
    if (parsed.length === 0) { setParseError("Aucun invité détecté dans le fichier."); return; }
    setRows(parsed);
  };

  const toggleRow = (i: number) => setRows((rs) => rs.map((r, idx) => idx === i ? { ...r, include: !r.include } : r));

  const handleConfirm = async () => {
    const toImport = rows.filter((r) => r.include && r.firstName.trim() && r.lastName.trim());
    if (toImport.length === 0) return;
    setImporting(true);
    const res = await fetch("/api/couple/guests/bulk", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guests: toImport }),
    });
    setImporting(false);
    if (res.ok) {
      const j = await res.json();
      setSummary(`${j.count} invité${j.count > 1 ? "s" : ""} ajouté${j.count > 1 ? "s" : ""}`);
      setRows([]);
    } else {
      const j = await res.json();
      setParseError(j.error ?? "Erreur pendant l'import.");
    }
  };

  const duplicateCount = rows.filter((r) => r.isDuplicate).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <h3>Importer plusieurs <em>invités</em></h3>

        {summary ? (
          <>
            <p className="serif" style={{ fontStyle: "italic", color: "var(--ok)", fontSize: "1.1rem", margin: "20px 0" }}>✓ {summary}</p>
            <div className="modal-actions">
              <button type="button" className="btn gold" onClick={onImported}>Fermer et actualiser</button>
            </div>
          </>
        ) : (
          <>
            <div className="import-method-tabs">
              <button type="button" className={`import-tab${method === "paste" ? " active" : ""}`} onClick={() => { setMethod("paste"); setRows([]); setParseError(""); }}>Coller une liste</button>
              <button type="button" className={`import-tab${method === "csv" ? " active" : ""}`} onClick={() => { setMethod("csv"); setRows([]); setParseError(""); }}>Fichier CSV</button>
            </div>

            {method === "paste" ? (
              <>
                <p className="guest-add-form-sub" style={{ marginBottom: 10 }}>Un invité par ligne — &laquo;Prénom Nom&raquo;.</p>
                <textarea
                  className="input import-textarea"
                  placeholder={"Marie Dupont\nJean Martin\nSophie Bernard"}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <button type="button" className="btn ghost small" style={{ marginTop: 10 }} onClick={handleParsePaste}>Analyser la liste</button>
              </>
            ) : (
              <>
                <p className="guest-add-form-sub" style={{ marginBottom: 10 }}>
                  Colonnes reconnues : Prénom, Nom (obligatoires), Adresse, Régime, Présence (optionnelles — «Toute la journée», «Cérémonie», «Vin d'honneur», «Repas», «Soirée», «Brunch», séparés par une virgule). Exportez votre fichier Excel en CSV avant import.
                </p>
                <input
                  type="file" accept=".csv,text/csv"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </>
            )}

            {parseError && <p style={{ color: "var(--terracotta)", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", marginTop: 12 }}>{parseError}</p>}

            {rows.length > 0 && (
              <>
                <p className="serif" style={{ fontStyle: "italic", color: "var(--gold)", margin: "18px 0 10px" }}>
                  {rows.length} invité{rows.length > 1 ? "s" : ""} détecté{rows.length > 1 ? "s" : ""}
                  {duplicateCount > 0 && ` · ${duplicateCount} doublon${duplicateCount > 1 ? "s" : ""} possible${duplicateCount > 1 ? "s" : ""}`}
                </p>
                <div className="import-preview">
                  {rows.map((r, i) => (
                    <label key={i} className={`import-preview-row${r.isDuplicate ? " duplicate" : ""}`}>
                      <input type="checkbox" checked={r.include} onChange={() => toggleRow(i)} />
                      <span>{r.firstName} {r.lastName}</span>
                      {r.presenceMoments && r.presenceMoments.length > 0 && <span className="moment-tag">{momentsSummary(r.presenceMoments)}</span>}
                      {r.isDuplicate && <span className="duplicate-flag">Doublon ?</span>}
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={onClose}>Annuler</button>
              <button type="button" className="btn gold" onClick={handleConfirm} disabled={importing || rows.filter((r) => r.include).length === 0}>
                {importing ? "Import…" : `Importer ${rows.filter((r) => r.include).length || ""}`.trim()}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
