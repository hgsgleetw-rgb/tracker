import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addUserToGroup } from "@/lib/state";

// Approve or reject a join request. Admin (group creator) only.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { id, reqId } = await params;
  try {
    // Only the group's creator (admin) may act on requests.
    const group = await prisma.group.findFirst({
      where: { clientId: id, userId: auth.user.id },
      select: { id: true },
    });
    if (!group) return NextResponse.json({ error: "沒有權限" }, { status: 403 });

    const req = await prisma.joinRequest.findFirst({
      where: { id: reqId, groupId: group.id },
    });
    if (!req) return NextResponse.json({ error: "申請不存在" }, { status: 404 });

    const { action } = (await request.json()) as { action: "approve" | "reject" };

    if (action === "approve") {
      await addUserToGroup(group.id, req.userId, req.requesterName, {
        claimMemberId: req.claimMemberId,
        newName: req.newName,
      });
    } else if (action !== "reject") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await prisma.joinRequest.delete({ where: { id: req.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[requests POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
