"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/carnet",       label: "Mon carnet" },
  { href: "/invites",      label: "Invités" },
  { href: "/prestataires", label: "Prestataires" },
  { href: "/messages",     label: "Messages" },
];

export default function CoupleNav({ prenoms }: { prenoms: string }) {
  const pathname = usePathname();
  const router   = useRouter();

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
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`couple-nav-link${pathname.startsWith(href) ? " active" : ""}`}
          >
            {label}
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
