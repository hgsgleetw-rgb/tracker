import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveGroupId } from "@/lib/state";
import type { Member } from "@/app/_components/data";

// Add a member to a group.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  try {
    const { member } = (await request.json()) as { member: Member };
    if (!member?.id) return NextResponse.json({ error: "Missing member" }, { status: 400 });

    const dbGroupId = await resolveGroupId(auth.user.id, id);
    if (!dbGroupId) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const count = await prisma.member.count({ where: { groupId: dbGroupId } });
    await prisma.member.create({
      data: {
        groupId: dbGroupId,
        clientId: member.id,
        name: member.name,
        zh: member.zh,
        tone: member.tone,
        isMe: !!member.isMe,
        position: count,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[members POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
