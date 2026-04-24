import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST — upload une photo (multipart/form-data)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const pro = await db.pro.findUnique({ where: { id: session.sub }, select: { portfolioPhotos: true } });
  if (!pro) return NextResponse.json({ error: "Pro introuvable" }, { status: 404 });
  if (pro.portfolioPhotos.length >= 12) return NextResponse.json({ error: "Maximum 12 photos." }, { status: 400 });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });

  // Vérifier que Cloudinary est configuré
  if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === "dev") {
    return NextResponse.json({ error: "Cloudinary non configuré. Ajoutez vos clés dans .env." }, { status: 503 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder:         `carnet-des-noces/portfolio/${session.sub}`,
    transformation: [{ width: 800, height: 1000, crop: "fill", gravity: "auto" }],
  });

  const updated = await db.pro.update({
    where: { id: session.sub },
    data:  { portfolioPhotos: { push: result.secure_url } },
    select: { portfolioPhotos: true },
  });

  return NextResponse.json({ url: result.secure_url, all: updated.portfolioPhotos });
}

// DELETE — supprimer une photo par URL
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "pro") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { url } = await req.json();
  const pro = await db.pro.findUnique({ where: { id: session.sub }, select: { portfolioPhotos: true } });
  if (!pro) return NextResponse.json({ error: "Pro introuvable" }, { status: 404 });

  const updated = await db.pro.update({
    where: { id: session.sub },
    data:  { portfolioPhotos: pro.portfolioPhotos.filter((p) => p !== url) },
    select: { portfolioPhotos: true },
  });

  return NextResponse.json({ all: updated.portfolioPhotos });
}
