import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Remove a member from a group. Admin (group creator) only.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { id, memberId } = await params;
  try {
    const group = await prisma.group.findFirst({
      where: { clientId: id, userId: auth.user.id }, // userId == creator == admin
      select: { id: true },
    });
    if (!group) return NextResponse.json({ error: "沒有權限" }, { status: 403 });

    await prisma.member.deleteMany({ where: { groupId: group.id, clientId: memberId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[members DELETE]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
