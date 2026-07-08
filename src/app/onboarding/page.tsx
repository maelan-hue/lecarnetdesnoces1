"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type OnboardingData = {
  weddingDate: string;
  weddingSeason: string;
  weddingCity: string;
  guestCount: number;
  ambiances: string[];
  budgetEstimate: number;
  budgetRange: string;
  planningStage: string;
  prenoms: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const BUDGET_RANGES = [
  { key: "moins-15k",  label: "Moins de 15 000 €" },
  { key: "15k-30k",    label: "15 000 – 30 000 €" },
  { key: "30k-50k",    label: "30 000 – 50 000 €" },
  { key: "plus-50k",   label: "Plus de 50 000 €" },
];

const PLANNING_STAGES = [
  { key: "just_engaged", label: "On vient de se fiancer",   desc: "Rien n'est encore réservé. On veut découvrir les étapes à suivre." },
  { key: "started",      label: "On a déjà commencé",       desc: "Quelques prestataires réservés, le reste à caler." },
  { key: "advanced",     label: "On est bien avancés",      desc: "On veut surtout centraliser budget, paiements et contacts." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    weddingDate: "", weddingSeason: "", weddingCity: "",
    guestCount: 120, ambiances: [], budgetEstimate: 25000, budgetRange: "",
    planningStage: "", prenoms: "", email: "", password: "", confirmPassword: "",
  });

  const set = (key: keyof OnboardingData, value: unknown) =>
    setData((d) => ({ ...d, [key]: value }));

  const next = () => { setError(""); setStep((s) => s + 1); };
  const prev = () => { setError(""); setStep((s) => s - 1); };

  const handleRegister = async () => {
    setError("");
    if (!data.prenoms.trim())         return setError("Indiquez vos prénoms.");
    if (!data.email.trim())           return setError("Indiquez votre email.");
    if (data.password.length < 8)     return setError("Le mot de passe doit faire au moins 8 caractères.");
    if (data.password !== data.confirmPassword) return setError("Les mots de passe ne correspondent pas.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/couple/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Une erreur est survenue."); return; }
      router.push("/carnet");
    } finally {
      setLoading(false);
    }
  };

  const dots = Array.from({ length: 4 }, (_, i) => {
    if (i + 1 < step)  return "done";
    if (i + 1 === step) return "current";
    return "";
  });

  const Progress = () => (
    <div className="onb-progress">
      {dots.map((state, i) => <div key={i} className={`onb-dot${state ? " " + state : ""}`} />)}
    </div>
  );

  // ── Q1 : Date ──────────────────────────────────────────────
  if (step === 1) return (
    <div className="container narrow" style={{ paddingTop: 80 }}>
      <Progress />
      <div className="onb-step">Question 1 sur 4</div>
      <h2 className="onb-question">Dites-nous, <em>à quand</em> ce grand jour ?</h2>
      <p className="onb-hint">Votre date nous permet de créer un rétroplanning sur mesure — et de vous montrer les prestataires encore disponibles.</p>

      <div className="onb-field">
        <label className="field-label">Date de votre mariage</label>
        <input
          type="date"
          value={data.weddingDate}
          onChange={(e) => set("weddingDate", e.target.value)}
        />
      </div>

      <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", marginBottom: 10 }}>ou choisissez une saison</p>
      <div className="onb-options-grid">
        {["Printemps", "Été", "Automne", "Hiver"].map((s) => (
          <div
            key={s}
            className={`onb-option${data.weddingSeason === s ? " selected" : ""}`}
            onClick={() => { set("weddingSeason", s); set("weddingDate", ""); }}
          >
            <span className="onb-option-label">{s}</span>
            <div className="onb-option-mark">{data.weddingSeason === s ? "✓" : ""}</div>
          </div>
        ))}
      </div>

      <div className="onb-nav">
        <Link href="/" className="onb-skip" style={{ textDecoration: "none" }}>Retour</Link>
        <button className="btn gold" onClick={next}>Continuer</button>
      </div>
    </div>
  );

  // ── Q2 : Invités ───────────────────────────────────────────
  if (step === 2) return (
    <div className="container narrow" style={{ paddingTop: 80 }}>
      <Progress />
      <div className="onb-step">Question 2 sur 4</div>
      <h2 className="onb-question"><em>Combien</em> serez-vous ?</h2>
      <p className="onb-hint">Un chiffre approximatif suffit. Il s&apos;affinera au fil de vos choix — et les prestataires l&apos;adaptent.</p>

      <div className="slider-big">
        <div className="slider-big-value">{data.guestCount}</div>
        <input
          type="range" min={20} max={300} value={data.guestCount}
          onChange={(e) => set("guestCount", Number(e.target.value))}
        />
        <div className="slider-big-range"><span>20 invités</span><span>300 invités</span></div>
      </div>

      <div className="onb-nav">
        <button className="onb-skip" onClick={prev}>Retour</button>
        <button className="btn gold" onClick={next}>Continuer</button>
      </div>
    </div>
  );

  // ── Q3 : Budget ────────────────────────────────────────────
  if (step === 3) return (
    <div className="container narrow" style={{ paddingTop: 80 }}>
      <Progress />
      <div className="onb-step">Question 3 sur 4</div>
      <h2 className="onb-question">Quel <em>budget</em> envisagez-vous ?</h2>
      <p className="onb-hint">Une estimation suffit — vous pourrez l&apos;ajuster à tout moment. Elle nous permet de vous proposer les prestataires adaptés, sans surprise.</p>

      <div className="slider-big">
        <div className="slider-big-value">{data.budgetEstimate.toLocaleString("fr-FR")} €</div>
        <input
          type="range" min={5000} max={100000} step={1000} value={data.budgetEstimate}
          onChange={(e) => { set("budgetEstimate", Number(e.target.value)); set("budgetRange", ""); }}
        />
        <div className="slider-big-range"><span>5 000 €</span><span>100 000 €</span></div>
      </div>

      <div className="tip" style={{ marginBottom: 24 }}>
        🌿 <strong>Repère —</strong> Pour 120 invités dans le Roussillon, la moyenne se situe entre 22 000 € et 32 000 €. Les plus gros postes : lieu, traiteur et alcools (~60 % du budget).
      </div>

      <p className="serif" style={{ fontStyle: "italic", color: "var(--mute)", marginBottom: 10 }}>ou choisissez une fourchette</p>
      <div className="onb-options-grid">
        {BUDGET_RANGES.map(({ key, label }) => (
          <div
            key={key}
            className={`onb-option${data.budgetRange === key ? " selected" : ""}`}
            onClick={() => set("budgetRange", key)}
          >
            <span className="onb-option-label">{label}</span>
            <div className="onb-option-mark">{data.budgetRange === key ? "✓" : ""}</div>
          </div>
        ))}
      </div>

      <div className="onb-nav">
        <button className="onb-skip" onClick={prev}>Retour</button>
        <button className="btn gold" onClick={next}>Continuer</button>
      </div>
    </div>
  );

  // ── Q4 : Avancement ────────────────────────────────────────
  if (step === 4) return (
    <div className="container narrow" style={{ paddingTop: 80 }}>
      <Progress />
      <div className="onb-step">Question 4 sur 4</div>
      <h2 className="onb-question">Où en êtes-vous dans <em>l&apos;organisation</em> ?</h2>
      <p className="onb-hint">Cela nous aide à personnaliser votre to-do et à vous indiquer les étapes à prioriser dès aujourd&apos;hui.</p>

      <div className="onb-options">
        {PLANNING_STAGES.map(({ key, label, desc }) => (
          <div
            key={key}
            className={`onb-option${data.planningStage === key ? " selected" : ""}`}
            onClick={() => set("planningStage", key)}
          >
            <div>
              <div className="onb-option-label" style={{ marginBottom: 4 }}>{label}</div>
              <div className="onb-option-desc">{desc}</div>
            </div>
            <div className="onb-option-mark">{data.planningStage === key ? "✓" : ""}</div>
          </div>
        ))}
      </div>

      <div className="onb-nav">
        <button className="onb-skip" onClick={prev}>Retour</button>
        <button
          className="btn gold"
          onClick={next}
          disabled={!data.planningStage}
          style={{ opacity: data.planningStage ? 1 : 0.5 }}
        >
          Composer mon carnet
        </button>
      </div>
    </div>
  );

  // ── CRÉATION DE COMPTE ─────────────────────────────────────
  return (
    <div className="container narrow" style={{ paddingTop: 80 }}>
      <div className="onb-progress">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="onb-dot done" />)}
      </div>
      <div className="onb-step">Dernière étape</div>
      <h2 className="onb-question">Un <em>instant</em>, nous tissons votre carnet.</h2>
      <p className="onb-hint">Créez votre compte pour sauvegarder votre projet et accéder à votre carnet personnalisé.</p>

      {/* Récap */}
      <div className="signup-preview">
        <div className="preview-lbl">Votre projet</div>
        <div className="preview-grid">
          <div className="preview-item">
            <div className="preview-icon">◇</div>
            <div>
              <div className="preview-title">
                {data.weddingDate
                  ? new Date(data.weddingDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                  : data.weddingSeason || "Date à définir"}
              </div>
              <div className="preview-text">
                {`${data.guestCount} invités`}
              </div>
            </div>
          </div>
          <div className="preview-item">
            <div className="preview-icon">§</div>
            <div>
              <div className="preview-title">Budget estimé</div>
              <div className="preview-text">{data.budgetEstimate.toLocaleString("fr-FR")} €</div>
            </div>
          </div>
          <div className="preview-item">
            <div className="preview-icon">✦</div>
            <div>
              <div className="preview-title">Votre carnet privé</div>
              <div className="preview-text">Seuls vous deux y avez accès · sauvegardé en temps réel</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="onb-field">
        <label className="field-label">Vos prénoms</label>
        <input type="text" placeholder="Sophie &amp; Marc" value={data.prenoms} onChange={(e) => set("prenoms", e.target.value)} style={{ fontSize: "1.4rem" }} />
      </div>
      <div className="onb-field">
        <label className="field-label">Votre email</label>
        <input type="email" placeholder="sophie@email.com" value={data.email} onChange={(e) => set("email", e.target.value)} style={{ fontSize: "1.4rem" }} />
      </div>
      <div className="onb-field">
        <label className="field-label">Mot de passe</label>
        <input type="password" placeholder="8 caractères minimum" value={data.password} onChange={(e) => set("password", e.target.value)} style={{ fontSize: "1.4rem" }} />
      </div>
      <div className="onb-field">
        <label className="field-label">Confirmer le mot de passe</label>
        <input type="password" value={data.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} style={{ fontSize: "1.4rem" }} />
      </div>

      <p className="serif" style={{ fontStyle: "italic", fontSize: "0.88rem", color: "var(--mute)", lineHeight: 1.5, marginBottom: 24, borderLeft: "2px solid var(--taupe)", paddingLeft: 14 }}>
        En créant votre compte, vous acceptez les conditions d&apos;utilisation. Votre carnet est privé par défaut.
      </p>

      {error && (
        <p style={{ color: "var(--terracotta)", fontFamily: "var(--serif)", fontStyle: "italic", marginBottom: 16 }}>{error}</p>
      )}

      <div className="onb-nav">
        <button className="onb-skip" onClick={prev}>Retour</button>
        <button className="btn gold" onClick={handleRegister} disabled={loading}>
          {loading ? "Création…" : "Créer mon compte & voir mon carnet"}
        </button>
      </div>

      <p style={{ textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--mute)", marginTop: 30, fontSize: "0.92rem" }}>
        — ou — <br /><br />
        <Link href="/connexion" style={{ color: "var(--gold)" }}>J&apos;ai déjà un compte</Link>
      </p>
    </div>
  );
}
