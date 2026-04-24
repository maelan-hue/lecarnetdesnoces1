"use client";

import { useState, useEffect, useCallback } from "react";

type DayStatus = "AVAILABLE" | "UNAVAILABLE" | null; // null = À contacter

type DayData = {
  day:    number;
  date:   string;   // YYYY-MM-DD
  status: DayStatus;
  past:   boolean;
};

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS   = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

// Cycle : null → AVAILABLE → UNAVAILABLE → null
function nextStatus(s: DayStatus): DayStatus {
  if (s === null)          return "AVAILABLE";
  if (s === "AVAILABLE")   return "UNAVAILABLE";
  return null;
}

function toYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function DisponibilitesPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [calActive,  setCalActive]  = useState(false);
  const [avails,     setAvails]     = useState<Record<string, DayStatus>>({});
  const [year,       setYear]       = useState(today.getFullYear());
  const [month,      setMonth]      = useState(today.getMonth()); // 0-based
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState("");
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    const res  = await fetch("/api/pro/disponibilites");
    const json = await res.json();
    if (res.ok) {
      setCalActive(json.calendarActive);
      const map: Record<string, DayStatus> = {};
      for (const a of json.avails) {
        const d = new Date(a.date);
        map[toYMD(d)] = a.status === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE";
      }
      setAvails(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Construire la grille du mois
  const buildGrid = (): DayData[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    // lundi = 0, dimanche = 6 (conversion depuis getDay où dim=0)
    const startDow = (firstDay.getDay() + 6) % 7;

    const cells: DayData[] = [];
    // Cases vides avant le 1er
    for (let i = 0; i < startDow; i++) cells.push({ day: 0, date: "", status: null, past: false });
    // Jours du mois
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = toYMD(new Date(year, month, d));
      const dayDate = new Date(year, month, d);
      cells.push({ day: d, date, status: avails[date] ?? null, past: dayDate < today });
    }
    return cells;
  };

  const handleDayClick = async (cell: DayData) => {
    if (cell.day === 0 || cell.past || !calActive) return;
    const next = nextStatus(cell.status);

    // Mise à jour optimiste
    setAvails((a) => {
      const updated = { ...a };
      if (next === null) delete updated[cell.date];
      else updated[cell.date] = next;
      return updated;
    });

    // Persistance immédiate
    await fetch("/api/pro/disponibilites", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ date: cell.date, status: next }),
    });
  };

  const handleToggle = async () => {
    const next = !calActive;
    setCalActive(next);
    setMsg("");
    const res = await fetch("/api/pro/disponibilites", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ calendarActive: next }),
    });
    if (!res.ok) { setCalActive(!next); setMsg("Erreur lors de la sauvegarde."); }
    else setMsg(next ? "Calendrier activé." : "Calendrier désactivé.");
    setTimeout(() => setMsg(""), 2500);
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const grid = buildGrid();

  const getDayClass = (cell: DayData): string => {
    if (cell.day === 0)   return "cal-day empty";
    if (cell.past)        return "cal-day past";
    if (!calActive)       return "cal-day contact";
    if (cell.status === "AVAILABLE")   return "cal-day available";
    if (cell.status === "UNAVAILABLE") return "cal-day unavailable";
    return "cal-day contact";
  };

  if (loading) return (
    <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", padding:"40px 0" }}>Chargement…</p>
  );

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Votre calendrier public</div>
        <h1 className="page-title">Mes <em>disponibilités</em></h1>
        <p className="page-sub">Votre calendrier décide du statut affiché aux couples. S&apos;il est désactivé, vous apparaissez toujours comme « À contacter ».</p>
      </div>

      {/* Toggle activation */}
      <div className="cal-activation">
        <div>
          <div className="cal-activation-title">Activer la gestion du calendrier</div>
          <div className="cal-activation-desc">
            {calActive
              ? "Vos statuts sont visibles par les couples. Les dates sans statut apparaissent comme « À contacter »."
              : "Vous apparaissez toujours comme « À contacter » auprès des couples, quelle que soit la date."}
          </div>
        </div>
        <label className="cal-switch">
          <input type="checkbox" checked={calActive} onChange={handleToggle} />
          <span className="cal-switch-slider" />
        </label>
      </div>

      {msg && (
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--sage)", marginBottom:16, fontSize:"0.95rem" }}>
          ✓ {msg}
        </div>
      )}

      {calActive && (
        <>
          {/* Légende */}
          <div className="cal-legend">
            <div className="cal-legend-item"><div className="cal-legend-dot available" /><span>Disponible</span></div>
            <div className="cal-legend-item"><div className="cal-legend-dot booked"    /><span>Indisponible</span></div>
            <div className="cal-legend-item"><div className="cal-legend-dot contact"   /><span>À contacter (non renseigné)</span></div>
          </div>

          {/* Explication des 3 statuts */}
          <div className="status-explain">
            {[
              { color:"var(--sage)",        title:"Disponible",    text:"Vous avez confirmé être libre ce jour-là. Les couples voient « Disponible » et savent qu'ils peuvent réserver." },
              { color:"var(--terracotta)",  title:"Indisponible",  text:"Vous êtes déjà engagé ou absent. Les couples voient « Indisponible » et ne peuvent pas vous solliciter." },
              { color:"var(--gold)",        title:"À contacter",   text:"Statut par défaut. Les couples comprennent qu'ils doivent vous envoyer un message pour vérifier votre disponibilité." },
            ].map(({ color, title, text }) => (
              <div key={title} className="status-explain-row">
                <div className="status-explain-dot" style={{ background: color }} />
                <div>
                  <div className="status-explain-title">{title}</div>
                  <div className="status-explain-text">{text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="tip">
            🌿 <strong>Conseil —</strong> Tenir votre calendrier à jour est le meilleur moyen d&apos;éviter les sollicitations inutiles. Cliquez sur un jour pour changer son statut.
          </div>
        </>
      )}

      {/* Calendrier */}
      {calActive ? (
        <>
          <div className="cal-header">
            <div className="cal-month">
              {MONTHS[month]} <em style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--gold)" }}>{year}</em>
            </div>
            <div className="cal-nav-btns">
              <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
              <button className="cal-nav-btn" onClick={nextMonth}>›</button>
            </div>
          </div>

          <div className="cal-grid">
            {DAYS.map((d) => <div key={d} className="cal-wd">{d}</div>)}
            {grid.map((cell, i) => (
              <div
                key={i}
                className={getDayClass(cell)}
                onClick={() => handleDayClick(cell)}
                title={
                  cell.day === 0 ? "" :
                  cell.past     ? "Date passée" :
                  cell.status === "AVAILABLE"   ? "Disponible — cliquer pour changer" :
                  cell.status === "UNAVAILABLE" ? "Indisponible — cliquer pour changer" :
                  "À contacter — cliquer pour marquer disponible"
                }
              >
                {cell.day || ""}
              </div>
            ))}
          </div>

          <p className="serif" style={{ fontStyle:"italic", fontSize:"0.82rem", color:"var(--mute)", marginBottom:20 }}>
            Cliquez sur un jour pour cycler : <strong style={{ fontStyle:"normal" }}>À contacter → Disponible → Indisponible → À contacter</strong>
          </p>
        </>
      ) : (
        <div className="cal-disabled-notice">
          <div className="cal-disabled-icon">◇</div>
          <div>
            <div className="cal-disabled-title">Calendrier désactivé</div>
            <div className="cal-disabled-text">
              Votre calendrier n&apos;est pas visible par les couples. Ils verront le statut <strong>« À contacter »</strong> sur votre fiche, quelle que soit la date.
              Activez-le pour affiner vos disponibilités.
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:10, marginTop:24, flexWrap:"wrap" }}>
        <button className="btn ghost" disabled style={{ opacity:0.5 }}>
          Synchroniser Google Calendar (bientôt)
        </button>
      </div>
    </>
  );
}
