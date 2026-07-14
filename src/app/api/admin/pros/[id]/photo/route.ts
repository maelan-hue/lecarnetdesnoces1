import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type P = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const pro = await db.pro.findUnique({ where: { id }, select: { id: true } });
  if (!pro) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

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
    folder:         `carnet-des-noces/profile/${id}`,
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    overwrite:      true,
    public_id:      `profile-${id}`,
  });

  await db.pro.update({
    where: { id },
    data:  { profilePhoto: result.secure_url },
  });

  return NextResponse.json({ url: result.secure_url });
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  await db.pro.update({ where: { id }, data: { profilePhoto: null } });
  return NextResponse.json({ ok: true });
}
