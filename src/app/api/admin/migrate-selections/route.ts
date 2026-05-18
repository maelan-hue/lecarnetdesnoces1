import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// Migre vendor_relations → vendor_selections
// FAVORITE → selection, RETAINED → confirmed
// À exécuter une fois depuis l'admin, puis supprimer cet endpoint.

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const relations = await db.vendorRelation.findMany();
  let migrated = 0;
  let skipped  = 0;

  for (const rel of relations) {
    const status = rel.status === "RETAINED" ? "confirmed" : "selection";
    try {
      await db.vendorSelection.upsert({
        where:  { coupleId_proId: { coupleId: rel.coupleId, proId: rel.proId } },
        update: {},
        create: {
          coupleId:    rel.coupleId,
          proId:       rel.proId,
          status,
          category:    rel.category,
          addedAt:     rel.createdAt,
          confirmedAt: rel.status === "RETAINED" ? rel.updatedAt : null,
        },
      });
      migrated++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, total: relations.length, migrated, skipped });
}
