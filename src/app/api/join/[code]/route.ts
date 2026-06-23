import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Preview a group from an invite code: name + which member slots are open.
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
    return NextResponse.json({
      groupId: group.clientId,
      groupName: group.name,
      alreadyMember,
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

// Join the group: claim an existing member slot, or add yourself as new.
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

    // Joining counts as onboarding — skip the intro/tutorial for new users.
    const setActive = () =>
      prisma.user.update({
        where: { id: auth.user.id },
        data: {
          activeGroupId: group.clientId,
          onboarded: true,
          tutorialDone: true,
          userName: auth.user.userName || auth.user.displayName,
        },
      });

    // Already in this group — just switch to it.
    if (group.members.some((m) => m.userId === auth.user.id)) {
      await setActive();
      return NextResponse.json({ ok: true, groupId: group.clientId });
    }

    if (claimMemberId) {
      const target = group.members.find((m) => m.clientId === claimMemberId);
      if (!target) return NextResponse.json({ error: "找不到該成員" }, { status: 404 });
      if (target.userId) return NextResponse.json({ error: "該成員已被認領" }, { status: 409 });
      await prisma.member.update({ where: { id: target.id }, data: { userId: auth.user.id } });
      await setActive();
      return NextResponse.json({ ok: true, groupId: group.clientId });
    }

    // Join as a brand-new member.
    const name = (newName || auth.user.displayName || "我").trim().slice(0, 20);
    const tone = (group.members.length % 6) + 1;
    const clientId = `m_${auth.user.id.slice(-6)}_${group.members.length}`;
    await prisma.member.create({
      data: {
        groupId: group.id,
        clientId,
        name,
        zh: name,
        tone,
        isMe: false,
        position: group.members.length,
        userId: auth.user.id,
      },
    });
    await setActive();
    return NextResponse.json({ ok: true, groupId: group.clientId });
  } catch (e) {
    console.error("[join POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
