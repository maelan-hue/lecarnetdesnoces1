import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import CagnotteConfigClient from "./CagnotteConfigClient";

export default async function CagnotteConfigPage() {
  const session = await getSession();
  if (!session || session.role !== "couple") redirect("/connexion");

  // Créer la cagnotte si elle n'existe pas encore
  let cagnotte = await db.cagnotte.findUnique({
    where:   { coupleId: session.sub },
    include: { dreams: { orderBy: { sortOrder:"asc" } }, program: { orderBy: { sortOrder:"asc" } } },
  });

  if (!cagnotte) {
    const couple = await db.couple.findUnique({ where:{ id:session.sub }, select:{ prenoms:true, weddingDate:true } });
    const year   = couple?.weddingDate ? new Date(couple.weddingDate).getFullYear() : new Date().getFullYear();
    const { slugify } = await import("@/lib/utils");
    const baseSlug    = slugify(`${couple?.prenoms ?? "mon-mariage"} ${year}`);
    let slug = baseSlug; let i = 1;
    while (await db.cagnotte.findUnique({ where:{ slug } })) slug = `${baseSlug}-${i++}`;

    cagnotte = await db.cagnotte.create({
      data:    { coupleId: session.sub, slug, title:"", status:"DRAFT" },
      include: { dreams: true, program: true },
    });
  }

  return (
    <CagnotteConfigClient
      initial={{
        id:              cagnotte.id,
        slug:            cagnotte.slug,
        title:           cagnotte.title,
        subtitle:        cagnotte.subtitle ?? "",
        story:           cagnotte.story ?? "",
        photoUrl:        cagnotte.photoUrl ?? "",
        status:          cagnotte.status,
        showGuestbook:   cagnotte.showGuestbook,
        allowAnonymous:  cagnotte.allowAnonymous,
        emailOnDonation: cagnotte.emailOnDonation,
        emailWeeklyRecap:cagnotte.emailWeeklyRecap,
        dreams:          cagnotte.dreams,
        program:         cagnotte.program,
      }}
    />
  );
}
