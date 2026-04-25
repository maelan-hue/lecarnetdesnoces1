import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import DonationForm from "./DonationForm";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }> };

export default async function DonnerPage({ params }: Props) {
  const { slug } = await params;
  const cagnotte = await db.cagnotte.findUnique({
    where:   { slug },
    include: { dreams: { orderBy: { sortOrder: "asc" } } },
  });
  if (!cagnotte || cagnotte.status !== "ACTIVE") notFound();

  return (
    <div style={{ background:"var(--ivory)", minHeight:"100vh", padding:"30px 20px" }}>
      <nav style={{ textAlign:"center", marginBottom:28 }}>
        <Link href={`/cagnotte/${slug}`} style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"var(--mute)", fontSize:"0.85rem" }}>
          ← Retour à la page de {cagnotte.title || "la cagnotte"}
        </Link>
      </nav>
      <DonationForm
        slug={slug}
        cagnotteTitle={cagnotte.title}
        dreams={cagnotte.dreams.map((d) => ({ id: d.id, title: d.title }))}
        publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      />
    </div>
  );
}
