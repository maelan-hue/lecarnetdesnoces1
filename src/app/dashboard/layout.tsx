import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import ProSidebar from "@/components/pro/ProSidebar";
import { PRO_CATEGORIES } from "@/lib/utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "pro") redirect("/connexion-pro");

  const pro = await db.pro.findUnique({ where: { id: session.sub }, select: { name: true, category: true, status: true, slug: true, profilePhoto: true } });
  if (!pro) redirect("/connexion-pro");
  if (pro.status !== "ACTIVE") redirect("/connexion-pro");

  const initials = pro.name.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const categoryLabel = PRO_CATEGORIES[pro.category] ?? pro.category;

  return (
    <div className="pro-layout">
      <ProSidebar name={pro.name} category={categoryLabel} initials={initials} slug={pro.slug} profilePhoto={pro.profilePhoto} />
      <main className="pro-main">{children}</main>
    </div>
  );
}
