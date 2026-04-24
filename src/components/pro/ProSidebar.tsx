"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const MENU = [
  { href: "/dashboard",                label: "Tableau de bord",    section: "Gestion",     badge: false },
  { href: "/dashboard/paiements",      label: "Mes paiements",      section: "Gestion",     badge: false },
  { href: "/dashboard/messagerie",     label: "Messagerie",         section: "Gestion",     badge: true  },
  { href: "/dashboard/disponibilites", label: "Mes disponibilités", section: "Gestion",     badge: false },
  { href: "/dashboard/fiche",          label: "Ma fiche publique",  section: "Mon profil",  badge: false },
  { href: "/dashboard/portfolio",      label: "Portfolio & tarifs", section: "Mon profil",  badge: false },
  { href: "/dashboard/banque",         label: "Compte bancaire",    section: "Mon profil",  badge: false },
  { href: "/dashboard/statistiques",   label: "Statistiques",       section: "Mon profil",  badge: false },
  { href: "/dashboard/compte",         label: "Mon compte",         section: "Mon profil",  badge: false },
];

type Props = { name: string; category: string; initials: string; slug: string };

export default function ProSidebar({ name, category, initials, slug }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const [unread, setUnread] = useState(0);

  const fetchUnread = () => {
    fetch("/api/pro/unread")
      .then((r) => r.json())
      .then((d) => setUnread(d.count ?? 0))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, 30000);
    return () => clearInterval(t);
  }, []);

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

      <Link
        href={`/prestataires/${slug}`}
        target="_blank"
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", marginBottom: 20,
          background: "rgba(168,131,59,0.12)", border: "1px solid rgba(168,131,59,0.25)",
          borderLeft: "2px solid var(--gold)", color: "var(--gold)", textDecoration: "none",
          fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase",
        }}
      >
        <span style={{ fontSize: "1rem" }}>◎</span>
        Aperçu ma fiche →
      </Link>

      {["Gestion", "Mon profil"].map((section) => (
        <div key={section}>
          <div className="menu-label">{section}</div>
          <ul className="menu-list">
            {MENU.filter((m) => m.section === section).map(({ href, label, badge }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`menu-item${pathname === href ? " active" : ""}`}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none" }}
                >
                  <span>{label}</span>
                  {badge && unread > 0 && (
                    <span className="menu-badge">{unread > 9 ? "9+" : unread}</span>
                  )}
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
