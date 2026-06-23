import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Hand the admin role to another real member. Current admin only.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  try {
    const { memberClientId } = (await request.json()) as { memberClientId: string };

    // Must be the current admin (creator) of this group.
    const group = await prisma.group.findFirst({
      where: { clientId: id, userId: auth.user.id },
      include: { members: true },
    });
    if (!group) return NextResponse.json({ error: "沒有權限" }, { status: 403 });

    const target = group.members.find((m) => m.clientId === memberClientId);
    if (!target) return NextResponse.json({ error: "找不到該成員" }, { status: 404 });
    if (!target.userId) {
      return NextResponse.json(
        { error: "只能轉移給有使用 App 的成員" },
        { status: 400 }
      );
    }

    await prisma.group.update({
      where: { id: group.id },
      data: { userId: target.userId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[transfer-admin]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
