import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Chemins nécessitant une session couple
const COUPLE_PATHS = ["/carnet", "/invites", "/messages/", "/messages/nouveau", "/compte"];
// Chemins nécessitant une session pro
const PRO_PATHS    = ["/dashboard"];
// Chemins nécessitant une session admin
const ADMIN_PATHS  = ["/admin/dashboard"];
// Pages de connexion — jamais protégées
const LOGIN_PAGES  = ["/connexion", "/connexion-pro", "/admin/connexion"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pages de connexion : toujours accessibles
  if (LOGIN_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // /prestataires/* : page publique — jamais protégée
  if (pathname.startsWith("/prestataires")) return NextResponse.next();

  const isCouplePath = COUPLE_PATHS.some((p) => pathname === p || pathname.startsWith(p));
  const isProPath    = PRO_PATHS.some((p)    => pathname === p || pathname.startsWith(p + "/"));
  const isAdminPath  = ADMIN_PATHS.some((p)  => pathname === p || pathname.startsWith(p + "/"));

  if (!isCouplePath && !isProPath && !isAdminPath) return NextResponse.next();

  const token   = req.cookies.get("session")?.value;
  if (!token) return redirectToLogin(req, pathname);

  const payload = await verifyToken(token);
  if (!payload)  return redirectToLogin(req, pathname);

  if (isCouplePath && payload.role !== "couple") return redirectToLogin(req, pathname);
  if (isProPath    && payload.role !== "pro")    return redirectToLogin(req, pathname);
  if (isAdminPath  && payload.role !== "admin")  return redirectToLogin(req, pathname);

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest, from: string) {
  const url = req.nextUrl.clone();
  if (from.startsWith("/admin")) {
    url.pathname = "/admin/connexion";
  } else if (PRO_PATHS.some((p) => from === p || from.startsWith(p + "/"))) {
    url.pathname = "/connexion-pro";
  } else {
    url.pathname = "/connexion";
  }
  url.searchParams.set("from", from);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/carnet/:path*",
    "/invites/:path*",
    "/messages",
    "/messages/:path*",
    "/compte/:path*",
    "/compte",
    "/dashboard/:path*",
    "/admin/dashboard/:path*",
    "/connexion",
    "/connexion-pro",
    "/admin/connexion",
  ],
};
