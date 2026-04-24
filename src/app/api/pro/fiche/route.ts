import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const pro = await db.pro.findUnique({ where: { id: session.sub }, select: { name:true, tagline:true, bio:true, ambiances:true, styleKeywords:true, city:true, department:true, radiusKm:true, portfolioPhotos:true, category:true, slug:true } });
  return NextResponse.json({ pro });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const data = await req.json();
  const allowed = ["name","tagline","bio","ambiances","styleKeywords","city","department","radiusKm"];
  const update = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  const pro = await db.pro.update({ where: { id: session.sub }, data: update });
  return NextResponse.json({ pro });
}
