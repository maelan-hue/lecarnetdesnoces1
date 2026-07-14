"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PRO_CATEGORIES } from "@/lib/utils";

type Pro = { id:string; name:string; email:string; category:string; department:string|null; status:string; createdAt:string; profilePhoto:string|null };
type ValidationResult = { proName:string; proEmail:string; tmpPassword:string; emailSent:boolean };

const STATUS_LABEL: Record<string,string> = { PENDING:"En attente", ACTIVE:"Actif", SUSPENDED:"Suspendu" };
const STATUS_COLOR: Record<string,string> = { PENDING:"var(--gold)", ACTIVE:"var(--sage)", SUSPENDED:"var(--terracotta)" };

// Catégories réellement supportées en base (le map PRO_CATEGORIES contient des entrées d'affichage
// héritées — ROBE / COSTUME — qui n'existent pas dans l'enum Prisma ProCategory)
const IMPORT_CATEGORIES = [
  "LIEU", "PHOTOGRAPHE", "VIDEASTE", "TRAITEUR", "FLEURISTE", "DJ_MUSICIEN", "OFFICIANT",
  "COIFFURE_MAQUILLAGE", "DECORATION_PAPETERIE", "WEDDING_PLANNER", "VINS_CHAMPAGNE",
  "VOITURE_TRANSPORT", "ROBE_COSTUME", "PHOTOBOOTH", "ONGLES_MANUCURE", "GOODIES_INVITES",
  "SOINS_PRE_MARIAGE", "AUTRE",
];

type ParsedProRow = {
  name: string; city?: string; department?: string; phone?: string;
  email?: string; tagline?: string; bio?: string; priceFrom?: number;
  isDuplicate: boolean; include: boolean;
};

function normKey(s: string) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

