import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const COUPLE_PATHS = ["/carnet", "/invites", "/messages", "/prestataire", "/onboarding/fin"];
const PRO_PATHS    = ["/dashboard", "/paiements", "/messagerie", "/fiche", "/disponibilites", "/portfolio", "/banque", "/statistiques"];
const ADMIN_PATHS  = ["/admin"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session")?.value;

  const isCouplePath = COUPLE_PATHS.some((p) => pathname.startsWith(p));
  const isProPath    = PRO_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPath  = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!isCouplePath && !isProPath && !isAdminPath) return NextResponse.next();

  if (!token) return redirectToLogin(req, pathname);

  const payload = await verifyToken(token);
  if (!payload) return redirectToLogin(req, pathname);

  if (isCouplePath && payload.role !== "couple") return redirectToLogin(req, pathname);
  if (isProPath    && payload.role !== "pro")    return redirectToLogin(req, pathname);
  if (isAdminPath  && payload.role !== "admin")  return redirectToLogin(req, pathname);

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest, from: string) {
  const url = req.nextUrl.clone();
  if (from.startsWith("/admin")) {
    url.pathname = "/admin/connexion";
  } else if (COUPLE_PATHS.some((p) => from.startsWith(p))) {
    url.pathname = "/connexion";
  } else {
    url.pathname = "/connexion-pro";
  }
  url.searchParams.set("from", from);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/carnet/:path*",
    "/invites/:path*",
    "/messages/:path*",
    "/prestataire/:path*",
    "/onboarding/fin",
    "/dashboard/:path*",
    "/paiements/:path*",
    "/messagerie/:path*",
    "/fiche/:path*",
    "/disponibilites/:path*",
    "/portfolio/:path*",
    "/banque/:path*",
    "/statistiques/:path*",
    "/admin/:path*",
  ],
};
