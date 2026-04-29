import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import BudgetClient from "./BudgetClient";
import { PRO_CATEGORIES } from "@/lib/utils";

export default async function BudgetPage() {
  const session = await getSession();
  if (!session || session.role !== "couple") redirect("/connexion");

  const couple = await db.couple.findUnique({
    where: { id: session.sub },
    select: { budgetEstimate: true, prenoms: true },
  });

  // Cas A : liens de paiement Stripe payés liés à ce couple
  const paidLinks = await db.paymentLink.findMany({
    where: {
      status: "PAID",
      coupleEmail: { not: "" },
      // On filtre via les conversations du couple pour identifier ses pros
      pro: {
        conversations: { some: { coupleId: session.sub } },
      },
    },
    include: { pro: { select: { id: true, name: true, category: true, city: true } } },
    orderBy: { paidAt: "desc" },
  });

  // Cas B + C : entrées manuelles
  const manual = await db.manualVendorEntry.findMany({
    where: { coupleId: session.sub },
    include: { pro: { select: { id: true, name: true, slug: true, category: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Agréger les catégories uniques
  const categories = new Set<string>();
  paidLinks.forEach((p) => categories.add(p.pro.category));
  manual.forEach((m) => categories.add(m.vendorCategory));

  // Sérialiser pour le client
  const data = {
    budgetEstimate: couple?.budgetEstimate ?? null,
    paidLinks: paidLinks.map((p) => ({
      id:            p.id,
      proId:         p.proId,
      proName:       p.pro.name,
      proCategory:   p.pro.category,
      proCity:       p.pro.city,
      totalAmount:   p.quoteTotal,
      depositAmount: p.amount,
      status:        "stripe" as const,
      label:         p.label,
      paidAt:        p.paidAt?.toISOString() ?? null,
    })),
    manual: manual.map((m) => ({
      id:            m.id,
      proId:         m.proId,
      proName:       m.pro?.name ?? null,
      proSlug:       m.pro?.slug ?? null,
      vendorName:    m.vendorName,
      vendorCategory:m.vendorCategory,
      vendorCity:    m.vendorCity,
      isExternal:    m.isExternal,
      totalAmount:   m.totalAmount,
      depositAmount: m.depositAmount,
      status:        m.status,
      paymentMethod: m.paymentMethod,
      notes:         m.notes,
    })),
    categories: [...categories],
    categoryLabels: PRO_CATEGORIES,
  };

  return <BudgetClient data={data} />;
}