function parseCSVPros(text: string, existing: Pro[]): { rows: ParsedProRow[]; error?: string } {
  const rows = parseCSVText(text);
  if (rows.length < 2) return { rows: [], error: "Fichier vide ou sans ligne de données." };

  const header = rows[0].map(normKey);
  const dataRows = rows.slice(1);
  const findCol = (...names: string[]) => header.findIndex((h) => names.includes(h));

  const idxName  = findCol("nom", "name");
  if (idxName === -1) return { rows: [], error: "Colonne «Nom» introuvable dans le fichier." };
  const idxCity  = findCol("ville", "city");
  const idxDept  = findCol("departement", "département", "department");
  const idxPhone = findCol("telephone", "téléphone", "tel", "phone");
  const idxEmail = findCol("email", "mail");
  const idxTag   = findCol("accroche", "tagline");
  const idxBio   = findCol("description", "bio");
  const idxPrice = findCol("prix", "prix a partir de", "prix à partir de", "tarif", "pricefrom");

  const seenNames = new Set(existing.map((p) => normKey(p.name)));
  const seenEmails = new Set(existing.map((p) => p.email.toLowerCase()));
  const seenInBatch = new Set<string>();

  const parsed = dataRows.map((cols): ParsedProRow => {
    const name  = (cols[idxName] ?? "").trim();
    const email = idxEmail >= 0 ? (cols[idxEmail] ?? "").trim() || undefined : undefined;
    const key = normKey(name);
    const isDuplicate = seenNames.has(key) || seenInBatch.has(key) || (!!email && seenEmails.has(email.toLowerCase()));
    seenInBatch.add(key);
    const priceRaw = idxPrice >= 0 ? (cols[idxPrice] ?? "").replace(/[^\d.,]/g, "").replace(",", ".") : "";
    return {
      name, email,
      city:       idxCity  >= 0 ? (cols[idxCity]  ?? "").trim() || undefined : undefined,
      department: idxDept  >= 0 ? (cols[idxDept]  ?? "").trim() || undefined : undefined,
      phone:      idxPhone >= 0 ? (cols[idxPhone] ?? "").trim() || undefined : undefined,
      tagline:    idxTag   >= 0 ? (cols[idxTag]   ?? "").trim() || undefined : undefined,
      bio:        idxBio   >= 0 ? (cols[idxBio]   ?? "").trim() || undefined : undefined,
      priceFrom:  priceRaw ? Number(priceRaw) : undefined,
      isDuplicate, include: true,
    };
  }).filter((r) => r.name);

  return { rows: parsed };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [pros,       setPros]       = useState<Pro[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("ALL");
  const [validated,  setValidated]  = useState<ValidationResult | null>(null);
  const [error,      setError]      = useState("");
  const [showImport, setShowImport] = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/pros");
    if (res.status === 401) { router.push("/admin/connexion"); return; }
    if (res.ok) setPros(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const action = async (id: string, act: string) => {
    setValidated(null); setError("");
    const res  = await fetch("/api/admin/pros", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id, action: act }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Erreur."); return; }
    if (act === "validate") setValidated(json);
    load();
  };

  const filtered  = filter === "ALL" ? pros : pros.filter((p) => p.status === filter);
  const nbPending = pros.filter((p) => p.status === "PENDING").length;

  const logout = async () => {
    await fetch("/api/auth/logout", { method:"POST" });
    router.push("/");
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--paper)" }}>
      <nav style={{ background:"var(--ink)", padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", color:"var(--paper)", fontSize:"1.1rem" }}>
          Le Carnet <em style={{ color:"var(--gold)" }}>— Admin</em>
        </div>
        <button onClick={logout} className="btn ghost small" style={{ fontSize:"0.58rem", borderColor:"rgba(250,248,244,0.2)", color:"rgba(250,248,244,0.6)" }}>Déconnexion</button>
      </nav>

      <div className="container">
        <div className="page-head" style={{ marginTop:40, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16 }}>
          <div>
            <div className="eyebrow">Gestion des prestataires</div>
            <h1 className="page-title">Tableau <em>de bord</em></h1>
            {nbPending > 0 && <p className="page-sub" style={{ color:"var(--terracotta)" }}>{nbPending} inscription(s) en attente de validation.</p>}
          </div>
          <button className="btn ghost small" onClick={() => setShowImport(true)}>Importer des prestataires</button>
        </div>

        {showImport && (
          <ImportProsModal
            existing={pros}
            onClose={() => setShowImport(false)}
            onImported={() => { setShowImport(false); load(); }}
          />
        )}

        {editingId && (
          <AdminProEditModal
            proId={editingId}
            onClose={() => setEditingId(null)}
            onSaved={() => { setEditingId(null); load(); }}
          />
        )}

        {/* Résultat validation */}
        {validated && (
          <div style={{ background:"rgba(122,139,110,0.08)", border:"1px solid rgba(122,139,110,0.3)", borderLeft:"3px solid var(--sage)", padding:"24px 28px", marginBottom:28 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:500, marginBottom:8, color:"var(--ink)" }}>
              ✓ {validated.proName} est maintenant actif
            </div>
            <div style={{ marginBottom:12, fontSize:"0.88rem", color:"var(--mute)" }}>
              {validated.emailSent
                ? `Un email avec les identifiants a été envoyé à ${validated.proEmail}.`
                : `L'envoi d'email a échoué (clé Resend non configurée). Transmettez les identifiants manuellement.`}
            </div>
            <div style={{ background:"var(--ivory)", border:"1px solid var(--bone)", padding:"16px 20px", display:"inline-block", minWidth:320 }}>
              <div style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--gold)", marginBottom:10, fontWeight:500 }}>Identifiants de connexion</div>
              <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"6px 16px", fontSize:"0.9rem" }}>
                <span style={{ color:"var(--mute)" }}>URL</span>
                <span style={{ fontFamily:"monospace" }}>/connexion-pro</span>
                <span style={{ color:"var(--mute)" }}>Email</span>
                <span style={{ fontFamily:"monospace" }}>{validated.proEmail}</span>
                <span style={{ color:"var(--mute)" }}>Mot de passe</span>
                <span style={{ fontFamily:"monospace", fontWeight:600, color:"var(--gold)", fontSize:"1.05rem", letterSpacing:"0.05em" }}>{validated.tmpPassword}</span>
              </div>
            </div>
            <div style={{ marginTop:12, fontSize:"0.78rem", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)" }}>
              Le prestataire devra changer son mot de passe après sa première connexion.
            </div>
            <button style={{ marginTop:14, background:"none", border:"none", color:"var(--mute)", cursor:"pointer", fontSize:"0.75rem", textDecoration:"underline" }} onClick={() => setValidated(null)}>Fermer</button>
          </div>
        )}

        {error && (
          <div style={{ background:"rgba(176,96,74,0.08)", border:"1px solid rgba(176,96,74,0.3)", padding:"14px 18px", marginBottom:20, color:"var(--terracotta)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" }}>
            {error}
          </div>
        )}

        {/* Filtres */}
        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
          {[["ALL","Tous"], ["PENDING","En attente"], ["ACTIVE","Actifs"], ["SUSPENDED","Suspendus"]].map(([k,l]) => (
            <button key={k} className={`chip${filter===k?" active":""}`} onClick={() => setFilter(k)}>
              {l} ({k==="ALL" ? pros.length : pros.filter((p) => p.status===k).length})
            </button>
          ))}
        </div>

        {loading ? (
          <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Chargement…</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map((pro) => (
              <div key={pro.id} style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"20px 24px", display:"grid", gridTemplateColumns:"auto 1fr auto", gap:20, alignItems:"center" }}>
                <AdminProPhoto pro={pro} onUpdated={(url) => setPros((ps) => ps.map((p) => p.id === pro.id ? { ...p, profilePhoto: url } : p))} />
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", fontWeight:500, marginBottom:3 }}>{pro.name}</div>
                  <div style={{ fontSize:"0.8rem", color:"var(--mute)" }}>
                    {PRO_CATEGORIES[pro.category] ?? pro.category} · {pro.department ?? "—"} · {pro.email}
                  </div>
                  <div style={{ fontSize:"0.72rem", color:"var(--taupe)", marginTop:4 }}>
                    Inscrit le {new Date(pro.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
                  <span style={{ fontSize:"0.6rem", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:500, color: STATUS_COLOR[pro.status] }}>
                    {STATUS_LABEL[pro.status]}
                  </span>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
                    <button className="btn ghost small" onClick={() => setEditingId(pro.id)}>Modifier</button>
                    {pro.status === "PENDING"   && <button className="btn gold small"  onClick={() => action(pro.id, "validate")}>Valider &amp; générer les accès</button>}
                    {pro.status === "ACTIVE"    && <button className="btn ghost small" onClick={() => action(pro.id, "suspend")} style={{ borderColor:"var(--terracotta)", color:"var(--terracotta)" }}>Suspendre</button>}
                    {pro.status === "SUSPENDED" && <button className="btn ghost small" onClick={() => action(pro.id, "validate")}>Réactiver</button>}
                    <button className="btn ghost small" onClick={() => { if(confirm("Supprimer définitivement ?")) action(pro.id, "delete"); }} style={{ borderColor:"var(--terracotta)", color:"var(--terracotta)" }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", padding:"30px 0" }}>Aucun prestataire dans cette catégorie.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Photo de profil (upload admin, identique au flux prestataire) ───────────

function AdminProPhoto({ pro, onUpdated }: { pro: Pro; onUpdated: (url: string | null) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch(`/api/admin/pros/${pro.id}/photo`, { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (res.ok) onUpdated(json.url);
    else alert(json.error ?? "Erreur lors de l'envoi de la photo.");
  };

  const handleDelete = async () => {
    await fetch(`/api/admin/pros/${pro.id}/photo`, { method: "DELETE" });
    onUpdated(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, width:64 }}>
      {pro.profilePhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pro.profilePhoto} alt={pro.name} style={{ width:56, height:56, borderRadius:"50%", objectFit:"cover", border:"2px solid var(--bone)" }} />
      ) : (
        <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--linen)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.1rem", color:"var(--taupe)" }}>
          {pro.name[0]}
        </div>
      )}
      <button
        className="btn ghost small"
        style={{ padding:"3px 8px", fontSize:"0.5rem" }}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "…" : pro.profilePhoto ? "Changer" : "Ajouter"}
      </button>
      {pro.profilePhoto && (
        <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.55rem", color:"var(--terracotta)", textDecoration:"underline" }} onClick={handleDelete}>
          Retirer
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleUpload} />
    </div>
  );
}

// ── Modale d'édition complète d'un prestataire ───────────────────────────────

type ProDetail = {
  id: string; name: string; email: string; phone: string | null; category: string;
  city: string | null; department: string | null; tagline: string | null; bio: string | null;
  status: string; tarifs: { id: string; priceFrom: number }[];
};

function AdminProEditModal({ proId, onClose, onSaved }: {
  proId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [detail,  setDetail]  = useState<ProDetail | null>(null);
  const [form,    setForm]    = useState({
    name: "", email: "", phone: "", category: "LIEU", city: "", department: "",
    tagline: "", bio: "", priceFrom: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`/api/admin/pros/${proId}`)
      .then((r) => r.json())
      .then((d: ProDetail) => {
        setDetail(d);
        setForm({
          name: d.name, email: d.email, phone: d.phone ?? "", category: d.category,
          city: d.city ?? "", department: d.department ?? "",
          tagline: d.tagline ?? "", bio: d.bio ?? "",
          priceFrom: d.tarifs[0] ? String(d.tarifs[0].priceFrom) : "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [proId]);

  const handleSave = async () => {
    setError("");
    if (!form.name.trim() || !form.email.trim()) { setError("Nom et email obligatoires."); return; }
    setSaving(true);
    const res = await fetch(`/api/admin/pros/${proId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, email: form.email, phone: form.phone || null,
        category: form.category, city: form.city || null, department: form.department || null,
        tagline: form.tagline || null, bio: form.bio || null,
        priceFrom: form.priceFrom === "" ? undefined : Number(form.priceFrom),
      }),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else { const j = await res.json(); setError(j.error ?? "Erreur"); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Modifier le <em>prestataire</em></h3>

        {loading ? (
          <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)" }}>Chargement…</p>
        ) : (
          <>
            <div className="guest-form-row">
              <div><label className="field-label">Nom</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="field-label">Catégorie</label>
                <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {IMPORT_CATEGORIES.map((c) => <option key={c} value={c}>{PRO_CATEGORIES[c] ?? c}</option>)}
                </select>
              </div>
            </div>
            <div className="guest-form-row">
              <div><label className="field-label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div><label className="field-label">Téléphone</label><input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="guest-form-row">
              <div><label className="field-label">Ville</label><input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
              <div><label className="field-label">Département</label><input className="input" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Accroche</label>
              <input className="input" value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Description</label>
              <textarea className="input" style={{ minHeight: 90, resize: "vertical" }} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
            </div>
            {detail && detail.tarifs.length > 1 ? (
              <p className="guest-add-form-sub" style={{ marginBottom: 18 }}>
                Plusieurs tarifs configurés — gérez la tarification détaillée depuis l&apos;espace prestataire.
              </p>
            ) : (
              <div style={{ marginBottom: 18 }}>
                <label className="field-label">Prix à partir de (€)</label>
                <input className="input" type="number" min={0} value={form.priceFrom} onChange={(e) => setForm((f) => ({ ...f, priceFrom: e.target.value }))} />
              </div>
            )}
            {error && <p style={{ color: "var(--terracotta)", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", marginBottom: 12 }}>{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={onClose}>Annuler</button>
              <button type="button" className="btn gold" onClick={handleSave} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Modale d'import en masse (CSV) ───────────────────────────────────────────

function ImportProsModal({ existing, onClose, onImported }: {
  existing: Pro[];
  onClose: () => void;
  onImported: () => void;
}) {
  const [category, setCategory] = useState("LIEU");
  const [rows, setRows] = useState<ParsedProRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setParseError("");
    const text = await file.text();
    const { rows: parsed, error } = parseCSVPros(text, existing);
    if (error) { setParseError(error); setRows([]); return; }
    if (parsed.length === 0) { setParseError("Aucun prestataire détecté dans le fichier."); return; }
    setRows(parsed);
  };

  const toggleRow = (i: number) => setRows((rs) => rs.map((r, idx) => idx === i ? { ...r, include: !r.include } : r));

  const handleConfirm = async () => {
    const toImport = rows.filter((r) => r.include && r.name.trim());
    if (toImport.length === 0) return;
    setImporting(true);
    const res = await fetch("/api/admin/pros/bulk", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pros: toImport, category }),
    });
    setImporting(false);
    if (res.ok) {
      const j = await res.json();
      setSummary(`${j.count} prestataire${j.count > 1 ? "s" : ""} importé${j.count > 1 ? "s" : ""}`);
      setRows([]);
    } else {
      const j = await res.json();
      setParseError(j.error ?? "Erreur pendant l'import.");
    }
  };

  const duplicateCount = rows.filter((r) => r.isDuplicate).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <h3>Importer des <em>prestataires</em></h3>

        {summary ? (
          <>
            <p className="serif" style={{ fontStyle: "italic", color: "var(--ok)", fontSize: "1.1rem", margin: "20px 0" }}>✓ {summary}</p>
            <div className="modal-actions">
              <button type="button" className="btn gold" onClick={onImported}>Fermer et actualiser</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Catégorie de cet import</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {IMPORT_CATEGORIES.map((c) => <option key={c} value={c}>{PRO_CATEGORIES[c] ?? c}</option>)}
              </select>
            </div>

            <p className="guest-add-form-sub" style={{ marginBottom: 10 }}>
              Colonnes reconnues : Nom (obligatoire), Ville, Département, Téléphone, Email, Accroche, Description,
              Prix à partir de (optionnelles). Toutes les fiches sont créées actives, avec un mot de passe généré —
              aucun email n&apos;est envoyé.
            </p>
            <input
              type="file" accept=".csv,text/csv"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {parseError && <p style={{ color: "var(--terracotta)", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", marginTop: 12 }}>{parseError}</p>}

            {rows.length > 0 && (
              <>
                <p className="serif" style={{ fontStyle: "italic", color: "var(--gold)", margin: "18px 0 10px" }}>
                  {rows.length} prestataire{rows.length > 1 ? "s" : ""} détecté{rows.length > 1 ? "s" : ""}
                  {duplicateCount > 0 && ` · ${duplicateCount} doublon${duplicateCount > 1 ? "s" : ""} possible${duplicateCount > 1 ? "s" : ""}`}
                </p>
                <div className="import-preview">
                  {rows.map((r, i) => (
                    <label key={i} className={`import-preview-row${r.isDuplicate ? " duplicate" : ""}`}>
                      <input type="checkbox" checked={r.include} onChange={() => toggleRow(i)} />
                      <span>{r.name}</span>
                      {r.city && <span className="moment-tag">{r.city}</span>}
                      {r.priceFrom && <span className="moment-tag">dès {r.priceFrom.toLocaleString("fr-FR")} €</span>}
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
