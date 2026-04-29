"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Sous-routes du carnet qui ont leur propre onglet nav
const CARNET_SUB_ROUTES = ["/carnet/cagnotte", "/carnet/budget", "/carnet/favoris"];

function isActive(pathname: string, href: string): boolean {
  if (!pathname.startsWith(href)) return false;
  // Pour "/carnet" uniquement : ne pas s'activer si on est sur une sous-route avec son propre onglet
  if (href === "/carnet") {
    return !CARNET_SUB_ROUTES.some((sub) => pathname.startsWith(sub));
  }
  return true;
}

const LINKS = [
  { href: "/carnet",           label: "Mon carnet",   unread: false },
  { href: "/invites",          label: "Invités",      unread: false },
  { href: "/prestataires",     label: "Prestataires", unread: false },
  { href: "/carnet/cagnotte",  label: "Cagnotte",     unread: false },
  { href: "/carnet/budget",    label: "Budget",       unread: false },
  { href: "/messages",         label: "Messages",     unread: true  },
  { href: "/compte",           label: "Mon compte",   unread: false },
];

export default function CoupleNav({ prenoms }: { prenoms: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [unread, setUnread] = useState(0);

  const fetchUnread = () => {
    fetch("/api/couple/unread")
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
    <nav className="couple-nav">
      <Link href="/" className="couple-nav-logo">
        Le Carnet <em>des noces</em>
      </Link>

      <div className="couple-nav-links">
        {LINKS.map(({ href, label, unread: showBadge }) => (
          <Link
            key={href}
            href={href}
            className={`couple-nav-link${isActive(pathname, href) ? " active" : ""}`}
            style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {label}
            {showBadge && unread > 0 && (
              <span style={{
                background: "var(--gold)", color: "var(--paper)",
                borderRadius: "100px", fontSize: "0.5rem", fontWeight: 600,
                padding: "1px 6px", lineHeight: 1.6, fontFamily: "'Jost',sans-serif",
                letterSpacing: "0.04em",
              }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="couple-nav-right">
        <span className="couple-nav-name">{prenoms}</span>
        <button
          onClick={handleLogout}
          className="btn ghost small"
          style={{ fontSize: "0.55rem", padding: "6px 12px" }}
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
