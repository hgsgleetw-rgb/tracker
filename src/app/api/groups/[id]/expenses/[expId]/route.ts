import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveGroupId, canDeleteExpense } from "@/lib/state";

// Delete an expense from a group.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; expId: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { id, expId } = await params;
  try {
    const dbGroupId = await resolveGroupId(auth.user.id, id);
    if (!dbGroupId) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    // Deletion is unlogged, so only the recorder (payer) — or admin for an
    // unclaimed-label expense — may delete, even for fund expenses.
    const perm = await canDeleteExpense(dbGroupId, expId, auth.user.id);
    if (perm === "denied") {
      return NextResponse.json({ error: "只有記錄的本人能刪除這筆" }, { status: 403 });
    }

    await prisma.expense.deleteMany({ where: { groupId: dbGroupId, clientId: expId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[expenses DELETE]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
