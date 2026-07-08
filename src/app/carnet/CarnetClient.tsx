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

type ManualEntry = { id: string; vendorName: string; vendorCategory: string; totalAmount: number; isExternal: boolean };

type CarnetData = {
  prenoms: string; weddingDate: string | null; weddingCity: string | null;
  weddingVenue: string | null; guestCount: number | null;
  budgetEstimate: number | null; budgetEngage: number;
  days: number | null; months: number | null;
  guestTotal: number; totalTasks: number;
  phases: Phase[];
  manualEntries: ManualEntry[];
};

type Selection = {
  proId: string; status: string; category: string;
  pro: { id: string; name: string; slug: string; profilePhoto: string | null; tarifs: { priceFrom: number }[] };
  budgetEntry: { id: string; totalAmount: number } | null;
};

const TASK_CLASS: Record<string, string> = { DONE: "done", TODO: "", IN_PROGRESS: "" };

export default function CarnetClient({ data }: { data: CarnetData }) {
  const router = useRouter();
  const [selections, setSelections] = useState<Selection[]>([]);

  useEffect(() => {
    fetch("/api/couple/selections")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setSelections(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const [open, setOpen] = useState<Record<number, boolean>>(() => {
    const state: Record<number, boolean> = {};
    data.phases.forEach((p) => { state[p.phaseNum] = false; });
    const activePhase = data.phases.find((p) => p.done < p.total) ?? data.phases[0];
    if (activePhase) state[activePhase.phaseNum] = true;
    return state;
  });

  const toggle = (n: number) => setOpen((s) => ({ ...s, [n]: !s[n] }));

  const [doneTasks, setDoneTasks] = useState<Set<string>>(() => {
    const s = new Set<string>();
    data.phases.forEach((p) => p.tasks.forEach((t) => { if (t.status === "DONE") s.add(t.id); }));
    return s;
  });

  const isTaskDone = (task: Task) => doneTasks.has(task.id) || task.amountPaid > 0;

  const toggleTaskDone = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (task.amountPaid > 0) return;
    const next = !doneTasks.has(task.id);
    setDoneTasks((s) => {
      const copy = new Set(s);
      if (next) copy.add(task.id); else copy.delete(task.id);
      return copy;
    });
    fetch(`/api/couple/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    }).catch(() => {
      setDoneTasks((s) => {
        const copy = new Set(s);
        if (next) copy.delete(task.id); else copy.add(task.id);
        return copy;
      });
    });
  };

  const totalDoneAll = data.phases.reduce((sum, p) => sum + p.tasks.filter(isTaskDone).length, 0);
  const progressPct  = data.totalTasks > 0 ? Math.round((totalDoneAll / data.totalTasks) * 100) : 0;

  const prenomParts  = data.prenoms.split(/[&\s]+/).filter(Boolean);
  const firstName    = prenomParts[0] ?? data.prenoms;
  const secondName   = prenomParts.slice(1).join(" ");
  const budgetEngageEuros = data.budgetEngage;

  const selectionCount = selections.length;

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

      {/* ── MA SÉLECTION ── */}
      <div style={{ marginBottom: 32, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <Link
          href="/prestataires"
          style={{
            display:"inline-flex", alignItems:"center", gap:10,
            padding:"12px 22px", background:"var(--ivory)",
            border:"1px solid var(--bone)", borderLeft:"2px solid var(--gold)",
            textDecoration:"none", transition:"border-color 0.2s",
          }}
        >
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1rem", color:"var(--gold)" }}>§</span>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", fontWeight:500, color:"var(--ink)" }}>
            Découvrir les prestataires
          </span>
          {selectionCount > 0 && (
            <span style={{ background:"var(--gold)", color:"var(--paper)", fontSize:"0.6rem", fontFamily:"'Jost',sans-serif", fontWeight:600, padding:"1px 8px", borderRadius:100 }}>
              {selectionCount} en sélection
            </span>
          )}
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.6rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--mute)" }}>→</span>
        </Link>
      </div>

      {/* ── PHASES ── */}
      <div className="section-title" style={{ marginBottom: 6 }}>
        Votre <em style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", color: "var(--gold)" }}>parcours</em>
      </div>

      <div className="parcours-summary">
        <div className="parcours-progress-track">
          <div className="parcours-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="parcours-progress-pct">{progressPct}%</span>
      </div>

      <div className="phases">
        {data.phases.map((phase) => {
          const isOpen    = !!open[phase.phaseNum];
          const phaseDone = phase.tasks.filter(isTaskDone).length;
          const allDone   = phaseDone === phase.total && phase.total > 0;
          const hasActive = phaseDone > 0 && !allDone;
          const dotClass  = allDone ? "dot-done" : hasActive ? "dot-cur" : "dot-wait";
          const badgeClass = allDone ? "b-done" : hasActive ? "b-cur" : "b-wait";
          const badgeText  = allDone
            ? `✓ ${phaseDone} / ${phase.total} validées`
            : phaseDone > 0 ? `${phaseDone} / ${phase.total} validés`
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
                    const isDone = isTaskDone(task);
                    const cls    = isPaid ? "paid" : isDone ? "done" : TASK_CLASS[task.status];
                    const proCategory = CATEGORY_TO_PRO[task.category];
                    const searchUrl   = proCategory ? `/prestataires?category=${proCategory}` : `/prestataires`;

                    const budgetEntry = task.proName
                      ? data.manualEntries.find((e) =>
                          e.vendorName === task.proName &&
                          (proCategory ? e.vendorCategory === proCategory : true)
                        ) ?? data.manualEntries.find((e) => e.vendorName === task.proName)
                      : null;
                    const targetUrl = budgetEntry
                      ? `/carnet/budget/${budgetEntry.id}/modifier`
                      : task.proName ? `/carnet/budget` : searchUrl;

                    const catSels      = proCategory ? selections.filter((s) => s.category === proCategory) : [];
                    const catManual    = proCategory ? data.manualEntries.filter((e) => e.vendorCategory === proCategory && e.isExternal) : [];
                    const confirmed    = catSels.filter((s) => s.status === "confirmed");
                    const inSelection  = catSels.filter((s) => s.status === "selection");
                    const confirmedTotal = confirmed.reduce((s, sel) => s + (sel.budgetEntry?.totalAmount ?? 0), 0);
                    const fmtEur = (c: number) => (c / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " €";

                    return (
                      <div key={task.id}>
                        <div className={`task clickable ${cls}`} onClick={() => router.push(targetUrl)}>
                          <div
                            className={`task-check${isPaid ? "" : " toggle"}`}
                            onClick={(e) => toggleTaskDone(e, task)}
                          >
                            {isPaid ? "€" : isDone ? "✓" : "✦"}
                          </div>
                          <div>
                            <div className="task-name">{task.title}</div>
                            {catSels.length === 0 && (task.proName
                              ? <div className="task-pres">{task.proName}</div>
                              : task.description
                                ? <div className="task-pres">{task.description}</div>
                                : null
                            )}
                          </div>
                          <div className="task-side">
                            {isPaid ? (
                              <><div className="amount">{task.amountPaid.toLocaleString("fr-FR")} €</div>payé ✓</>
                            ) : task.quoteTotal && catSels.length === 0 ? (
                              <><div className="amount">{task.quoteTotal.toLocaleString("fr-FR")} €</div>devis</>
                            ) : confirmed.length > 0 ? (
                              confirmedTotal > 0
                                ? <><div className="amount">{fmtEur(confirmedTotal)}</div>{confirmed.length > 1 ? `${confirmed.length} confirmés` : "confirmé"} ✦</>
                                : <span style={{ color:"var(--gold)" }}>{confirmed.length} confirmé{confirmed.length > 1 ? "s" : ""} ✦</span>
                            ) : (
                              <span style={{ color: isDone ? "var(--ok)" : inSelection.length > 0 ? "var(--taupe)" : "var(--terracotta)" }}>
                                {isDone ? "Réservé ✓" : inSelection.length > 0 ? `${inSelection.length} en sélection` : "À choisir →"}
                              </span>
                            )}
                          </div>
                        </div>
                        {(catSels.length > 0 || catManual.length > 0) && (
                          <InlineSelections
                            category={proCategory!}
                            catLabel={PRO_CATEGORIES[proCategory!] ?? task.title}
                            selections={catSels}
                            manualEntries={catManual}
                            onUpdate={(updated) => setSelections((s) => [...s.filter((x) => x.category !== proCategory), ...updated])}
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

// ── Accordéon sélection inline ───────────────────────────────────────────────

type InlineSel = Selection;

function InlineSelections({ category: _category, catLabel, selections, manualEntries, onUpdate }: {
  category: string; catLabel: string;
  selections: InlineSel[];
  manualEntries: ManualEntry[];
  onUpdate: (updated: InlineSel[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const confirmed   = selections.filter((s) => s.status === "confirmed");
  const inSelection = selections.filter((s) => s.status === "selection");
  const totalCentsFromSel = confirmed.reduce((s, sel) => s + (sel.budgetEntry?.totalAmount ?? 0), 0);
  const totalCentsFromMan = manualEntries.reduce((s, m) => s + m.totalAmount, 0);
  const totalCents  = totalCentsFromSel + totalCentsFromMan;
  const fmtEur = (c: number) => (c / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " €";

  return (
    <div style={{ borderBottom:"1px dashed var(--bone)" }}>
      <div
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0 8px 34px", cursor:"pointer" }}
      >
        <span style={{ color:"var(--gold)", fontSize:"0.9rem" }}>§</span>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.85rem", color:"var(--mute)" }}>
          {confirmed.length > 0 || manualEntries.length > 0
            ? <>
                <strong style={{ fontStyle:"normal", color:"var(--gold)" }}>
                  <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:"var(--gold)", marginRight:6, verticalAlign:"middle", flexShrink:0 }} />
                  {confirmed[0]?.pro.name ?? manualEntries[0]?.vendorName}
                  {(confirmed.length + manualEntries.length) > 1 ? ` + ${confirmed.length + manualEntries.length - 1}` : ""}
                </strong>
                {totalCents > 0 && <span style={{ color:"var(--gold)", marginLeft:6 }}>· {fmtEur(totalCents)}</span>}
              </>
            : <>{inSelection.length} en sélection — {catLabel.toLowerCase()}</>
          }
        </span>
        <svg style={{ width:11, height:11, color:"var(--mute)", transition:"transform 0.2s", transform:open?"rotate(180deg)":"none", marginLeft:"auto", marginRight:34, flexShrink:0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      {open && (
        <div style={{ paddingLeft:34, paddingBottom:12 }} onClick={(e) => e.stopPropagation()}>
          {selections.map((sel) => (
            <div key={sel.proId} style={{ display:"grid", gridTemplateColumns:"28px 1fr auto", gap:10, padding:"8px 0", borderTop:"0.5px dashed var(--bone)", alignItems:"center" }}>
              {sel.pro.profilePhoto
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={sel.pro.profilePhoto} alt={sel.pro.name} style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }} />
                : <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--linen)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.7rem", color:"var(--taupe)" }}>{sel.pro.name[0]}</div>
              }
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"0.9rem" }}>
                {sel.status === "confirmed" && <span style={{ color:"var(--gold)", marginRight:6 }}>✦</span>}
                {sel.pro.name}
                <span style={{ marginLeft:8, fontSize:"0.65rem", fontFamily:"'Jost',sans-serif", color: sel.status === "confirmed" ? "var(--gold)" : "var(--taupe)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
                  {sel.status === "confirmed" ? "Confirmé" : "Ma sélection"}
                </span>
              </span>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                {sel.status === "selection" && (
                  <a
                    href={`/carnet/budget/ajouter/plateforme?proId=${sel.proId}&category=${sel.category}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn gold small"
                    style={{ fontSize:"0.58rem", padding:"5px 10px", textDecoration:"none" }}
                  >
                    Choisir
                  </a>
                )}
                {sel.status === "confirmed" && (
                  <a
                    href={sel.budgetEntry
                      ? `/carnet/budget/${sel.budgetEntry.id}/modifier`
                      : `/carnet/budget/ajouter/plateforme?proId=${sel.proId}&category=${sel.category}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn ghost small"
                    style={{ fontSize:"0.58rem", padding:"5px 10px", textDecoration:"none" }}
                  >
                    {sel.budgetEntry ? "Budget" : "Saisir le devis"}
                  </a>
                )}
                <a href={`/prestataires/${sel.pro.slug}`} onClick={(e) => e.stopPropagation()} style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.55rem", letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)", textDecoration:"none", alignSelf:"center" }}>Fiche →</a>
              </div>
            </div>
          ))}
          {manualEntries.map((m) => (
            <div key={m.id} style={{ display:"grid", gridTemplateColumns:"28px 1fr auto", gap:10, padding:"8px 0", borderTop:"0.5px dashed var(--bone)", alignItems:"center" }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--linen)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.7rem", color:"var(--taupe)" }}>
                {m.vendorName[0]}
              </div>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"0.9rem" }}>
                {m.vendorName}
                <span style={{ marginLeft:8, fontSize:"0.65rem", fontFamily:"'Jost',sans-serif", color:"var(--terracotta)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
                  Hors plateforme
                </span>
              </span>
              <div style={{ display:"flex", gap:6, flexShrink:0, alignItems:"center" }}>
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--gold)", fontSize:"0.9rem" }}>
                  {fmtEur(m.totalAmount)}
                </span>
                <a href={`/carnet/budget/${m.id}/modifier`} onClick={(e) => e.stopPropagation()} style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.55rem", letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)", textDecoration:"none" }}>Modifier →</a>
              </div>
            </div>
          ))}
          <a href="/prestataires" onClick={(e) => e.stopPropagation()} style={{ display:"block", marginTop:8, fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.8rem", color:"var(--mute)" }}>
            Voir l&apos;annuaire →
          </a>
        </div>
      )}
    </div>
  );
}
