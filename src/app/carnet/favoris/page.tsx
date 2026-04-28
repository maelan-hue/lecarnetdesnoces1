import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import FavorisClient from "./FavorisClient";
import { PRO_CATEGORIES } from "@/lib/utils";

export default async function FavorisPage() {
  const session = await getSession();
  if (!session || session.role !== "couple") redirect("/connexion");

  const relations = await db.vendorRelation.findMany({
    where:   { coupleId: session.sub },
    include: {
      pro: {
        select: {
          id: true, name: true, slug: true, category: true,
          tagline: true, city: true, profilePhoto: true,
          tarifs: { orderBy: { position: "asc" }, take: 1, select: { priceFrom: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Grouper par catégorie
  const byCategory: Record<string, typeof relations> = {};
  for (const rel of relations) {
    if (!byCategory[rel.category]) byCategory[rel.category] = [];
    byCategory[rel.category].push(rel);
  }

  const categories = Object.keys(byCategory).map((cat) => ({
    key:      cat,
    label:    PRO_CATEGORIES[cat] ?? cat,
    relations: byCategory[cat],
  }));

  return (
    <FavorisClient
      categories={categories}
      totalCount={relations.length}
    />
  );
}
