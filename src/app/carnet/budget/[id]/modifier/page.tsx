import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import ManualEntryForm from "@/components/couple/ManualEntryForm";

type Props = { params: Promise<{ id: string }> };

export default async function ModifierPage({ params }: Props) {
  const { id }  = await params;
  const session = await getSession();
  if (!session || session.role !== "couple") redirect("/connexion");

  const entry = await db.manualVendorEntry.findFirst({ where: { id, coupleId: session.sub } });
  if (!entry) redirect("/carnet/budget");

  return (
    <ManualEntryForm
      mode={entry.isExternal ? "cas-c" : "cas-b"}
      preFilledProId={entry.proId ?? undefined}
      preFilledName={entry.vendorName}
      preFilledCategory={entry.vendorCategory}
      entryId={id}
      initialData={{
        vendorName:     entry.vendorName,
        vendorCategory: entry.vendorCategory,
        vendorCity:     entry.vendorCity ?? "",
        vendorEmail:    entry.vendorEmail ?? "",
        vendorPhone:    entry.vendorPhone ?? "",
        vendorWebsite:  entry.vendorWebsite ?? "",
        totalAmount:    entry.totalAmount,
        depositAmount:  entry.depositAmount,
        depositPaidAt:  entry.depositPaidAt?.toISOString().split("T")[0] ?? "",
        balanceDueDate: entry.balanceDueDate?.toISOString().split("T")[0] ?? "",
        prestationDate: entry.prestationDate?.toISOString().split("T")[0] ?? "",
        paymentMethod:  entry.paymentMethod ?? "",
        status:         entry.status,
        notes:          entry.notes ?? "",
      }}
    />
  );
}
