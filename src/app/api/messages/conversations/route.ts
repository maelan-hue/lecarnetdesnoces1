import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendNewMessageEmail } from "@/lib/email";

// GET — liste des conversations du couple ou du pro connecté
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "couple" && session.role !== "pro")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const where = session.role === "couple"
    ? { coupleId: session.sub }
    : { proId:    session.sub };

  const conversations = await db.conversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      couple:   { select: { prenoms: true } },
      pro:      { select: { name: true, category: true, slug: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json(conversations);
}

// POST — créer une conversation + premier message (couple → un ou plusieurs pros)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "couple") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { proIds, subject, body } = await req.json();
  if (!proIds?.length || !body?.trim()) {
    return NextResponse.json({ error: "Destinataires et message requis." }, { status: 400 });
  }

  const couple = await db.couple.findUnique({
    where: { id: session.sub },
    select: { prenoms: true, email: true, weddingDate: true },
  });
  if (!couple) return NextResponse.json({ error: "Couple introuvable." }, { status: 404 });

  const created: string[] = [];

  for (const proId of proIds) {
    const pro = await db.pro.findUnique({ where: { id: proId }, select: { name: true, email: true } });
    if (!pro) continue;

    // Upsert conversation (un couple ne peut avoir qu'une conv par pro)
    const conv = await db.conversation.upsert({
      where:  { coupleId_proId: { coupleId: session.sub, proId } },
      update: { updatedAt: new Date(), unreadByPro: { increment: 1 } },
      create: { coupleId: session.sub, proId, unreadByPro: 1 },
    });

    await db.message.create({
      data: {
        conversationId: conv.id,
        senderRole: "COUPLE",
        body: body.trim(),
      },
    });

    // Notification email au pro
    try {
      await sendNewMessageEmail({
        to:              pro.email,
        recipientName:   pro.name,
        senderName:      couple.prenoms,
        messageBody:     body.trim(),
        conversationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/messagerie?conv=${conv.id}`,
      });
    } catch (e) {
      console.error("Email notification failed:", e);
    }

    created.push(conv.id);
  }

  return NextResponse.json({ ok: true, conversationIds: created }, { status: 201 });
}
