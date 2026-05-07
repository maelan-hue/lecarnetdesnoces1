import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Fichier image uniquement." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Fichier trop lourd (10 Mo max)." }, { status: 400 });

  if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === "dev") {
    return NextResponse.json({ error: "Cloudinary non configuré." }, { status: 503 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder:         `carnet-des-noces/profile/${session.sub}`,
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    overwrite:      true,
    public_id:      `profile-${session.sub}`,
  });

  await db.pro.update({
    where: { id: session.sub },
    data:  { profilePhoto: result.secure_url },
  });

  return NextResponse.json({ url: result.secure_url });
}

export async function DELETE() {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  await db.pro.update({ where: { id: session.sub }, data: { profilePhoto: null } });
  return NextResponse.json({ ok: true });
}
