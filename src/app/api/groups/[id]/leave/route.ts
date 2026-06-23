import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Leave a group: unlink yourself from your member slot (history is kept).
// The admin/creator can't leave — they delete the group instead.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  try {
    const group = await prisma.group.findFirst({
      where: { clientId: id, members: { some: { userId: auth.user.id } } },
      select: { id: true, userId: true },
    });
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (group.userId === auth.user.id) {
      return NextResponse.json(
        { error: "建立者無法退出，請改用刪除群組" },
        { status: 400 }
      );
    }

    // Unlink the user's member slot; the label + history stay for others.
    await prisma.member.updateMany({
      where: { groupId: group.id, userId: auth.user.id },
      data: { userId: null },
    });

    // Move the user off this group if it was active.
    if (auth.user.activeGroupId === id) {
      const next = await prisma.group.findFirst({
        where: { members: { some: { userId: auth.user.id } } },
        orderBy: { position: "asc" },
        select: { clientId: true },
      });
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { activeGroupId: next?.clientId ?? null },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[leave]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
