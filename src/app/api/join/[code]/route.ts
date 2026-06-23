import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Preview a group from an invite code: name + open member slots + my status.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { code } = await params;
  try {
    const group = await prisma.group.findUnique({
      where: { inviteCode: code },
      include: { members: { orderBy: { position: "asc" } } },
    });
    if (!group) return NextResponse.json({ error: "邀請連結無效" }, { status: 404 });

    const alreadyMember = group.members.some((m) => m.userId === auth.user.id);
    const pending = await prisma.joinRequest.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: auth.user.id } },
      select: { id: true },
    });

    return NextResponse.json({
      groupId: group.clientId,
      groupName: group.name,
      alreadyMember,
      pending: !!pending,
      members: group.members.map((m) => ({
        clientId: m.clientId,
        name: m.name,
        claimed: m.userId !== null,
        isMine: m.userId === auth.user.id,
      })),
    });
  } catch (e) {
    console.error("[join GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Submit a request to join — the group admin must approve it.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { code } = await params;
  try {
    const { claimMemberId, newName } = (await request.json()) as {
      claimMemberId?: string;
      newName?: string;
    };

    const group = await prisma.group.findUnique({
      where: { inviteCode: code },
      include: { members: true },
    });
    if (!group) return NextResponse.json({ error: "邀請連結無效" }, { status: 404 });

    // Already a member — just switch to the group.
    if (group.members.some((m) => m.userId === auth.user.id)) {
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { activeGroupId: group.clientId },
      });
      return NextResponse.json({ status: "member", groupId: group.clientId });
    }

    if (claimMemberId) {
      const target = group.members.find((m) => m.clientId === claimMemberId);
      if (!target) return NextResponse.json({ error: "找不到該成員" }, { status: 404 });
      if (target.userId) return NextResponse.json({ error: "該成員已被認領" }, { status: 409 });
    }

    // Create or refresh the pending request (one per user per group).
    await prisma.joinRequest.upsert({
      where: { groupId_userId: { groupId: group.id, userId: auth.user.id } },
      update: { claimMemberId: claimMemberId ?? null, newName: newName ?? null },
      create: {
        groupId: group.id,
        userId: auth.user.id,
        requesterName: auth.user.displayName,
        claimMemberId: claimMemberId ?? null,
        newName: newName ?? null,
      },
    });

    return NextResponse.json({ status: "pending", groupName: group.name });
  } catch (e) {
    console.error("[join POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
