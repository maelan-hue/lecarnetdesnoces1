import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const guests = await db.guest.findMany({
    where: { coupleId: session.sub },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(guests);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { firstName, lastName, address, diet, presence, notes, group } = await req.json();
  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "Prénom et nom obligatoires." }, { status: 400 });
  }

  const guest = await db.guest.create({
    data: {
      coupleId: session.sub,
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      address:   address?.trim() || null,
      diet:      diet || null,
      presence:  presence || "PENDING",
      notes:     notes?.trim() || null,
      group:     group || null,
    },
  });
  return NextResponse.json(guest, { status: 201 });
}
