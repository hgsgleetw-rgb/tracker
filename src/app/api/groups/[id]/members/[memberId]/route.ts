import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveGroupId } from "@/lib/state";

// Remove a member from a group.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { id, memberId } = await params;
  try {
    const dbGroupId = await resolveGroupId(auth.user.id, id);
    if (!dbGroupId) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    await prisma.member.deleteMany({ where: { groupId: dbGroupId, clientId: memberId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[members DELETE]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
