import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

const COMMISSION_PCT = 3;
const PAYOUT_FEE    = 25; // 0,25 € en centimes

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const cagnotte = await db.cagnotte.findUnique({
    where:   { coupleId: session.sub },
    include: { donations: { where: { status: "PAID" } } },
  });
  if (!cagnotte) return NextResponse.json({ error: "Cagnotte introuvable" }, { status: 404 });
  if (cagnotte.status !== "ACTIVE") return NextResponse.json({ error: "La cagnotte n'est pas active." }, { status: 400 });

  // Vérifier délai 7 jours après mariage
  const couple = await db.couple.findUnique({ where: { id: session.sub }, select: { weddingDate: true, prenoms: true, email: true } });
  if (couple?.weddingDate) {
    const unlockDate = new Date(couple.weddingDate);
    unlockDate.setDate(unlockDate.getDate() + 7);
    if (new Date() < unlockDate) {
      return NextResponse.json({ error: `Le retrait est disponible à partir du ${unlockDate.toLocaleDateString("fr-FR")}.` }, { status: 400 });
    }
  }

  const amountGross      = cagnotte.donations.reduce((s, d) => s + d.amountNet, 0);
  if (amountGross === 0) return NextResponse.json({ error: "Aucun don reçu." }, { status: 400 });

  const platformCommission = Math.round(amountGross * COMMISSION_PCT / 100);
  const amountNet          = amountGross - platformCommission - PAYOUT_FEE;

  const { iban } = await req.json();
  const ibanToUse = iban?.trim() || cagnotte.ibanStored;
  if (!ibanToUse) return NextResponse.json({ error: "IBAN requis." }, { status: 400 });

  // Enregistrer le retrait + fermer la cagnotte + sauvegarder l'IBAN
  const [withdrawal] = await db.$transaction([
    db.cagnotteWithdrawal.create({
      data: {
        cagnotteId:          cagnotte.id,
        amountGross,
        platformCommission,
        stripePayout:        PAYOUT_FEE,
        amountNet,
        ibanSnapshot:        ibanToUse,
        status:              "REQUESTED",
      },
    }),
    db.cagnotte.update({
      where: { id: cagnotte.id },
      data:  { status: "CLOSED", withdrawnAt: new Date(), ibanStored: ibanToUse },
    }),
  ]);

  // Email à l'admin pour traitement manuel du virement
  try {
    await resend.emails.send({
      from:    process.env.RESEND_FROM!,
      to:      process.env.ADMIN_EMAIL!,
      subject: `[Retrait cagnotte] ${couple?.prenoms} — ${(amountNet / 100).toLocaleString("fr-FR")} €`,
      html: `
        <h2>Demande de retrait cagnotte</h2>
        <p><strong>Couple :</strong> ${couple?.prenoms}</p>
        <p><strong>Email :</strong> ${couple?.email}</p>
        <p><strong>IBAN :</strong> ${ibanToUse}</p>
        <p><strong>Brut :</strong> ${(amountGross/100).toLocaleString("fr-FR")} €</p>
        <p><strong>Commission (3%) :</strong> ${(platformCommission/100).toLocaleString("fr-FR")} €</p>
        <p><strong>Frais virement :</strong> 0,25 €</p>
        <p><strong>Net à virer :</strong> <strong>${(amountNet/100).toLocaleString("fr-FR")} €</strong></p>
        <p><a href="${APP_URL}/admin/dashboard">Marquer comme traité</a></p>
      `,
    });
  } catch (e) { console.error("Email retrait failed:", e); }

  // Email de confirmation au couple
  try {
    await resend.emails.send({
      from:    process.env.RESEND_FROM!,
      to:      couple?.email ?? "",
      subject: `Votre retrait cagnotte est en cours — Le Carnet des noces`,
      html: `
        <p>Bonjour ${couple?.prenoms},</p>
        <p>Votre demande de virement a bien été reçue. Vous recevrez <strong>${(amountNet/100).toLocaleString("fr-FR")} €</strong> sur votre IBAN sous 2 à 3 jours ouvrés.</p>
        <p>Merci d'avoir utilisé Le Carnet des noces.</p>
      `,
    });
  } catch (e) { console.error("Email couple retrait failed:", e); }

  return NextResponse.json({ ok: true, withdrawal });
}
