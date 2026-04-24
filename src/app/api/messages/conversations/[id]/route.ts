import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendNewMessageEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

// GET — messages d'une conversation + reset compteur non-lus
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "couple" && session.role !== "pro")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const conv = await db.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      couple:   { select: { prenoms: true, email: true } },
      pro:      { select: { name: true, email: true, category: true, slug: true } },
    },
  });

  if (!conv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Vérifier l'accès
  const hasAccess =
    (session.role === "couple" && conv.coupleId === session.sub) ||
    (session.role === "pro"    && conv.proId    === session.sub);
  if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Reset compteur non-lus
  await db.conversation.update({
    where: { id },
    data:  session.role === "couple"
      ? { unreadByCouple: 0 }
      : { unreadByPro:    0 },
  });

  return NextResponse.json(conv);
}

// POST — envoyer un message dans une conversation existante
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "couple" && session.role !== "pro")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Message vide." }, { status: 400 });

  const conv = await db.conversation.findUnique({
    where: { id },
    include: {
      couple: { select: { prenoms: true, email: true } },
      pro:    { select: { name: true, email: true } },
    },
  });

  if (!conv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const hasAccess =
    (session.role === "couple" && conv.coupleId === session.sub) ||
    (session.role === "pro"    && conv.proId    === session.sub);
  if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const senderRole = session.role === "couple" ? "COUPLE" : "PRO";

  const message = await db.message.create({
    data: { conversationId: id, senderRole, body: body.trim() },
  });

  // Mettre à jour la conversation + incrémenter non-lus du destinataire
  await db.conversation.update({
    where: { id },
    data: {
      updatedAt: new Date(),
      ...(senderRole === "COUPLE"
        ? { unreadByPro:    { increment: 1 } }
        : { unreadByCouple: { increment: 1 } }),
    },
  });

  // Notification email au destinataire
  try {
    if (senderRole === "COUPLE") {
      await sendNewMessageEmail({
        to:              conv.pro.email,
        recipientName:   conv.pro.name,
        senderName:      conv.couple.prenoms,
        messagePreview:  body.trim().slice(0, 120),
        conversationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/messagerie?conv=${id}`,
      });
    } else {
      await sendNewMessageEmail({
        to:              conv.couple.email,
        recipientName:   conv.couple.prenoms,
        senderName:      conv.pro.name,
        messagePreview:  body.trim().slice(0, 120),
        conversationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/messages?conv=${id}`,
      });
    }
  } catch (e) {
    console.error("Email notification failed:", e);
  }

  return NextResponse.json(message, { status: 201 });
}
