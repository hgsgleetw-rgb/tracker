import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { resolveGroupId, upsertExpense, canEditExpense } from "@/lib/state";
import type { Expense } from "@/app/_components/data";

// Add or edit an expense in a group.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  try {
    const { expense } = (await request.json()) as { expense: Expense };
    if (!expense?.id) return NextResponse.json({ error: "Missing expense" }, { status: 400 });

    const dbGroupId = await resolveGroupId(auth.user.id, id);
    if (!dbGroupId) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    // Editing an existing expense is restricted (personal = owner only).
    const perm = await canEditExpense(dbGroupId, expense.id, auth.user.id);
    if (perm === "denied") {
      return NextResponse.json({ error: "只有付款本人能修改這筆" }, { status: 403 });
    }

    await upsertExpense(dbGroupId, expense, auth.user.displayName);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[expenses POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
