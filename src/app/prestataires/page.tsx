import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import CoupleNav from "@/components/couple/CoupleNav";
import PrestataireSearch from "./PrestataireSearch";
import { PRO_CATEGORIES } from "@/lib/utils";

export default async function PrestatairesPage() {
  const session = await getSession();
  if (!session || session.role !== "couple") redirect("/connexion");

  const couple = await db.couple.findUnique({
    where:  { id: session.sub },
    select: { prenoms: true, weddingDate: true, weddingCity: true, guestCount: true, ambiances: true },
  });
  if (!couple) redirect("/connexion");

  return (
    <>
      <CoupleNav prenoms={couple.prenoms} />
      <PrestataireSearch
        coupleData={{
          weddingDate: couple.weddingDate?.toISOString() ?? null,
          weddingCity: couple.weddingCity,
          guestCount:  couple.guestCount,
          ambiances:   couple.ambiances,
        }}
        categories={Object.entries(PRO_CATEGORIES).map(([value, label]) => ({ value, label }))}
        isCouple={true}
      />
    </>
  );
}
