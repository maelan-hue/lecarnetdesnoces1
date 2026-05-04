import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import ManualEntryForm from "@/components/couple/ManualEntryForm";

export default async function ExternePage() {
  const session = await getSession();
  if (!session || session.role !== "couple") redirect("/connexion");

  const couple = await db.couple.findUnique({
    where: { id: session.sub },
    select: { weddingDate: true },
  });

  const defaultDate = couple?.weddingDate
    ? couple.weddingDate.toISOString().split("T")[0]
    : undefined;

  return <ManualEntryForm mode="cas-c" defaultDate={defaultDate} />;
}
