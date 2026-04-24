"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const MENU = [
  { href: "/dashboard",                label: "Tableau de bord",    section: "Gestion" },
  { href: "/dashboard/paiements",      label: "Mes paiements",      section: "Gestion" },
  { href: "/dashboard/messagerie",     label: "Messagerie",         section: "Gestion" },
  { href: "/dashboard/disponibilites", label: "Mes disponibilités", section: "Gestion" },
  { href: "/dashboard/fiche",          label: "Ma fiche publique",  section: "Mon profil" },
  { href: "/dashboard/portfolio",      label: "Portfolio & tarifs", section: "Mon profil" },
  { href: "/dashboard/banque",         label: "Compte bancaire",    section: "Mon profil" },
  { href: "/dashboard/statistiques",   label: "Statistiques",       section: "Mon profil" },
  { href: "/dashboard/compte",         label: "Mon compte",         section: "Mon profil" },
];

type Props = { name: string; category: string; initials: string; slug: string };

export default function ProSidebar({ name, category, initials, slug }: Props) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <aside className="pro-side">
      <div className="pro-profile">
        <div className="pro-avatar">{initials}</div>
        <div>
          <div className="pro-name">{name}</div>
          <div className="pro-role">{category}</div>
        </div>
      </div>

      {/* Aperçu fiche publique */}
      <Link
        href={`/prestataires/${slug}`}
        target="_blank"
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", marginBottom: 20,
          background: "rgba(168,131,59,0.12)",
          border: "1px solid rgba(168,131,59,0.25)",
          borderLeft: "2px solid var(--gold)",
          color: "var(--gold)", textDecoration: "none",
          fontSize: "0.72rem", letterSpacing: "0.1em",
          textTransform: "uppercase", transition: "all 0.2s",
        }}
      >
        <span style={{ fontSize: "1rem" }}>◎</span>
        Aperçu ma fiche →
      </Link>

      <div className="menu-label">Gestion</div>
      <ul className="menu-list">
        {MENU.filter((m) => m.section === "Gestion").map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className={`menu-item${pathname === href ? " active" : ""}`} style={{ display: "flex", justifyContent: "space-between", textDecoration: "none" }}>
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="menu-label">Mon profil</div>
      <ul className="menu-list">
        {MENU.filter((m) => m.section === "Mon profil").map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className={`menu-item${pathname === href ? " active" : ""}`} style={{ display: "flex", justifyContent: "space-between", textDecoration: "none" }}>
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <button onClick={handleLogout} className="btn ghost small" style={{ width: "100%", marginTop: 10, fontSize: "0.58rem", borderColor: "rgba(250,248,244,0.2)", color: "rgba(250,248,244,0.5)", justifyContent: "center" }}>
        Déconnexion
      </button>
    </aside>
  );
}
