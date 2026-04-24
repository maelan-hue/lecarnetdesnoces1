"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PRO_CATEGORIES } from "@/lib/utils";

type Pro = { id:string; name:string; email:string; category:string; department:string|null; status:string; createdAt:string };

const STATUS_LABEL: Record<string,string> = { PENDING:"En attente", ACTIVE:"Actif", SUSPENDED:"Suspendu" };
const STATUS_COLOR: Record<string,string> = { PENDING:"var(--gold)", ACTIVE:"var(--sage)", SUSPENDED:"var(--terracotta)" };

export default function AdminDashboardPage() {
  const router = useRouter();
  const [pros,    setPros]    = useState<Pro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("ALL");
  const [msg,     setMsg]     = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/pros");
    if (res.status === 401) { router.push("/admin/connexion"); return; }
    if (res.ok) setPros(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const action = async (id: string, act: string) => {
    setMsg("");
    const res  = await fetch("/api/admin/pros", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id, action: act }) });
    const json = await res.json();
    if (res.ok) { setMsg(json.message ?? "Action effectuée."); load(); }
    else        setMsg(json.error ?? "Erreur.");
  };

  const filtered  = filter === "ALL" ? pros : pros.filter((p) => p.status === filter);
  const nbPending = pros.filter((p) => p.status === "PENDING").length;

  const logout = async () => {
    await fetch("/api/auth/logout", { method:"POST" });
    router.push("/");
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--paper)" }}>
      {/* Nav admin */}
      <nav style={{ background:"var(--ink)", padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", color:"var(--paper)", fontSize:"1.1rem" }}>Le Carnet <em style={{ color:"var(--gold)" }}>— Admin</em></div>
        <button onClick={logout} className="btn ghost small" style={{ fontSize:"0.58rem", borderColor:"rgba(250,248,244,0.2)", color:"rgba(250,248,244,0.6)" }}>Déconnexion</button>
      </nav>

      <div className="container">
        <div className="page-head" style={{ marginTop:40 }}>
          <div className="eyebrow">Gestion des prestataires</div>
          <h1 className="page-title">Tableau <em>de bord</em></h1>
          {nbPending > 0 && <p className="page-sub" style={{ color:"var(--terracotta)" }}>{nbPending} inscription(s) en attente de validation.</p>}
        </div>

        {/* Filtres */}
        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
          {[["ALL","Tous"], ["PENDING","En attente"], ["ACTIVE","Actifs"], ["SUSPENDED","Suspendus"]].map(([k,l]) => (
            <button key={k} className={`chip${filter===k?" active":""}`} onClick={() => setFilter(k)}>{l} ({k==="ALL" ? pros.length : pros.filter((p) => p.status===k).length})</button>
          ))}
        </div>

        {msg && <div style={{ padding:"12px 18px", background:"rgba(168,131,59,0.1)", borderLeft:"2px solid var(--gold)", marginBottom:20, fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" }}>{msg}</div>}

        {loading ? <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)" }}>Chargement…</p> : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map((pro) => (
              <div key={pro.id} style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"20px 24px", display:"grid", gridTemplateColumns:"1fr auto", gap:20, alignItems:"center" }}>
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
                  <span style={{ fontSize:"0.6rem", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:500, color: STATUS_COLOR[pro.status] }}>{STATUS_LABEL[pro.status]}</span>
                  <div style={{ display:"flex", gap:8 }}>
                    {pro.status === "PENDING"   && <button className="btn gold small"  onClick={() => action(pro.id, "validate")}>Valider &amp; envoyer les accès</button>}
                    {pro.status === "ACTIVE"    && <button className="btn ghost small" onClick={() => action(pro.id, "suspend")} style={{ borderColor:"var(--terracotta)", color:"var(--terracotta)" }}>Suspendre</button>}
                    {pro.status === "SUSPENDED" && <button className="btn ghost small" onClick={() => action(pro.id, "validate")}>Réactiver</button>}
                    <button className="btn ghost small" onClick={() => { if(confirm("Supprimer définitivement ce prestataire ?")) action(pro.id, "delete"); }} style={{ borderColor:"var(--terracotta)", color:"var(--terracotta)" }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", padding:"30px 0" }}>Aucun prestataire dans cette catégorie.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
