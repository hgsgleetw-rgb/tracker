import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Serve a user's avatar image. Public + cacheable (URL is versioned with ?v=).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true, avatarMime: true },
    });
    if (!user?.avatar) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = new Uint8Array(user.avatar);
    return new Response(body, {
      headers: {
        "Content-Type": user.avatarMime ?? "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("[avatar GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
