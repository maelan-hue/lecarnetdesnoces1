import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import CoupleNav from "@/components/couple/CoupleNav";

export default async function PrestatairesLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "couple") redirect("/connexion");
  const couple = await db.couple.findUnique({ where: { id: session.sub }, select: { prenoms: true } });
  if (!couple) redirect("/connexion");
  return <><CoupleNav prenoms={couple.prenoms} />{children}</>;
}
