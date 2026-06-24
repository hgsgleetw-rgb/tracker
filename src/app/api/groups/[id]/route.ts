import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Delete a group; reassign active group if needed.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  try {
    const remaining = await prisma.group.count({ where: { userId: auth.user.id } });
    if (remaining <= 1) {
      return NextResponse.json({ error: "Cannot delete last group" }, { status: 400 });
    }
    await prisma.group.deleteMany({ where: { userId: auth.user.id, clientId: id } });

    // If the deleted group was active, switch to the earliest remaining one.
    if (auth.user.activeGroupId === id) {
      const next = await prisma.group.findFirst({
        where: { userId: auth.user.id },
        orderBy: { position: "asc" },
        select: { clientId: true },
      });
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { activeGroupId: next?.clientId ?? null },
      });
      return NextResponse.json({ ok: true, activeGroupId: next?.clientId ?? null });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[groups DELETE]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Group-level actions: topup, clear (wipe expenses + pool), markPaid (wipe expenses).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  try {
    const body = (await request.json()) as { action: string; amount?: number; name?: string };
    const group = await prisma.group.findUnique({
      where: { userId_clientId: { userId: auth.user.id, clientId: id } },
      select: { id: true },
    });
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    if (body.action === "rename") {
      const name = (body.name ?? "").trim();
      if (!name) return NextResponse.json({ error: "名稱不可空白" }, { status: 400 });
      await prisma.group.update({
        where: { id: group.id },
        data: { name: name.slice(0, 30) },
      });
    } else if (body.action === "topup") {
      await prisma.group.update({
        where: { id: group.id },
        data: { pool: { increment: Math.round(body.amount ?? 0) } },
      });
    } else if (body.action === "clear") {
      await prisma.expense.deleteMany({ where: { groupId: group.id } });
      await prisma.group.update({ where: { id: group.id }, data: { pool: 0 } });
    } else if (body.action === "markPaid") {
      await prisma.expense.deleteMany({ where: { groupId: group.id } });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[groups PATCH]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
