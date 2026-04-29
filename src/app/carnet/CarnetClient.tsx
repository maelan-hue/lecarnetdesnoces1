"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DateEditor from "@/components/couple/DateEditor";
import { CATEGORY_TO_PRO, PRO_CATEGORIES } from "@/lib/utils";

type Task = {
  id: string; title: string; description?: string | null;
  category: string; status: string;
  proName?: string | null; quoteTotal?: number | null; amountPaid: number;
};

type Phase = {
  phaseNum: number; done: number; total: number;
  meta: { timing: string; name: string };
  tasks: Task[];
};

type ManualEntry = { id: string; vendorName: string; vendorCategory: string };

type CarnetData = {
  prenoms: string; weddingDate: string | null; weddingCity: string | null;
  weddingVenue: string | null; guestCount: number | null;
  budgetEstimate: number | null; budgetEngage: number;
  days: number | null; months: number | null;
  guestTotal: number; totalTasks: number;
  phases: Phase[];
  manualEntries: ManualEntry[];
};

type Relation = {
  id: string; proId: string; status: "FAVORITE" | "RETAINED"; category: string;
  pro: { id: string; name: string; slug: string; category: string; tagline: string | null; city: string | null; profilePhoto: string | null; tarifs: { priceFrom: number }[] };
};

const TASK_CLASS: Record<string, string> = { DONE: "done", TODO: "", IN_PROGRESS: "" };

