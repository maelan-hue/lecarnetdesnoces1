import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type BulkGuestInput = {
  firstName: string; lastName: string;
  address?: string; diet?: string; group?: string;
  presence?: "PRESENT" | "ABSENT" | "PENDING";
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { guests } = await req.json() as { guests: BulkGuestInput[] };
  if (!Array.isArray(guests) || guests.length === 0) {
    return NextResponse.json({ error: "Aucun invité à importer." }, { status: 400 });
  }

  const valid = guests.filter((g) => g.firstName?.trim() && g.lastName?.trim());
  if (valid.length === 0) {
    return NextResponse.json({ error: "Aucun invité valide (prénom et nom requis)." }, { status: 400 });
  }

  const created = await db.guest.createMany({
    data: valid.map((g) => ({
      coupleId:  session.sub,
      firstName: g.firstName.trim(),
      lastName:  g.lastName.trim(),
      address:   g.address?.trim() || null,
      diet:      g.diet?.trim() || null,
      group:     g.group?.trim() || null,
      presence:  g.presence || "PENDING",
    })),
  });

  return NextResponse.json({ count: created.count }, { status: 201 });
}
