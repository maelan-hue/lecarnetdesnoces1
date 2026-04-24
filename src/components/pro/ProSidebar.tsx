"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const MENU = [
  { href: "/dashboard",               label: "Tableau de bord",   section: "Gestion" },
  { href: "/dashboard/paiements",     label: "Mes paiements",     section: "Gestion" },
  { href: "/dashboard/messagerie",    label: "Messagerie",        section: "Gestion" },
  { href: "/dashboard/disponibilites",label: "Mes disponibilités",section: "Gestion" },
  { href: "/dashboard/fiche",         label: "Ma fiche publique", section: "Mon profil" },
  { href: "/dashboard/portfolio",     label: "Portfolio & tarifs",section: "Mon profil" },
  { href: "/dashboard/banque",        label: "Compte bancaire",   section: "Mon profil" },
  { href: "/dashboard/statistiques",  label: "Statistiques",      section: "Mon profil" },
];

type Props = { name: string; category: string; initials: string };

export default function ProSidebar({ name, category, initials }: Props) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const sections = ["Gestion", "Mon profil"];

  return (
    <aside className="pro-side">
      <div className="pro-profile">
        <div className="pro-avatar">{initials}</div>
        <div>
          <div className="pro-name">{name}</div>
          <div className="pro-role">{category}</div>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section}>
          <div className="menu-label">{section}</div>
          <ul className="menu-list">
            {MENU.filter((m) => m.section === section).map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={`menu-item${pathname === href ? " active" : ""}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none" }}>
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <button onClick={handleLogout} className="btn ghost small" style={{ width: "100%", marginTop: 10, fontSize: "0.58rem", borderColor: "rgba(250,248,244,0.2)", color: "rgba(250,248,244,0.5)", justifyContent: "center" }}>
        Déconnexion
      </button>
    </aside>
  );
}
