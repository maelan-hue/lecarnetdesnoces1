"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dream   = { id:string; title:string; description:string|null; sortOrder:number };
type Program = { id:string; timeLabel:string; description:string; sortOrder:number };

type Initial = {
  id:string; slug:string; title:string; subtitle:string; story:string;
  photoUrl:string; status:string; showGuestbook:boolean; allowAnonymous:boolean;
  emailOnDonation:boolean; emailWeeklyRecap:boolean;
  dreams:Dream[]; program:Program[];
};

export default function CagnotteConfigClient({ initial }: { initial: Initial }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title,        setTitle]       = useState(initial.title);
  const [subtitle,     setSubtitle]    = useState(initial.subtitle);
  const [story,        setStory]       = useState(initial.story);
  const [slug,         setSlug]        = useState(initial.slug);
  const [photoUrl,     setPhotoUrl]    = useState(initial.photoUrl);
  const [showGuestbook,setShowGuestbook] = useState(initial.showGuestbook);
  const [allowAnon,    setAllowAnon]   = useState(initial.allowAnonymous);
  const [emailOnDon,   setEmailOnDon]  = useState(initial.emailOnDonation);
  const [emailWeekly,  setEmailWeekly] = useState(initial.emailWeeklyRecap);
  const [dreams,       setDreams]      = useState<Dream[]>(initial.dreams);
  const [program,      setProgram]     = useState<Program[]>(initial.program);

  const [saving,      setSaving]   = useState(false);
  const [uploading,   setUploading]= useState(false);
  const [msg,         setMsg]      = useState("");

  const save = async (publish = false) => {
    setSaving(true); setMsg("");
    await fetch("/api/couple/cagnotte", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ title,subtitle,story,slug,photoUrl,showGuestbook,allowAnonymous:allowAnon,emailOnDonation:emailOnDon,emailWeeklyRecap:emailWeekly }),
    });
    if (publish) {
      await fetch("/api/couple/cagnotte/publish", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status:"ACTIVE" }) });
    }
    setSaving(false);
    setMsg(publish ? "✓ Cagnotte publiée !" : "✓ Sauvegardé.");
    if (publish) setTimeout(() => router.push("/carnet/cagnotte"), 1000);
  };

  // Photo upload via Cloudinary (réutilise le même endpoint que le portfolio)
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 2*1024*1024) { setMsg("Photo trop lourde (2 Mo max)."); return; }
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/couple/cagnotte/photo", { method:"POST", body:fd });
    const json = await res.json();
    setUploading(false);
    if (res.ok) { setPhotoUrl(json.url); setMsg("Photo mise à jour."); }
    else setMsg(json.error ?? "Erreur upload.");
    if (fileRef.current) fileRef.current.value = "";
  };

  // Dreams CRUD
  const addDream = async () => {
    if (dreams.length >= 5) return;
    const res  = await fetch("/api/couple/cagnotte/dreams", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ title:"Nouveau rêve", description:"" }) });
    const json = await res.json();
    if (res.ok) setDreams([...dreams, json]);
  };
  const updateDream = async (id:string, title:string, description:string) => {
    setDreams(dreams.map((d) => d.id===id ? { ...d, title, description } : d));
    await fetch(`/api/couple/cagnotte/dreams/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ title, description }) });
  };
  const deleteDream = async (id:string) => {
    setDreams(dreams.filter((d) => d.id!==id));
    await fetch(`/api/couple/cagnotte/dreams/${id}`, { method:"DELETE" });
  };

  // Program CRUD
  const addProgram = async () => {
    const res  = await fetch("/api/couple/cagnotte/program", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ timeLabel:"", description:"" }) });
    const json = await res.json();
    if (res.ok) setProgram([...program, json]);
  };
  const updateProgram = async (id:string, timeLabel:string, description:string) => {
    setProgram(program.map((p) => p.id===id ? { ...p, timeLabel, description } : p));
    await fetch(`/api/couple/cagnotte/program/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ timeLabel, description }) });
  };
  const deleteProgram = async (id:string) => {
    setProgram(program.filter((p) => p.id!==id));
    await fetch(`/api/couple/cagnotte/program/${id}`, { method:"DELETE" });
  };

  const ROMAN = ["I","II","III","IV","V"];

  return (
    <div className="container">
      <div style={{ marginBottom:36, paddingBottom:24, borderBottom:"1px dashed var(--bone)" }}>
        <div className="eyebrow">Mon carnet · Cagnotte · Composer notre page</div>
        <h1 className="page-title">Composez votre <em>page de cagnotte</em></h1>
        <p className="page-sub">Racontez votre histoire, partagez vos rêves, et laissez vos proches participer à votre bonheur. Tout est modifiable à tout moment.</p>
      </div>

      {/* I — Photo */}
      <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"30px 34px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:20 }}>
          <div>
            <div className="eyebrow">Étape I</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:500 }}>Votre <em style={{ fontStyle:"italic", color:"var(--gold)" }}>photo</em> de couple</h2>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.9rem", marginTop:4 }}>Photo horizontale, lumineuse. Première impression pour vos proches.</p>
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.8rem", color:"var(--gold)" }}>I</div>
        </div>
        <div onClick={() => fileRef.current?.click()} style={{ aspectRatio:"16/9", background: photoUrl ? "transparent" : "linear-gradient(135deg,var(--bone),var(--taupe))", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden", border:"1px dashed var(--paper)", position:"relative" }}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Photo couple" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <div style={{ textAlign:"center", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--paper)" }}>
              <div style={{ fontSize:"2.5rem", color:"var(--gold)", marginBottom:6 }}>⬆</div>
              {uploading ? "Envoi…" : "Glissez une photo ici ou cliquez"}<br/>
              <span style={{ fontSize:"0.82rem", opacity:0.85 }}>JPG, PNG · 2 Mo max</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto} />
        {photoUrl && <button className="btn ghost small" style={{ marginTop:10 }} onClick={() => setPhotoUrl("")}>Supprimer la photo</button>}
        <div className="tip" style={{ marginTop:18 }}>🌿 <strong>Bon à savoir —</strong> Privilégiez une photo en lumière naturelle, avec vous deux au centre.</div>
      </div>

      {/* II — Titre + histoire */}
      <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"30px 34px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:20 }}>
          <div>
            <div className="eyebrow">Étape II</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:500 }}>Votre <em style={{ fontStyle:"italic", color:"var(--gold)" }}>histoire</em> en quelques lignes</h2>
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.8rem", color:"var(--gold)" }}>II</div>
        </div>
        <div style={{ marginBottom:18 }}>
          <label className="field-label">Titre principal</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notre voyage à deux commence ici." />
        </div>
        <div style={{ marginBottom:18 }}>
          <label className="field-label">Sous-titre (une phrase)</label>
          <input className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Votre présence est déjà le plus beau des cadeaux." />
        </div>
        <div>
          <label className="field-label">Votre histoire</label>
          <textarea className="textarea" rows={5} value={story} onChange={(e) => setStory(e.target.value)} placeholder="Comment vous vous êtes rencontrés, votre ambiance, ce qui vous unit…" />
        </div>
      </div>

      {/* III — Rêves */}
      <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"30px 34px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:20 }}>
          <div>
            <div className="eyebrow">Étape III</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:500 }}>Vos <em style={{ fontStyle:"italic", color:"var(--gold)" }}>rêves</em> à financer</h2>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.9rem", marginTop:4 }}>1 à 5 rêves. Vos proches choisiront lequel soutenir, ou donneront sans préciser.</p>
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.8rem", color:"var(--gold)" }}>III</div>
        </div>
        {dreams.map((d, i) => (
          <div key={d.id} style={{ background:"var(--ivory)", borderLeft:"2px solid var(--gold)", padding:"20px 22px", marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14 }}>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.3rem", color:"var(--gold)" }}>{ROMAN[i]}</span>
              <button onClick={() => deleteDream(d.id)} style={{ background:"none", border:"none", color:"var(--mute)", cursor:"pointer", fontSize:"0.85rem" }}>Supprimer</button>
            </div>
            <div style={{ marginBottom:10 }}>
              <label className="field-label">Nom du rêve</label>
              <input className="input" value={d.title} onChange={(e) => updateDream(d.id, e.target.value, d.description??"")} />
            </div>
            <div>
              <label className="field-label">Description courte</label>
              <textarea className="textarea" rows={2} style={{ minHeight:60 }} value={d.description??""} onChange={(e) => updateDream(d.id, d.title, e.target.value)} />
            </div>
          </div>
        ))}
        {dreams.length < 5 && (
          <button onClick={addDream} style={{ width:"100%", border:"1px dashed var(--bone)", background:"transparent", padding:14, fontFamily:"'Jost',sans-serif", fontSize:"0.75rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--taupe)", cursor:"pointer" }}>+ Ajouter un rêve</button>
        )}
      </div>

      {/* IV — Programme */}
      <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"30px 34px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:20 }}>
          <div>
            <div className="eyebrow">Étape IV</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:500 }}>Le <em style={{ fontStyle:"italic", color:"var(--gold)" }}>programme</em> du jour J</h2>
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.8rem", color:"var(--gold)" }}>IV</div>
        </div>
        {program.map((p) => (
          <div key={p.id} style={{ display:"grid", gridTemplateColumns:"90px 1fr auto", gap:12, padding:"14px 16px", background:"var(--ivory)", borderLeft:"2px solid var(--gold)", marginBottom:10 }}>
            <input className="input" value={p.timeLabel} onChange={(e) => updateProgram(p.id, e.target.value, p.description)} placeholder="15h00" style={{ marginBottom:0 }} />
            <input className="input" value={p.description} onChange={(e) => updateProgram(p.id, p.timeLabel, e.target.value)} placeholder="Cérémonie laïque…" style={{ marginBottom:0 }} />
            <button onClick={() => deleteProgram(p.id)} style={{ background:"none", border:"none", color:"var(--mute)", cursor:"pointer" }}>✕</button>
          </div>
        ))}
        <button onClick={addProgram} style={{ width:"100%", border:"1px dashed var(--bone)", background:"transparent", padding:14, fontFamily:"'Jost',sans-serif", fontSize:"0.75rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--taupe)", cursor:"pointer" }}>+ Ajouter une étape</button>
      </div>

      {/* V — Réglages */}
      <div style={{ background:"var(--paper)", border:"1px solid var(--bone)", padding:"30px 34px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:20 }}>
          <div>
            <div className="eyebrow">Étape V</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:500 }}><em style={{ fontStyle:"italic", color:"var(--gold)" }}>Réglages</em> de publication</h2>
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"1.8rem", color:"var(--gold)" }}>V</div>
        </div>
        <div style={{ marginBottom:18 }}>
          <label className="field-label">URL de votre cagnotte</label>
          <div style={{ display:"flex", alignItems:"center", gap:8, borderBottom:"1px solid var(--bone)", padding:"10px 0" }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.95rem", whiteSpace:"nowrap" }}>lecarnetdesnoces.fr/cagnotte/</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} style={{ flex:1, border:"none", outline:"none", fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", color:"var(--gold)", fontStyle:"italic", background:"transparent" }} />
          </div>
        </div>
        {[
          { label:"Afficher le livre d'or",                state:showGuestbook,   set:setShowGuestbook },
          { label:"Autoriser les dons anonymes",           state:allowAnon,       set:setAllowAnon },
          { label:"M'envoyer un email à chaque don",       state:emailOnDon,      set:setEmailOnDon },
          { label:"Recevoir un récapitulatif chaque semaine", state:emailWeekly,  set:setEmailWeekly },
        ].map(({ label, state, set }) => (
          <div key={label} onClick={() => set(!state)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", cursor:"pointer" }}>
            <div style={{ width:16, height:16, border:`1px solid ${state?"var(--gold)":"var(--taupe)"}`, background:state?"var(--gold)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", color:"var(--paper)", flexShrink:0 }}>{state?"✓":""}</div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"0.95rem" }}>{label}</span>
          </div>
        ))}
      </div>

      {msg && <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color: msg.startsWith("✓") ? "var(--sage)" : "var(--terracotta)", marginBottom:16 }}>{msg}</p>}

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", paddingTop:24, borderTop:"1px dashed var(--bone)" }}>
        <button className="btn gold" onClick={() => save(true)} disabled={saving}>{saving ? "…" : "Enregistrer & publier"}</button>
        <button className="btn ghost" onClick={() => save(false)} disabled={saving}>Enregistrer brouillon</button>
        <button className="btn ghost" disabled={saving} onClick={async () => {
          await save(false);
          window.open(`/cagnotte/${slug}`, "_blank");
        }}>Aperçu de ma page →</button>
        <button className="btn ghost" onClick={() => router.push("/carnet/cagnotte")}>Retour au suivi</button>
      </div>
    </div>
  );
}
