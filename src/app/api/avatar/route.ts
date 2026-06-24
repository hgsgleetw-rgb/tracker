import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 800 * 1024; // 800KB after decode

// Upload (replace) the signed-in user's avatar. Body: { dataUrl }.
export async function POST(request: Request) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  try {
    const { dataUrl } = (await request.json()) as { dataUrl: string };
    const m = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl ?? "");
    if (!m) return NextResponse.json({ error: "圖片格式不支援" }, { status: 400 });

    const mime = m[1];
    const bytes = Buffer.from(m[3], "base64");
    if (bytes.length === 0) return NextResponse.json({ error: "圖片無效" }, { status: 400 });
    if (bytes.length > MAX_BYTES) {
      return NextResponse.json({ error: "圖片太大（上限 800KB）" }, { status: 413 });
    }

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: { avatar: bytes, avatarMime: mime, avatarVersion: { increment: 1 } },
      select: { id: true, avatarVersion: true },
    });
    return NextResponse.json({
      avatarUrl: `/api/avatar/${updated.id}?v=${updated.avatarVersion}`,
    });
  } catch (e) {
    console.error("[avatar POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
