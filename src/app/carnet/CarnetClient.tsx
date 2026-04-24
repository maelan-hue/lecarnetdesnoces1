"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DateEditor from "@/components/couple/DateEditor";

// Correspondance category (tâche) → ProCategory (enum Prisma)
const CATEGORY_TO_PRO: Record<string, string> = {
  lieu:            "LIEU",
  traiteur:        "TRAITEUR",
  photographe:     "PHOTOGRAPHE",
  videaste:        "VIDEASTE",
  dj_musicien:     "DJ_MUSICIEN",
  fleuriste:       "FLEURISTE",
  decoration:      "DECORATION_PAPETERIE",
  maquillage:      "COIFFURE_MAQUILLAGE",
  coiffure:        "COIFFURE_MAQUILLAGE",
  officiant:       "OFFICIANT",
  wedding_planner: "WEDDING_PLANNER",
};

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

type CarnetData = {
  prenoms: string; weddingDate: string | null; weddingCity: string | null;
  weddingVenue: string | null; guestCount: number | null;
  budgetEstimate: number | null; budgetEngage: number;
  days: number | null; months: number | null;
  guestTotal: number; totalTasks: number;
  phases: Phase[];
};

const CHECK_ICON: Record<string, string> = {
  DONE: "✓", TODO: "", IN_PROGRESS: "",
};
const TASK_CLASS: Record<string, string> = {
  DONE: "done", TODO: "", IN_PROGRESS: "",
};

export default function CarnetClient({ data }: { data: CarnetData }) {
  const router = useRouter();
  // Phase 1 ouverte par défaut, les autres selon avancement
  const [open, setOpen] = useState<Record<number, boolean>>(() => {
    const state: Record<number, boolean> = {};
    data.phases.forEach((p) => { state[p.phaseNum] = p.done < p.total; });
    // Toujours ouvrir au moins la première phase non terminée
    const firstOpen = data.phases.find((p) => p.done < p.total);
    if (firstOpen) state[firstOpen.phaseNum] = true;
    return state;
  });

  const toggle = (n: number) => setOpen((s) => ({ ...s, [n]: !s[n] }));

  const prenomParts = data.prenoms.split(/[&\s]+/).filter(Boolean);
  const firstName   = prenomParts[0] ?? data.prenoms;
  const secondName  = prenomParts.slice(1).join(" ");

  const fmtAmount = (cents: number) =>
    (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " €";

  const budgetEngageEuros = data.budgetEngage; // déjà en euros

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
        <div className="budget-card">
          <div className="budget-lbl">Budget engagé</div>
          <div className="budget-val">{budgetEngageEuros.toLocaleString("fr-FR")} €</div>
        </div>
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
      />

      {/* ── PHASES ── */}
      <div className="section-title" style={{ marginBottom: 6 }}>
        Votre <em style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", color: "var(--gold)" }}>parcours</em>
      </div>
      <p className="section-hint">
        Généré selon votre date et vos ambiances · {data.phases.length} phases · {data.totalTasks} étapes
      </p>

      <div className="phases">
        {data.phases.map((phase) => {
          const isOpen    = !!open[phase.phaseNum];
          const allDone   = phase.done === phase.total && phase.total > 0;
          const hasActive = phase.done > 0 && !allDone;
          const dotClass  = allDone ? "dot-done" : hasActive ? "dot-cur" : "dot-wait";
          const badgeClass = allDone ? "b-done" : hasActive ? "b-cur" : "b-wait";
          const badgeText  = allDone
            ? `✓ ${phase.done} / ${phase.total} validées`
            : phase.done > 0
              ? `${phase.done} / ${phase.total} validés`
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
                    const isPaid  = task.amountPaid > 0;
                    const isDone  = task.status === "DONE" || isPaid;
                    const cls     = isPaid ? "paid" : TASK_CLASS[task.status];

                    const proCategory = CATEGORY_TO_PRO[task.category];
                    const searchUrl   = proCategory
                      ? `/prestataires?category=${proCategory}`
                      : `/prestataires`;

                    return (
                      <div
                        key={task.id}
                        className={`task clickable ${cls}`}
                        onClick={() => router.push(searchUrl)}
                      >
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
                            <span style={{ color: isDone ? "var(--ok)" : "var(--terracotta)" }}>
                              {isDone ? "Réservé ✓" : "À choisir →"}
                            </span>
                          )}
                        </div>
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
