import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DonationForm from "./DonationForm";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }> };

export default async function DonnerPage({ params }: Props) {
  const { slug }  = await params;
  const session   = await getSession();

  const cagnotte = await db.cagnotte.findUnique({
    where:   { slug },
    include: { dreams: { orderBy: { sortOrder: "asc" } } },
  });

  if (!cagnotte) notFound();

  const isOwner = session?.role === "couple" && cagnotte.coupleId === session.sub;
  if (cagnotte.status !== "ACTIVE" && !isOwner) notFound();

  const isDraft = cagnotte.status === "DRAFT";

  return (
    <div style={{ background:"var(--ivory)", minHeight:"100vh", padding:"30px 20px" }}>

      {/* Bannière brouillon */}
      {isDraft && (
        <div style={{ background:"var(--ink)", color:"var(--paper)", padding:"10px 24px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, flexWrap:"wrap", maxWidth:580, margin:"0 auto 20px" }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"0.88rem", color:"rgba(250,248,244,0.8)" }}>
            Aperçu brouillon — le formulaire est désactivé.
          </span>
          <Link href="/carnet/cagnotte/config" style={{ fontSize:"0.62rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--gold)", textDecoration:"none" }}>
            Modifier →
          </Link>
        </div>
      )}

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
        disabled={isDraft}
      />
    </div>
  );
}
