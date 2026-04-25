import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { status } = await req.json(); // "ACTIVE" | "DRAFT" | "CLOSED"
  if (!["ACTIVE","DRAFT","CLOSED"].includes(status)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

  const cagnotte = await db.cagnotte.update({
    where: { coupleId: session.sub },
    data:  { status },
  });
  return NextResponse.json(cagnotte);
}