export default function CarnetClient({ data }: { data: CarnetData }) {
  const router = useRouter();
  const [relations, setRelations] = useState<Relation[]>([]);

  // Charger les relations au montage
  useEffect(() => {
    fetch("/api/couple/vendors")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setRelations(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const [open, setOpen] = useState<Record<number, boolean>>(() => {
    const state: Record<number, boolean> = {};
    data.phases.forEach((p) => { state[p.phaseNum] = p.done < p.total; });
    const firstOpen = data.phases.find((p) => p.done < p.total);
    if (firstOpen) state[firstOpen.phaseNum] = true;
    return state;
  });

  const toggle = (n: number) => setOpen((s) => ({ ...s, [n]: !s[n] }));

  const prenomParts = data.prenoms.split(/[&\s]+/).filter(Boolean);
  const firstName   = prenomParts[0] ?? data.prenoms;
  const secondName  = prenomParts.slice(1).join(" ");
  const budgetEngageEuros = data.budgetEngage;

  // Catégories ayant des relations (favoris ou retenus)
  const usedCategories = [...new Set(relations.map((r) => r.category))];

  return (
    <div className="container">

      {/* ── EN-TÊTE ── */}
      <div className="carnet-head">
        <div>
          {data.weddingDate && (
            <div className="eyebrow">
              {new Date(data.weddingDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              {data.weddingVenue ? ` · ${data.weddingVenue}` : ""}
              {data.guestCount ? ` · ${data.guestCount} invités` : ""}
            </div>
          )}
          <h1 className="carnet-name">
            {firstName}{secondName ? <> &amp; <em>{secondName}</em></> : ""}
          </h1>
          <p className="carnet-sub">Votre carnet se tisse au fil de vos choix.</p>
        </div>
        <Link href="/carnet/budget" style={{ textDecoration:"none" }}>
          <div className="budget-card" style={{ cursor:"pointer", transition:"border-color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bone)")}
          >
            <div className="budget-lbl">Budget engagé →</div>
            <div className="budget-val">{budgetEngageEuros.toLocaleString("fr-FR")} €</div>
          </div>
        </Link>
      </div>

      {/* ── COUNTDOWN / DATE EDITOR ── */}
      <DateEditor
        weddingDate={data.weddingDate}
        weddingCity={data.weddingCity}
        weddingVenue={data.weddingVenue}
        guestCount={data.guestCount}
        days={data.days}
        months={data.months}
        guestTotal={data.guestTotal}
        budgetEstimate={data.budgetEstimate}
      />

      {/* ── BOUTON MES FAVORIS ── */}
      <div style={{ marginBottom: 32, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <Link
          href="/carnet/favoris"
          style={{
            display:"inline-flex", alignItems:"center", gap:10,
            padding:"12px 22px", background:"var(--ivory)",
            border:"1px solid var(--bone)", borderLeft:"2px solid var(--gold)",
            textDecoration:"none", transition:"border-color 0.2s",
          }}
        >
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1rem", color:"var(--gold)" }}>♥</span>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", fontWeight:500, color:"var(--ink)" }}>
            Mes prestataires favoris
          </span>
          {relations.length > 0 && (
            <span style={{ background:"var(--gold)", color:"var(--paper)", fontSize:"0.6rem", fontFamily:"'Jost',sans-serif", fontWeight:600, padding:"1px 8px", borderRadius:100 }}>
              {relations.length}
            </span>
          )}
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.6rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--mute)" }}>→</span>
        </Link>
      </div>

      {/* ── PHASES ── */}
      <div className="section-title" style={{ marginBottom: 6 }}>
        Votre <em style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", color: "var(--gold)" }}>parcours</em>
      </div>

      <div className="phases">
        {data.phases.map((phase) => {
          const isOpen    = !!open[phase.phaseNum];
          const allDone   = phase.done === phase.total && phase.total > 0;
          const hasActive = phase.done > 0 && !allDone;
          const dotClass  = allDone ? "dot-done" : hasActive ? "dot-cur" : "dot-wait";
          const badgeClass = allDone ? "b-done" : hasActive ? "b-cur" : "b-wait";
          const badgeText  = allDone
            ? `✓ ${phase.done} / ${phase.total} validées`
            : phase.done > 0 ? `${phase.done} / ${phase.total} validés`
            : `À venir · ${phase.total} étapes`;

          return (
            <div key={phase.phaseNum} className="phase">
              <div className={`phase-hd${isOpen ? " open" : ""}`} onClick={() => toggle(phase.phaseNum)}>
                <div className="ph-l">
                  <div className={`ph-dot ${dotClass}`} />
                  <div>
                    <p className="ph-timing">{phase.meta.timing}</p>
                    <p className="ph-name">{phase.meta.name}</p>
                  </div>
                </div>
                <div className="ph-r">
                  <span className={`badge ${badgeClass}`}>{badgeText}</span>
                  <svg className={`chevron${isOpen ? " open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              <div className="phase-body" style={{ maxHeight: isOpen ? 2000 : 0 }}>
                <div className="phase-inner">
                  {phase.tasks.map((task) => {
                    const isPaid = task.amountPaid > 0;
                    const isDone = task.status === "DONE" || isPaid;
                    const cls    = isPaid ? "paid" : TASK_CLASS[task.status];
                    const proCategory = CATEGORY_TO_PRO[task.category];
                    const searchUrl   = proCategory ? `/prestataires?category=${proCategory}` : `/prestataires`;
                    // Si un prestataire est assigné → lien vers sa fiche budget, sinon vers la recherche
                    const budgetEntry = task.proName
                      ? data.manualEntries.find((e) =>
                          e.vendorName === task.proName &&
                          (proCategory ? e.vendorCategory === proCategory : true)
                        ) ?? data.manualEntries.find((e) => e.vendorName === task.proName)
                      : null;
                    const targetUrl = budgetEntry
                      ? `/carnet/budget/${budgetEntry.id}/modifier`
                      : task.proName
                        ? `/carnet/budget`
                        : searchUrl;

                    // Compter favoris et retenu pour cette catégorie
                    const catRels    = proCategory ? relations.filter((r) => r.category === proCategory) : [];
                    const catRetained = catRels.find((r) => r.status === "RETAINED");
                    const catFavCount = catRels.filter((r) => r.status === "FAVORITE").length;

                    return (
                      <div key={task.id}>
                        <div className={`task clickable ${cls}`} onClick={() => router.push(targetUrl)}>
                        <div className="task-check">{isPaid ? "€" : isDone ? "✓" : ""}</div>
                        <div>
                          <div className="task-name">{task.title}</div>
                          {task.proName ? (
                            <div className="task-pres">{task.proName}</div>
                          ) : task.description ? (
                            <div className="task-pres">{task.description}</div>
                          ) : null}
                        </div>
                        <div className="task-side">
                          {isPaid ? (
                            <><div className="amount">{task.amountPaid.toLocaleString("fr-FR")} €</div>payé ✓</>
                          ) : task.quoteTotal ? (
                            <><div className="amount">{task.quoteTotal.toLocaleString("fr-FR")} €</div>devis</>
                          ) : (
                            <span style={{ color: isDone ? "var(--ok)" : catRetained ? "var(--gold)" : catFavCount > 0 ? "var(--gold)" : "var(--terracotta)" }}>
                              {isDone ? "Réservé ✓" : catRetained ? "Retenu →" : catFavCount > 0 ? `${catFavCount} ♥` : "À choisir →"}
                            </span>
                          )}
                        </div>
                        </div>{/* fin task */}
                        {/* Mini-accordéon favoris inline — sous la catégorie */}
                        {catRels.length > 0 && (
                          <InlineFavorites
                            category={proCategory!}
                            catLabel={PRO_CATEGORIES[proCategory!] ?? task.title}
                            relations={catRels}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Composant mini-accordéon favoris inline ─────────────────────────────────

type InlineRel = { proId:string; status:"FAVORITE"|"RETAINED"; pro:{ id:string; name:string; slug:string; profilePhoto:string|null; tarifs:{priceFrom:number}[] } };

function InlineFavorites({ category, catLabel, relations }: { category:string; catLabel:string; relations:InlineRel[] }) {
  const [open, setOpen] = useState(false);
  const retained  = relations.find((r) => r.status === "RETAINED");
  const favCount  = relations.filter((r) => r.status === "FAVORITE").length;

  return (
    <div style={{ borderBottom:"1px dashed var(--bone)", marginBottom:0 }}>
      <div
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0 8px 34px", cursor:"pointer" }}
      >
        <span style={{ color:"var(--terracotta)", fontSize:"0.9rem" }}>♥</span>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.85rem", color:"var(--mute)" }}>
          {retained
            ? <><strong style={{ fontStyle:"normal", color:"var(--gold)" }}>✦ {retained.pro.name}</strong>{favCount > 0 ? ` · ${favCount} en comparaison` : ""}</>
            : <>{favCount} favori{favCount > 1 ? "s" : ""} — {catLabel.toLowerCase()}</>
          }
        </span>
        <svg style={{ width:11, height:11, color:"var(--mute)", transition:"transform 0.2s", transform:open?"rotate(180deg)":"none", marginLeft:"auto", marginRight:34, flexShrink:0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      {open && (
        <div style={{ paddingLeft:34, paddingBottom:10 }} onClick={(e) => e.stopPropagation()}>
          {relations.map((rel) => (
            <div key={rel.proId} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderTop:"0.5px dashed var(--bone)" }}>
              {rel.pro.profilePhoto
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={rel.pro.profilePhoto} alt={rel.pro.name} style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                : <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--linen)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.7rem", color:"var(--taupe)", flexShrink:0 }}>{rel.pro.name[0]}</div>
              }
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"0.9rem", flex:1 }}>
                {rel.status === "RETAINED" && <span style={{ color:"var(--gold)", marginRight:6 }}>✦</span>}
                {rel.pro.name}
              </span>
              <a href={`/prestataires/${rel.pro.slug}`} onClick={(e) => e.stopPropagation()} style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.55rem", letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)", textDecoration:"none" }}>Fiche →</a>
            </div>
          ))}
          <a href="/carnet/favoris" onClick={(e) => e.stopPropagation()} style={{ display:"block", marginTop:8, fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.8rem", color:"var(--mute)" }}>
            Gérer mes favoris →
          </a>
        </div>
      )}
    </div>
  );
}
