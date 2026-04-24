import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ count: 0 });

  const result = await db.conversation.aggregate({
    where:  { proId: session.sub },
    _sum:   { unreadByPro: true },
  });
  return NextResponse.json({ count: result._sum.unreadByPro ?? 0 });
}
