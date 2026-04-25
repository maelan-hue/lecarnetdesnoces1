"use client";

import { useState } from "react";
import Link from "next/link";

type Donation = { id:string; donorName:string|null; isAnonymous:boolean; message:string|null; amountNet:number; paidAt:string|null; dreamTitle:string|null };
type Props = {
  cagnotte: {
    id:string; slug:string; title:string; status:string;
    ibanStored:string|null; withdrawnAt:string|null;
    showGuestbook:boolean;
    dreams: { id:string; title:string }[];
    donations: Donation[];
    lastWithdrawal: { status:string; amountNet:number; createdAt:string }|null;
  };
  weddingDate: string|null;
};

const COMMISSION_PCT = 3;
const PAYOUT_FEE_CENTS = 25;

export default function CagnotteDashboard({ cagnotte, weddingDate }: Props) {
  const [iban,    setIban]    = useState(cagnotte.ibanStored ?? "");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");
  const [showAll, setShowAll] = useState(false);

  const totalGross = cagnotte.donations.reduce((s, d) => s + d.amountNet, 0);
  const commission = Math.round(totalGross * COMMISSION_PCT / 100);
  const netAmount  = totalGross - commission - PAYOUT_FEE_CENTS;
  const nbDonors   = cagnotte.donations.length;

  // Vérifier si le retrait est possible (7j après mariage)
  const canWithdraw = (() => {
    if (!weddingDate) return false;
    const unlock = new Date(weddingDate);
    unlock.setDate(unlock.getDate() + 7);
    return new Date() >= unlock;
  })();

  const unlockDate = weddingDate
    ? (() => { const d = new Date(weddingDate); d.setDate(d.getDate()+7); return d.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}); })()
    : null;

  const handleWithdraw = async () => {
    if (!iban.trim()) { setMsg("Saisissez votre IBAN."); return; }
    if (totalGross === 0) { setMsg("Aucun don reçu."); return; }
    setLoading(true); setMsg("");
    const res  = await fetch("/api/couple/cagnotte/withdraw", {
      method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ iban }),
    });
    const json = await res.json();
    setLoading(false);
    if (res.ok) { setMsg("✓ Demande de virement envoyée. Vous recevrez les fonds sous 2 à 3 jours ouvrés."); }
    else        { setMsg(json.error ?? "Erreur."); }
  };

  const publicUrl = `${typeof window!=="undefined"?window.location.origin:"https://lecarnetdesnoces.fr"}/cagnotte/${cagnotte.slug}`;

  const displayed = showAll ? cagnotte.donations : cagnotte.donations.slice(0, 5);

  return (
    <div className="container">
      <div className="page-head">
        <div className="eyebrow">Mon carnet · Cagnotte {cagnotte.status === "ACTIVE" ? "· Active ✓" : cagnotte.status === "CLOSED" ? "· Fermée" : "· Brouillon"}</div>
        <h1 className="page-title">Votre <em>cagnotte</em></h1>
        <p className="page-sub">Suivez les participations en temps réel, retirez quand vous êtes prêts.</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:28 }}>
        <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"22px 20px" }}>
          <div style={{ fontSize:"0.6rem", letterSpacing:"0.22em", textTransform:"uppercase", color:"var(--taupe)", fontWeight:500 }}>Collecté</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"2.2rem", lineHeight:1, color:"var(--gold)", margin:"6px 0 4px" }}>{(totalGross/100).toLocaleString("fr-FR")} €</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.78rem", color:"var(--mute)" }}>brut, avant commission</div>
        </div>
        <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"22px 20px" }}>
          <div style={{ fontSize:"0.6rem", letterSpacing:"0.22em", textTransform:"uppercase", color:"var(--taupe)", fontWeight:500 }}>Participants</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.2rem", lineHeight:1, color:"var(--ink)", margin:"6px 0 4px" }}>{nbDonors}</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.78rem", color:"var(--mute)" }}>dons reçus</div>
        </div>
      </div>

      {/* Lien public */}
      <div style={{ background:"var(--paper)", padding:"22px 26px", border:"1px solid var(--bone)", marginBottom:24 }}>
        <div className="eyebrow" style={{ marginBottom:6 }}>Lien public à partager</div>
        <div style={{ display:"flex", gap:10, alignItems:"center", padding:"12px 14px", background:"var(--ivory)", border:"1px solid var(--bone)", marginBottom:12 }}>
          <div style={{ flex:1, fontFamily:"monospace", fontSize:"0.78rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{publicUrl}</div>
          <button className="btn ghost small" onClick={() => navigator.clipboard.writeText(publicUrl)}>Copier</button>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Link href={`/cagnotte/${cagnotte.slug}`} target="_blank" className="btn ghost small">Aperçu public</Link>
          <Link href="/carnet/cagnotte/config" className="btn ghost small">Modifier la page</Link>
          {cagnotte.status === "DRAFT" && (
            <button className="btn gold small" onClick={async () => {
              await fetch("/api/couple/cagnotte/publish", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ status:"ACTIVE" }) });
              window.location.reload();
            }}>Publier la cagnotte</button>
          )}
        </div>
      </div>

      {/* Participations */}
      {nbDonors > 0 && (
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14 }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:500 }}>
              Dernières <em style={{ fontStyle:"italic", color:"var(--gold)" }}>participations</em>
            </h2>
          </div>
          {displayed.map((d) => (
            <div key={d.id} style={{ display:"grid", gridTemplateColumns:"1fr auto 110px", gap:16, padding:"14px 0", borderBottom:"0.5px dashed var(--bone)", alignItems:"center" }}>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem" }}>
                  {d.isAnonymous ? <em>Anonyme</em> : (d.donorName || <em>Anonyme</em>)}
                </div>
                {d.paidAt && <div style={{ fontFamily:"'Jost',sans-serif", fontSize:"0.7rem", color:"var(--taupe)" }}>{new Date(d.paidAt).toLocaleDateString("fr-FR")}</div>}
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.82rem", maxWidth:200, textAlign:"right" }}>
                {d.message ? `« ${d.message.slice(0,60)}${d.message.length>60?"…":""} »` : ""}
              </div>
              <div style={{ textAlign:"right", color:"var(--gold)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.25rem" }}>
                {(d.amountNet/100).toLocaleString("fr-FR")} €
              </div>
            </div>
          ))}
          {cagnotte.donations.length > 5 && (
            <div style={{ textAlign:"center", marginTop:14 }}>
              <button className="btn ghost small" onClick={() => setShowAll(!showAll)}>
                {showAll ? "Voir moins" : `Voir les ${cagnotte.donations.length} participations`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Retrait */}
      {cagnotte.status !== "CLOSED" && (
        <div style={{ background:"linear-gradient(135deg,rgba(168,131,59,0.06),var(--ivory))", border:"1px solid var(--gold)", borderLeft:"3px solid var(--gold)", padding:"26px 30px", marginTop:28 }}>
          <div className="eyebrow" style={{ color:"var(--gold)" }}>Retirer vos fonds</div>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.5rem", fontWeight:400, margin:"6px 0 8px" }}>
            Demander un <em style={{ fontStyle:"italic", color:"var(--gold)" }}>virement</em>
          </h3>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.9rem", marginBottom:16, lineHeight:1.5 }}>
            {canWithdraw
              ? "Un seul virement quand vous êtes prêts. La commission Le Carnet (3 %) est prélevée uniquement à ce moment-là."
              : `Disponible à partir du ${unlockDate} (7 jours après votre mariage).`}
          </p>

          {canWithdraw && totalGross > 0 && (
            <>
              <div style={{ background:"var(--paper)", padding:"16px 20px", border:"1px solid var(--bone)", marginBottom:16, fontFamily:"'Cormorant Garamond',serif" }}>
                {[
                  { label:"Cagnotte brute", val:`${(totalGross/100).toLocaleString("fr-FR")} €` },
                  { label:`Commission Le Carnet (${COMMISSION_PCT} %)`, val:`− ${(commission/100).toLocaleString("fr-FR",{minimumFractionDigits:2})} €` },
                  { label:"Frais bancaires virement", val:"− 0,25 €" },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", fontSize:"0.92rem", color:"var(--mute)" }}>
                    <span>{label}</span><span>{val}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", marginTop:6, borderTop:"0.5px dashed var(--bone)", fontSize:"1.15rem", fontWeight:500 }}>
                  <span>Vous recevrez</span>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--gold)" }}>{(netAmount/100).toLocaleString("fr-FR",{minimumFractionDigits:2})} €</span>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label className="field-label">Votre IBAN</label>
                <input className="input" placeholder="FR76 …" value={iban} onChange={(e) => setIban(e.target.value)} />
              </div>

              {msg && <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color: msg.startsWith("✓") ? "var(--sage)" : "var(--terracotta)", marginBottom:14 }}>{msg}</p>}

              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <button className="btn gold" onClick={handleWithdraw} disabled={loading || totalGross === 0}>
                  {loading ? "Traitement…" : "Demander le virement"}
                </button>
              </div>
            </>
          )}

          {!canWithdraw && (
            <div className="tip">🌿 <strong>Bon à savoir —</strong> Continuez à partager votre lien ! Vous pouvez retirer vos fonds 7 jours après votre mariage.</div>
          )}
        </div>
      )}

      {cagnotte.status === "CLOSED" && cagnotte.lastWithdrawal && (
        <div className="success-banner" style={{ marginTop:28 }}>
          <div className="success-icon">✓</div>
          <div>
            <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.15rem", fontWeight:500, marginBottom:3 }}>Virement demandé</h4>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.95rem" }}>
              {(cagnotte.lastWithdrawal.amountNet/100).toLocaleString("fr-FR",{minimumFractionDigits:2})} € en cours de virement · arrivée sous 2-3 jours ouvrés.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
