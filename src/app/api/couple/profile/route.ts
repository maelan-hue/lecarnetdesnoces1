import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const couple = await db.couple.findUnique({
    where:  { id: session.sub },
    select: { weddingDate: true, weddingCity: true, weddingVenue: true, guestCount: true, budgetEstimate: true },
  });
  return NextResponse.json(couple);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const allowed = ["weddingDate", "weddingCity", "weddingVenue", "guestCount", "budgetEstimate", "welcomeBannerDismissed"];
  const body    = await req.json();
  const data    = Object.fromEntries(
    Object.entries(body)
      .filter(([k]) => allowed.includes(k))
      .map(([k, v]) => {
        if (k === "weddingDate") return [k, v ? new Date(v as string) : null];
        if (k === "guestCount" || k === "budgetEstimate") return [k, v ? Number(v) : null];
        return [k, v];
      })
  );

  const couple = await db.couple.update({ where: { id: session.sub }, data });
  return NextResponse.json({ ok: true, couple });
}
