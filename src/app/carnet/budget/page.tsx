import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import BudgetClient from "./BudgetClient";
import { PRO_CATEGORIES } from "@/lib/utils";

export default async function BudgetPage() {
  const session = await getSession();
  if (!session || session.role !== "couple") redirect("/connexion");

  const couple = await db.couple.findUnique({
    where: { id: session.sub },
    select: { budgetEstimate: true, prenoms: true },
  });

  const manual = await db.manualVendorEntry.findMany({
    where: { coupleId: session.sub },
    include: { pro: { select: { id: true, name: true, slug: true, category: true } } },
    orderBy: { createdAt: "desc" },
  });

  const categories = [...new Set(manual.map((m) => m.vendorCategory))];

  const data = {
    budgetEstimate: couple?.budgetEstimate ?? null,
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
    categories,
    categoryLabels: PRO_CATEGORIES,
  };

  return <BudgetClient data={data} />;
}
